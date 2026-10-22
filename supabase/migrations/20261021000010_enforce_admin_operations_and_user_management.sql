-- ==============================================================================
-- Migrasi: Enforce Admin Operations and User Management (US-09, BR-06, BR-07, BR-12, Tabel 6.2)
-- 1. Trigger Audit & Validasi Pendaftaran (Konfirmasi Pembayaran & Pembatalan Pendaftaran)
-- 2. Trigger Validasi & Audit Kuota Kursus (BR-06)
-- 3. Trigger Proteksi Peran dan Status Akun Admin (BR-12)
-- 4. Stored Procedures / RPCs untuk Panel Admin
-- ==============================================================================

-- 1. TRIGGER VALIDASI & AUDIT KUOTA KURSUS (BR-06, BR-12)
CREATE OR REPLACE FUNCTION public.fn_validasi_kuota_kursus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kursi_terpakai integer;
  v_role text;
BEGIN
  IF OLD.kuota IS NOT DISTINCT FROM NEW.kuota THEN
    RETURN NEW;
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' AND NOT (v_role = 'instruktur' AND OLD.instruktur_id = auth.uid() AND OLD.status = 'draf') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang boleh mengubah kuota kursus ini (BR-06)';
  END IF;

  IF NEW.kuota < 1 OR NEW.kuota > 100 THEN
    RAISE EXCEPTION 'Kuota kursus harus antara 1 sampai 100 peserta (BR-03)';
  END IF;

  -- Jika kursus terbit, kuota tidak boleh lebih kecil dari kursi terpakai (BR-06)
  IF OLD.status = 'terbit' THEN
    SELECT count(*)::integer INTO v_kursi_terpakai
    FROM public.pendaftaran
    WHERE kursus_id = NEW.id
      AND (
        status IN ('aktif', 'selesai')
        OR (status = 'menunggu_bayar' AND (batas_bayar IS NULL OR batas_bayar > now()))
      );

    IF NEW.kuota < v_kursi_terpakai THEN
      RAISE EXCEPTION 'Kuota tidak boleh lebih kecil dari kursi terpakai (%) (BR-06)', v_kursi_terpakai;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validasi_kuota_kursus ON public.kursus;
CREATE TRIGGER trg_validasi_kuota_kursus
BEFORE UPDATE OF kuota ON public.kursus
FOR EACH ROW
EXECUTE FUNCTION public.fn_validasi_kuota_kursus();


