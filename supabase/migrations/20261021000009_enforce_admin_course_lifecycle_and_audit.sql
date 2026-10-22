-- ==============================================================================
-- Migrasi: Enforce Admin Course Lifecycle and Audit Logging (US-08, BR-01, BR-02, BR-12)
-- 1. Trigger Audit Log Otomatis untuk Perubahan Status Kursus (BR-12)
-- 2. RPC admin_ubah_status_kursus: Otoritas admin mengubah status kursus
-- ==============================================================================

-- 1. TRIGGER AUDIT LOG PERUBAHAN STATUS KURSUS (BR-12)
CREATE OR REPLACE FUNCTION public.fn_audit_status_kursus()
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

  -- Tentukan label aksi audit log yang deskriptif
  IF OLD.status = 'draf' AND NEW.status = 'ditinjau' THEN
    v_action := 'ajukan_kursus';
  ELSIF OLD.status = 'ditinjau' AND NEW.status = 'terbit' THEN
    v_action := 'terbitkan_kursus';
  ELSIF OLD.status = 'ditinjau' AND NEW.status = 'draf' THEN
    v_action := 'kembalikan_kursus';
  ELSIF OLD.status = 'terbit' AND NEW.status = 'ditutup' THEN
    v_action := 'tutup_kursus';
  ELSIF OLD.status = 'ditutup' AND NEW.status = 'terbit' THEN
    v_action := 'buka_kursus';
  ELSE
    v_action := 'ubah_status_kursus';
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
    'kursus',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW),
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_status_kursus ON public.kursus;
CREATE TRIGGER trg_audit_status_kursus
AFTER UPDATE OF status ON public.kursus
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_status_kursus();


-- 2. RPC ADMIN UBAH STATUS KURSUS (BR-02, Tabel 6.1)
CREATE OR REPLACE FUNCTION public.admin_ubah_status_kursus(
  p_kursus_id uuid,
  p_status_baru text,
  p_catatan text DEFAULT NULL
)
RETURNS public.kursus
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_kursus public.kursus;
  v_target_status public.status_kursus_enum;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak melakukan aksi ini (BR-02)';
  END IF;

  SELECT * INTO v_kursus FROM public.kursus WHERE id = p_kursus_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  v_target_status := p_status_baru::public.status_kursus_enum;

  -- Update status & catatan. Trigger trg_validasi_status_kursus akan memvalidasi aturan Tabel 6.1
  UPDATE public.kursus
  SET status = v_target_status,
      catatan_tinjauan = CASE 
        WHEN v_target_status = 'draf' THEN p_catatan
        WHEN v_target_status = 'terbit' THEN NULL
        ELSE catatan_tinjauan
      END,
      diubah_pada = now()
  WHERE id = p_kursus_id
  RETURNING * INTO v_kursus;

  RETURN v_kursus;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_status_kursus(uuid, text, text) TO authenticated;
