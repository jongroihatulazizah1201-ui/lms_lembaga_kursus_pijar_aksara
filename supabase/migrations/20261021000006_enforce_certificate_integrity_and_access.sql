-- ==============================================================================
-- Migrasi: Enforce Certificate Integrity and Access Security (US-05, BR-11, BR-12)
-- 1. Pengetatan RLS Tabel sertifikat: Hanya pemilik, instruktur kursus, atau admin
-- 2. Trigger Immutability & Validasi Terbit: Mencegah perubahan/penghapusan sertifikat
-- 3. RPC get_sertifikat_detail: Mengambil data sertifikat lengkap dengan proteksi BR-12
-- ==============================================================================

-- 1. RLS TABEL SERTIFIKAT
ALTER TABLE public.sertifikat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sertifikat_select ON public.sertifikat;
CREATE POLICY sertifikat_select ON public.sertifikat
FOR SELECT TO authenticated
USING (
  -- Peserta pemilik pendaftaran
  EXISTS (
    SELECT 1 FROM public.pendaftaran p
    WHERE p.id = sertifikat.pendaftaran_id
      AND p.peserta_id = auth.uid()
  )
  OR
  -- Instruktur pemilik kursus
  EXISTS (
    SELECT 1 FROM public.pendaftaran p
    JOIN public.kursus k ON k.id = p.kursus_id
    WHERE p.id = sertifikat.pendaftaran_id
      AND k.instruktur_id = auth.uid()
  )
  OR
  -- Admin
  (
    (auth.jwt() -> 'user_metadata' ->> 'peran') = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND peran = 'admin')
  )
);

-- Mencegah INSERT, UPDATE, DELETE langsung dari client API (Hanya fungsi SECURITY DEFINER yang boleh)
DROP POLICY IF EXISTS sertifikat_insert_deny ON public.sertifikat;
CREATE POLICY sertifikat_insert_deny ON public.sertifikat
FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS sertifikat_update_deny ON public.sertifikat;
CREATE POLICY sertifikat_update_deny ON public.sertifikat
FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS sertifikat_delete_deny ON public.sertifikat;
CREATE POLICY sertifikat_delete_deny ON public.sertifikat
FOR DELETE TO authenticated
USING (false);


-- 2. TRIGGER VALIDASI & IMMUTABILITY SERTIFIKAT (BR-11)
CREATE OR REPLACE FUNCTION public.fn_validasi_sertifikat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pendaftaran RECORD;
  v_modul_belum_lulus integer;
BEGIN
  -- A. Mencegah Update dan Delete (Sertifikat bersifat permanen dan tidak dapat diubah)
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Sertifikat kelulusan bersifat permanen dan tidak dapat diubah (BR-11)';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Sertifikat kelulusan tidak dapat dihapus setelah diterbitkan (BR-11)';
  END IF;

  -- B. Validasi Saat INSERT (Terbit Otomatis saat selesai)
  IF TG_OP = 'INSERT' THEN
    -- Periksa pendaftaran
    SELECT p.*, k.id AS kursus_id
    INTO v_pendaftaran
    FROM public.pendaftaran p
    JOIN public.kursus k ON k.id = p.kursus_id
    WHERE p.id = NEW.pendaftaran_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pendaftaran tidak valid untuk penerbitan sertifikat';
    END IF;

    -- Status pendaftaran harus 'selesai' (BR-11)
    IF v_pendaftaran.status != 'selesai' THEN
      RAISE EXCEPTION 'Sertifikat hanya dapat diterbitkan untuk pendaftaran berstatus selesai (BR-11)';
    END IF;

    -- Semua modul harus sudah lulus
    SELECT COUNT(*) INTO v_modul_belum_lulus
    FROM public.modul m
    LEFT JOIN public.progres_modul pm 
      ON pm.modul_id = m.id 
      AND pm.pendaftaran_id = NEW.pendaftaran_id 
      AND pm.lulus_pada IS NOT NULL
    WHERE m.kursus_id = v_pendaftaran.kursus_id
      AND pm.id IS NULL;

    IF v_modul_belum_lulus > 0 THEN
      RAISE EXCEPTION 'Sertifikat tidak dapat diterbitkan karena masih ada modul yang belum lulus (BR-11)';
    END IF;

    -- Format nomor sertifikat harus PA-TAHUN-NOMOR
    IF NEW.nomor_sertifikat !~ '^PA-[0-9]{4}-[0-9]{4,}$' THEN
      RAISE EXCEPTION 'Format nomor sertifikat tidak valid. Wajib berformat PA-TAHUN-NOMOR (contoh: PA-2026-0001) (BR-11)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validasi_sertifikat ON public.sertifikat;