CREATE OR REPLACE FUNCTION public.fn_audit_kuota_kursus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.kuota IS NOT DISTINCT FROM NEW.kuota THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_log (
    pelaku_id,
    aksi,
    nama_tabel,
    id_data,
    data_sebelum,
    data_sesudah,
    dibuat_pada
  ) VALUES (
    auth.uid(),
    'ubah_kuota_kursus',
    'kursus',
    NEW.id,
    jsonb_build_object('kuota', OLD.kuota, 'judul', OLD.judul, 'status', OLD.status),
    jsonb_build_object('kuota', NEW.kuota, 'judul', NEW.judul, 'status', NEW.status),
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_kuota_kursus ON public.kursus;
CREATE TRIGGER trg_audit_kuota_kursus
AFTER UPDATE OF kuota ON public.kursus
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_kuota_kursus();


-- 2. TRIGGER AUDIT DAN LOGGING PENDAFTARAN (BR-07, BR-12)
CREATE OR REPLACE FUNCTION public.fn_audit_status_pendaftaran()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'menunggu_bayar' AND NEW.status = 'aktif' THEN
    v_action := 'konfirmasi_pembayaran';
  ELSIF NEW.status = 'dibatalkan' THEN
    v_action := 'batalkan_pendaftaran';
  ELSIF NEW.status = 'kedaluwarsa' THEN
    v_action := 'kedaluwarsa_pendaftaran';
  ELSIF NEW.status = 'selesai' THEN
    v_action := 'selesai_kursus';
  ELSE
    v_action := 'ubah_status_pendaftaran';
  END IF;

  INSERT INTO public.audit_log (
    pelaku_id,
    aksi,
    nama_tabel,
    id_data,
    data_sebelum,
    data_sesudah,
    dibuat_pada
  ) VALUES (
    auth.uid(),
    v_action,
    'pendaftaran',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW),
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_status_pendaftaran ON public.pendaftaran;
CREATE TRIGGER trg_audit_status_pendaftaran
AFTER UPDATE OF status ON public.pendaftaran
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_status_pendaftaran();


-- 3. TRIGGER PROTEKSI PERAN DAN STATUS AKUN ADMIN (BR-12)
CREATE OR REPLACE FUNCTION public.fn_validasi_dan_audit_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid;
  v_caller_role text;
BEGIN
  v_current_user_id := auth.uid();
  v_caller_role := public.current_user_role();

  -- Validasi Perubahan Peran (BR-12)
  IF OLD.peran IS DISTINCT FROM NEW.peran THEN
    IF v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Akses ditolak: Hanya admin yang boleh mengubah peran akun (BR-12)';
    END IF;

    -- Admin tidak boleh menurunkan perannya sendiri
    IF v_current_user_id = OLD.id AND NEW.peran != 'admin' THEN
      RAISE EXCEPTION 'Admin tidak boleh menurunkan peran akunnya sendiri (BR-12)';
    END IF;

    INSERT INTO public.audit_log (
      pelaku_id,
      aksi,
      nama_tabel,
      id_data,
      data_sebelum,
      data_sesudah,
      dibuat_pada
    ) VALUES (
      v_current_user_id,
      'ubah_peran_pengguna',
      'profiles',
      NEW.id,
      jsonb_build_object('peran', OLD.peran, 'email', OLD.email, 'nama', OLD.nama_lengkap),
      jsonb_build_object('peran', NEW.peran, 'email', NEW.email, 'nama', NEW.nama_lengkap),
      now()
    );
  END IF;

  -- Validasi Perubahan Status Aktif (BR-12)
  IF OLD.aktif IS DISTINCT FROM NEW.aktif THEN
    IF v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Akses ditolak: Hanya admin yang boleh mengubah status aktifitas pengguna (BR-12)';
    END IF;

    -- Admin tidak boleh menonaktifkan akunnya sendiri
    IF v_current_user_id = OLD.id AND NEW.aktif = false THEN
      RAISE EXCEPTION 'Admin tidak boleh menonaktifkan akunnya sendiri (BR-12)';
    END IF;

    INSERT INTO public.audit_log (
      pelaku_id,
      aksi,
      nama_tabel,
      id_data,
      data_sebelum,
      data_sesudah,
      dibuat_pada
    ) VALUES (
      v_current_user_id,
      'ubah_status_pengguna',
      'profiles',
      NEW.id,
      jsonb_build_object('aktif', OLD.aktif, 'email', OLD.email, 'nama', OLD.nama_lengkap),
      jsonb_build_object('aktif', NEW.aktif, 'email', NEW.email, 'nama', NEW.nama_lengkap),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validasi_dan_audit_profiles ON public.profiles;
CREATE TRIGGER trg_validasi_dan_audit_profiles
BEFORE UPDATE OF peran, aktif ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_validasi_dan_audit_profiles();


-- 4. RPCS UNTUK OPERASIONAL ADMIN (BR-06, BR-07, BR-12)

-- A. Konfirmasi Pembayaran oleh Admin
CREATE OR REPLACE FUNCTION public.admin_konfirmasi_pembayaran(p_pendaftaran_id uuid)
RETURNS public.pendaftaran
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_pendaftaran public.pendaftaran;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak mengonfirmasi pembayaran (BR-07, BR-12)';
  END IF;

  SELECT * INTO v_pendaftaran FROM public.pendaftaran WHERE id = p_pendaftaran_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  IF v_pendaftaran.status != 'menunggu_bayar' THEN
    RAISE EXCEPTION 'Hanya pendaftaran berstatus menunggu_bayar yang dapat dikonfirmasi (status saat ini: %) (Tabel 6.2)', v_pendaftaran.status;
  END IF;

  IF v_pendaftaran.batas_bayar IS NOT NULL AND now() > v_pendaftaran.batas_bayar THEN
    RAISE EXCEPTION 'Pembayaran ditolak: Pendaftaran sudah melewati batas waktu pembayaran (Tabel 6.2, BR-07)';
  END IF;

  UPDATE public.pendaftaran
  SET status = 'aktif',
      dibayar_pada = now(),
      dikonfirmasi_oleh = auth.uid()
  WHERE id = p_pendaftaran_id
  RETURNING * INTO v_pendaftaran;

  RETURN v_pendaftaran;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_konfirmasi_pembayaran(uuid) TO authenticated;


-- B. Pembatalan Pendaftaran oleh Admin
CREATE OR REPLACE FUNCTION public.admin_batalkan_pendaftaran(
  p_pendaftaran_id uuid,
  p_alasan text
)
RETURNS public.pendaftaran
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_pendaftaran public.pendaftaran;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak membatalkan pendaftaran (BR-07, BR-12)';
  END IF;

  SELECT * INTO v_pendaftaran FROM public.pendaftaran WHERE id = p_pendaftaran_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  IF v_pendaftaran.status IN ('selesai', 'kedaluwarsa', 'dibatalkan') THEN
    RAISE EXCEPTION 'Status pendaftaran "%" adalah status akhir dan tidak dapat dibatalkan lagi (Tabel 6.2 PRD)', v_pendaftaran.status;
  END IF;

  IF v_pendaftaran.status = 'aktif' THEN
    IF p_alasan IS NULL OR length(trim(p_alasan)) < 10 THEN
      RAISE EXCEPTION 'Pembatalan pendaftaran aktif wajib menyertakan alasan minimal 10 karakter (BR-07)';
    END IF;
  END IF;

  UPDATE public.pendaftaran
  SET status = 'dibatalkan',
      alasan_batal = trim(p_alasan),
      dibatalkan_pada = now()
  WHERE id = p_pendaftaran_id
  RETURNING * INTO v_pendaftaran;

  RETURN v_pendaftaran;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_batalkan_pendaftaran(uuid, text) TO authenticated;


-- C. Ubah Kuota Kursus oleh Admin (BR-06)
CREATE OR REPLACE FUNCTION public.admin_ubah_kuota_kursus(
  p_kursus_id uuid,
  p_kuota_baru integer
)
RETURNS public.kursus
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_kursus public.kursus;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak mengubah kuota kursus (BR-06, BR-12)';
  END IF;

  SELECT * INTO v_kursus FROM public.kursus WHERE id = p_kursus_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  -- Trigger trg_validasi_kuota_kursus akan memvalidasi rentang 1-100 dan kursi terpakai
  UPDATE public.kursus
  SET kuota = p_kuota_baru,
      diubah_pada = now()
  WHERE id = p_kursus_id
  RETURNING * INTO v_kursus;

  RETURN v_kursus;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_kuota_kursus(uuid, integer) TO authenticated;


-- D. Ubah Peran Pengguna oleh Admin (BR-12)
CREATE OR REPLACE FUNCTION public.admin_ubah_peran_pengguna(
  p_user_id uuid,
  p_peran_baru text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_profile public.profiles;
  v_target_peran public.peran_enum;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak mengubah peran akun (BR-12)';
  END IF;

  IF auth.uid() = p_user_id AND p_peran_baru != 'admin' THEN
    RAISE EXCEPTION 'Admin tidak boleh menurunkan peran akunnya sendiri (BR-12)';
  END IF;

  BEGIN
    v_target_peran := p_peran_baru::public.peran_enum;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Peran tidak valid: %. Harus peserta, instruktur, atau admin', p_peran_baru;
  END;

  UPDATE public.profiles
  SET peran = v_target_peran
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_peran_pengguna(uuid, text) TO authenticated;


-- E. Ubah Status Aktif Pengguna oleh Admin (BR-12)
CREATE OR REPLACE FUNCTION public.admin_ubah_status_pengguna(
  p_user_id uuid,
  p_aktif boolean
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak mengubah status aktifitas pengguna (BR-12)';
  END IF;

  IF auth.uid() = p_user_id AND p_aktif = false THEN
    RAISE EXCEPTION 'Admin tidak boleh menonaktifkan akunnya sendiri (BR-12)';
  END IF;

  UPDATE public.profiles
  SET aktif = p_aktif
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_status_pengguna(uuid, boolean) TO authenticated;
