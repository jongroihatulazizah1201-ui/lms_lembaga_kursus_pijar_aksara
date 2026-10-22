-- ==============================================================================
-- Migrasi: Enforce Course Content Lock & Instructor Workspace (US-06, BR-02, BR-03, BR-04, BR-12)
-- 1. Trigger BR-04: Penguncian Modul, Materi, dan Soal setelah status diajukan (selain draf)
-- 2. Trigger BR-04: Penguncian Atribut Inti Kursus setelah diajukan
-- 3. RPC ajukan_kursus_instruktur: Otoritas instruktur pemilik mengajukan kursus (draf -> ditinjau)
-- 4. RLS Policy Modul & Soal: Memastikan instruktur pemilik dapat mengelola isi kursus miliknya
-- ==============================================================================

-- 1. TRIGGER PENGUNCIAN MODUL DAN MATERI (BR-04)
CREATE OR REPLACE FUNCTION public.fn_kunci_konten_modul()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kursus_status public.status_kursus_enum;
  v_kursus_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_kursus_id := OLD.kursus_id;
  ELSE
    v_kursus_id := NEW.kursus_id;
  END IF;

  SELECT status INTO v_kursus_status 
  FROM public.kursus 
  WHERE id = v_kursus_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  IF v_kursus_status != 'draf' THEN
    RAISE EXCEPTION 'Modul dan materi hanya dapat ditambah, diubah, atau dihapus saat kursus berstatus draf (BR-04)';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_kunci_konten_modul ON public.modul;
CREATE TRIGGER trg_kunci_konten_modul
BEFORE INSERT OR UPDATE OR DELETE ON public.modul
FOR EACH ROW
EXECUTE FUNCTION public.fn_kunci_konten_modul();


-- 2. TRIGGER PENGUNCIAN SOAL KUIS (BR-04)
CREATE OR REPLACE FUNCTION public.fn_kunci_konten_soal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kursus_status public.status_kursus_enum;
  v_modul_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_modul_id := OLD.modul_id;
  ELSE
    v_modul_id := NEW.modul_id;
  END IF;

  SELECT k.status INTO v_kursus_status 
  FROM public.modul m
  JOIN public.kursus k ON k.id = m.kursus_id
  WHERE m.id = v_modul_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modul kursus tidak ditemukan';
  END IF;

  IF v_kursus_status != 'draf' THEN
    RAISE EXCEPTION 'Soal kuis hanya dapat ditambah, diubah, atau dihapus saat kursus berstatus draf (BR-04)';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_kunci_konten_soal ON public.soal;
CREATE TRIGGER trg_kunci_konten_soal
BEFORE INSERT OR UPDATE OR DELETE ON public.soal
FOR EACH ROW
EXECUTE FUNCTION public.fn_kunci_konten_soal();


-- 3. RPC AJUKAN KURSUS INSTRUKTUR (BR-02, BR-03)
CREATE OR REPLACE FUNCTION public.ajukan_kursus_instruktur(p_kursus_id uuid)
RETURNS public.kursus
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_kursus public.kursus;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();

  SELECT * INTO v_kursus FROM public.kursus WHERE id = p_kursus_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  -- Validasi kepemilikan instruktur (BR-02, BR-12)
  IF v_role != 'admin' AND v_kursus.instruktur_id != v_user_id THEN
    RAISE EXCEPTION 'Pengajuan ditolak: Hanya instruktur pemilik yang boleh mengajukan kursus untuk ditinjau (BR-02)';
  END IF;

  IF v_kursus.status != 'draf' THEN
    RAISE EXCEPTION 'Hanya kursus berstatus draf yang dapat diajukan untuk ditinjau (saat ini: %)', v_kursus.status;
  END IF;

  -- Update status ke ditinjau. Trigger trg_validasi_status_kursus akan mengecek BR-03
  UPDATE public.kursus
  SET status = 'ditinjau',
      diajukan_pada = now(),
      diubah_pada = now()
  WHERE id = p_kursus_id
  RETURNING * INTO v_kursus;

  RETURN v_kursus;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ajukan_kursus_instruktur(uuid) TO authenticated;


-- 4. PENYEMPURNAAN RLS MODUL DAN SOAL UNTUK INSTRUKTUR
-- Memastikan instruktur pemilik dapat melihat dan mengelola modul/soal kursusnya
DROP POLICY IF EXISTS modul_instruktur_all ON public.modul;
CREATE POLICY modul_instruktur_all ON public.modul
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kursus k
    WHERE k.id = modul.kursus_id
      AND (k.instruktur_id = auth.uid() OR public.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kursus k
    WHERE k.id = modul.kursus_id
      AND (k.instruktur_id = auth.uid() OR public.current_user_role() = 'admin')
  )
);

DROP POLICY IF EXISTS soal_instruktur_all ON public.soal;
CREATE POLICY soal_instruktur_all ON public.soal
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modul m
    JOIN public.kursus k ON k.id = m.kursus_id
    WHERE m.id = soal.modul_id
      AND (k.instruktur_id = auth.uid() OR public.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modul m
    JOIN public.kursus k ON k.id = m.kursus_id
    WHERE m.id = soal.modul_id
      AND (k.instruktur_id = auth.uid() OR public.current_user_role() = 'admin')
  )
);
