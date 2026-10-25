-- ============================================================================
-- Migrasi: 20261025000017_database_hardening_security_definer.sql
-- Tujuan: Pengerasan Keamanan Seluruh Fungsi SECURITY DEFINER di Schema Public
-- Aturan Terpenuhi:
--   1. Pasang SET search_path = public, extensions, pg_temp pada seluruh fungsi SECURITY DEFINER.
--   2. REVOKE hak eksekusi dari PUBLIC dan anon pada seluruh fungsi SECURITY DEFINER.
--   3. GRANT hanya ke role yang berhak (authenticated untuk RPC klien, anon untuk RPC publik).
--   4. Cabut hak eksekusi trigger functions dari PUBLIC, anon, dan authenticated.
--   5. generate_sertifikat: Tambahkan pengecekan otorisasi pemilik pendaftaran atau admin.
--   6. fn_validasi_kuota_kursus: Kuota baru tidak boleh di bawah kursi terpakai pada status APA PUN.
--   7. verify_certificate_status: Fungsi verifikasi status sertifikat yang aman untuk publik (anon).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNGSI BARU: verify_certificate_status (Dapat diakses Publik / Anon)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_certificate_status(p_identifier text)
RETURNS TABLE (
  valid boolean,
  nomor_sertifikat text,
  nama_peserta text,
  judul_kursus text,
  diterbitkan_pada timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS valid,
    s.nomor_sertifikat,
    s.nama_peserta,
    s.judul_kursus,
    s.diterbitkan_pada
  FROM public.sertifikat s
  WHERE s.nomor_sertifikat = p_identifier
     OR (p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND s.id = p_identifier::uuid)
  LIMIT 1;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. PEMBARUAN: generate_sertifikat (Dengan Validasi Otorisasi Pemilik / Admin)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_sertifikat(p_pendaftaran_id uuid)
RETURNS public.sertifikat
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_pendaftaran RECORD;
  v_tahun smallint;
  v_nomor_urut integer;
  v_nomor_sertifikat text;
  v_sertifikat public.sertifikat;
BEGIN
  -- Cek jika sudah pernah terbit (idempotent, BR-11: 1 pendaftaran hanya 1 sertifikat)
  SELECT * INTO v_sertifikat FROM public.sertifikat WHERE pendaftaran_id = p_pendaftaran_id;
  IF FOUND THEN
    -- Validasi Otorisasi Pemanggil jika sudah pernah terbit (BR-12)
    IF auth.uid() IS NOT NULL THEN
      SELECT * INTO v_pendaftaran FROM public.pendaftaran WHERE id = p_pendaftaran_id;
      IF auth.uid() != v_pendaftaran.peserta_id AND public.current_user_role() != 'admin' THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki izin untuk mengakses sertifikat pendaftaran ini (BR-12)';
      END IF;
    END IF;
    RETURN v_sertifikat;
  END IF;

  SELECT p.*, prof.nama_lengkap AS nama_peserta, k.judul AS judul_kursus
  INTO v_pendaftaran
  FROM public.pendaftaran p
  JOIN public.profiles prof ON prof.id = p.peserta_id
  JOIN public.kursus k ON k.id = p.kursus_id
  WHERE p.id = p_pendaftaran_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  -- Validasi Otorisasi Pemanggil (BR-12):
  -- Jika dipanggil dalam konteks terautentikasi klien, pemanggil WAJIB peserta pemilik atau admin
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() != v_pendaftaran.peserta_id AND public.current_user_role() != 'admin' THEN
      RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki izin untuk menerbitkan sertifikat pendaftaran ini (BR-12)';
    END IF;
  END IF;

  v_tahun := EXTRACT(YEAR FROM now())::smallint;

  -- Kunci pencacah nomor urut per tahun agar tidak dobel nomor
  PERFORM pg_advisory_xact_lock(v_tahun::bigint);

  SELECT COALESCE(MAX(nomor_urut), 0) + 1 INTO v_nomor_urut 
  FROM public.sertifikat 
  WHERE tahun = v_tahun;

  v_nomor_sertifikat := 'PA-' || v_tahun || '-' || LPAD(v_nomor_urut::text, 4, '0');

  INSERT INTO public.sertifikat (
    pendaftaran_id,
    tahun,
    nomor_urut,
    nomor_sertifikat,
    nama_peserta,
    judul_kursus,
    diterbitkan_pada
  ) VALUES (
    p_pendaftaran_id,
    v_tahun,
    v_nomor_urut,
    v_nomor_sertifikat,
    v_pendaftaran.nama_peserta,
    v_pendaftaran.judul_kursus,
    now()
  ) RETURNING * INTO v_sertifikat;

  RETURN v_sertifikat;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. PEMBARUAN: fn_validasi_kuota_kursus (Validasi Kuota Kursus pada Status APA PUN)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validasi_kuota_kursus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
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

  -- Kuota baru tidak boleh di bawah kursi terpakai pada status kursus APA PUN (BR-06)
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

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. PASANG SET search_path = public, extensions, pg_temp PADA SEMUA FUNGSI
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.admin_batalkan_pendaftaran(uuid, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.admin_konfirmasi_pembayaran(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.admin_ubah_kuota_kursus(uuid, integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.admin_ubah_peran_pengguna(uuid, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.admin_ubah_status_kursus(uuid, text, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.admin_ubah_status_pengguna(uuid, boolean) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.ajukan_kursus_instruktur(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.batalkan_pendaftaran_peserta(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.current_user_role() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.daftar_kursus(uuid, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_audit_kuota_kursus() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_audit_status_kursus() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_audit_status_pendaftaran() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_kunci_konten_modul() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_kunci_konten_soal() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_validasi_dan_audit_profiles() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_validasi_kuota_kursus() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_validasi_sertifikat() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_validasi_status_kursus() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_validasi_status_pendaftaran() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.generate_sertifikat(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_admin_dashboard_analytics(timestamptz, timestamptz) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_kursus_katalog() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_pendaftaran_saya(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_peserta_dan_nilai_kursus(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_ruang_belajar(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_sertifikat_detail(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_soal_kuis(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.handle_new_user_email_confirm() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_instruktur_kursus(uuid, uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_peserta_kursus(uuid, uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_kuis(uuid, uuid, jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.tandai_materi_dibaca(uuid, uuid) SET search_path = public, extensions, pg_temp;

-- ----------------------------------------------------------------------------
-- 5. REVOKE DARI PUBLIC DAN anon PADA SELURUH FUNGSI SECURITY DEFINER
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_batalkan_pendaftaran(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_konfirmasi_pembayaran(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ubah_kuota_kursus(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ubah_peran_pengguna(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ubah_status_kursus(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ubah_status_pengguna(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ajukan_kursus_instruktur(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.batalkan_pendaftaran_peserta(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.daftar_kursus(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_audit_kuota_kursus() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_audit_status_kursus() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_audit_status_pendaftaran() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_kunci_konten_modul() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_kunci_konten_soal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_validasi_dan_audit_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_validasi_kuota_kursus() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_validasi_sertifikat() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_validasi_status_kursus() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_validasi_status_pendaftaran() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_sertifikat(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_analytics(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_kursus_katalog() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_pendaftaran_saya(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_peserta_dan_nilai_kursus(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ruang_belajar(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_sertifikat_detail(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_soal_kuis(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_email_confirm() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_instruktur_kursus(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_peserta_kursus(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_kuis(uuid, uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tandai_materi_dibaca(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_certificate_status(text) FROM PUBLIC, anon;

-- ----------------------------------------------------------------------------
-- 6. GRANT HANYA KEPADA ROLE YANG MEMBUTUHKAN
-- ----------------------------------------------------------------------------

-- A. Role authenticated (Pengguna login yang memanggil RPC)
GRANT EXECUTE ON FUNCTION public.admin_batalkan_pendaftaran(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_konfirmasi_pembayaran(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ubah_kuota_kursus(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ubah_peran_pengguna(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ubah_status_kursus(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ubah_status_pengguna(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ajukan_kursus_instruktur(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batalkan_pendaftaran_peserta(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.daftar_kursus(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sertifikat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_analytics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kursus_katalog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pendaftaran_saya(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_peserta_dan_nilai_kursus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ruang_belajar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sertifikat_detail(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_soal_kuis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instruktur_kursus(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_peserta_kursus(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_kuis(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tandai_materi_dibaca(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate_status(text) TO authenticated;

-- B. Role anon (Akses publik tanpa login & helper RLS untuk tabel publik)
GRANT EXECUTE ON FUNCTION public.get_kursus_katalog() TO anon;
GRANT EXECUTE ON FUNCTION public.verify_certificate_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_peserta_kursus(uuid, uuid) TO anon;