CREATE TRIGGER trg_validasi_sertifikat
BEFORE INSERT OR UPDATE OR DELETE ON public.sertifikat
FOR EACH ROW
EXECUTE FUNCTION public.fn_validasi_sertifikat();


-- 3. RPC GET SERTIFIKAT DETAIL (BR-11, BR-12)
CREATE OR REPLACE FUNCTION public.get_sertifikat_detail(p_identifier text)
RETURNS TABLE (
  id uuid,
  pendaftaran_id uuid,
  nomor_sertifikat text,
  nama_peserta text,
  judul_kursus text,
  kategori text,
  diterbitkan_pada timestamptz,
  instruktur_nama text,
  peserta_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_peran text;
  v_sertifikat_rec RECORD;
  v_is_uuid boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  SELECT p.peran INTO v_peran FROM public.profiles p WHERE p.id = v_user_id;

  -- Cek apakah p_identifier adalah UUID atau nomor_sertifikat
  v_is_uuid := p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  SELECT 
    s.id,
    s.pendaftaran_id,
    s.nomor_sertifikat,
    s.nama_peserta,
    s.judul_kursus,
    k.kategori,
    s.diterbitkan_pada,
    prof_instruktur.nama_lengkap AS instruktur_nama,
    prof_peserta.email AS peserta_email,
    p.peserta_id,
    k.instruktur_id
  INTO v_sertifikat_rec
  FROM public.sertifikat s
  JOIN public.pendaftaran p ON p.id = s.pendaftaran_id
  JOIN public.kursus k ON k.id = p.kursus_id
  JOIN public.profiles prof_instruktur ON prof_instruktur.id = k.instruktur_id
  JOIN public.profiles prof_peserta ON prof_peserta.id = p.peserta_id
  WHERE 
    (v_is_uuid AND (s.id = p_identifier::uuid OR s.pendaftaran_id = p_identifier::uuid))
    OR (NOT v_is_uuid AND s.nomor_sertifikat = p_identifier);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sertifikat tidak ditemukan';
  END IF;

  -- Validasi Otorisasi (BR-12): Hanya peserta pemilik, instruktur pengampu, atau admin
  IF v_user_id != v_sertifikat_rec.peserta_id 
     AND v_user_id != v_sertifikat_rec.instruktur_id 
     AND v_peran != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki izin untuk melihat sertifikat ini (BR-12)';
  END IF;

  RETURN QUERY SELECT 
    v_sertifikat_rec.id,
    v_sertifikat_rec.pendaftaran_id,
    v_sertifikat_rec.nomor_sertifikat,
    v_sertifikat_rec.nama_peserta,
    v_sertifikat_rec.judul_kursus,
    v_sertifikat_rec.kategori,
    v_sertifikat_rec.diterbitkan_pada,
    v_sertifikat_rec.instruktur_nama,
    v_sertifikat_rec.peserta_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sertifikat_detail(text) TO authenticated;

-- 4. PENCEGAHAN REKURSI INFINIT PADA RLS KURSUS DAN PENDAFTARAN
CREATE OR REPLACE FUNCTION public.is_instruktur_kursus(p_kursus_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kursus WHERE id = p_kursus_id AND instruktur_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_peserta_kursus(p_kursus_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pendaftaran 
    WHERE kursus_id = p_kursus_id 
      AND peserta_id = p_user_id 
      AND status IN ('aktif', 'selesai')
  );
$$;

DROP POLICY IF EXISTS kursus_select ON public.kursus;
CREATE POLICY kursus_select ON public.kursus
FOR SELECT TO public
USING (
  (status = 'terbit'::status_kursus_enum)
  OR ((auth.uid() IS NOT NULL) AND (instruktur_id = auth.uid()))
  OR (current_user_role() = 'admin'::text)
  OR ((auth.uid() IS NOT NULL) AND public.is_peserta_kursus(id, auth.uid()))
);

DROP POLICY IF EXISTS pendaftaran_select ON public.pendaftaran;
CREATE POLICY pendaftaran_select ON public.pendaftaran
FOR SELECT TO authenticated
USING (
  (peserta_id = auth.uid())
  OR (current_user_role() = 'admin'::text)
  OR ((auth.uid() IS NOT NULL) AND public.is_instruktur_kursus(kursus_id, auth.uid()))
);

