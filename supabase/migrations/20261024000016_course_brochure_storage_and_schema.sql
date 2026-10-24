-- ========================================================
-- MIGRATION 20261024000016: COURSE BROCHURE STORAGE & SCHEMA
-- Menambahkan bucket storage kursus_brosur, kolom gambar_url pada tabel kursus,
-- serta memperbarui get_kursus_katalog RPC untuk menyertakan gambar_url
-- ========================================================

-- 1. Buat bucket storage publik untuk media brosur / pamflet kursus (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kursus_brosur',
  'kursus_brosur',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Kebijakan RLS Storage Objects
DO $$ BEGIN
  CREATE POLICY "Public Access Kursus Brosur"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kursus_brosur');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Instruktur dan Admin Upload Kursus Brosur"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kursus_brosur' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.peran IN ('instruktur', 'admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Instruktur dan Admin Update Kursus Brosur"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'kursus_brosur' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.peran IN ('instruktur', 'admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Instruktur dan Admin Delete Kursus Brosur"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kursus_brosur' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.peran IN ('instruktur', 'admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Tambahkan kolom gambar_url pada tabel public.kursus
ALTER TABLE public.kursus ADD COLUMN IF NOT EXISTS gambar_url text;

-- 4. Perbarui function get_kursus_katalog agar mengembalikan gambar_url
DROP FUNCTION IF EXISTS public.get_kursus_katalog();

CREATE OR REPLACE FUNCTION public.get_kursus_katalog()
RETURNS TABLE (
  id uuid,
  judul text,
  slug text,
  kategori text,
  ringkasan text,
  deskripsi text,
  harga integer,
  kuota integer,
  nilai_lulus smallint,
  status public.status_kursus_enum,
  diajukan_pada timestamptz,
  diterbitkan_pada timestamptz,
  instruktur_id uuid,
  instruktur_nama text,
  kursi_terpakai bigint,
  sisa_kursi bigint,
  gambar_url text
) AS $$
  SELECT 
    k.id,
    k.judul,
    k.slug,
    k.kategori,
    k.ringkasan,
    k.deskripsi,
    k.harga,
    k.kuota,
    k.nilai_lulus,
    k.status,
    k.diajukan_pada,
    k.diterbitkan_pada,
    k.instruktur_id,
    p.nama_lengkap as instruktur_nama,
    coalesce(count(pd.id) FILTER (
      WHERE pd.status IN ('aktif', 'selesai') 
      OR (pd.status = 'menunggu_bayar' AND (pd.batas_bayar IS NULL OR pd.batas_bayar > now()))
    ), 0) as kursi_terpakai,
    greatest(0, k.kuota - coalesce(count(pd.id) FILTER (
      WHERE pd.status IN ('aktif', 'selesai') 
      OR (pd.status = 'menunggu_bayar' AND (pd.batas_bayar IS NULL OR pd.batas_bayar > now()))
    ), 0)) as sisa_kursi,
    k.gambar_url
  FROM public.kursus k
  LEFT JOIN public.profiles p ON k.instruktur_id = p.id
  LEFT JOIN public.pendaftaran pd ON pd.kursus_id = k.id
  WHERE k.status = 'terbit'
  GROUP BY k.id, p.nama_lengkap;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
