-- ==============================================================================
-- Migrasi: 20261025000019_manual_transfer_proof_and_storage.sql
-- Alur Pembayaran Transfer Manual:
-- 1. Tambah kolom bukti_bayar_path pada tabel pendaftaran
-- 2. Konfigurasi bucket privat bukti_bayar (maksimal 2MB, tipe JPG/PNG/WebP/PDF)
-- 3. Storage RLS Policies untuk bukti_bayar (hanya pemilik sebelum batas bayar & admin)
-- 4. Fungsi aman peserta_unggah_bukti_bayar dengan audit logging
-- ==============================================================================

-- 1. Tambah kolom bukti_bayar_path pada tabel pendaftaran
ALTER TABLE public.pendaftaran 
ADD COLUMN IF NOT EXISTS bukti_bayar_path text NULL;

-- 2. Buat bucket storage privat bukti_bayar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti_bayar',
  'bukti_bayar',
  false,
  2097152, -- 2 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 3. Storage RLS Policies untuk bukti_bayar
DO $$ BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 3.1 Policy INSERT (Upload): Hanya pemilik pendaftaran menunggu_bayar sebelum batas bayar
DROP POLICY IF EXISTS "Peserta upload bukti bayar sendiri sebelum batas" ON storage.objects;
CREATE POLICY "Peserta upload bukti bayar sendiri sebelum batas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bukti_bayar' AND
  EXISTS (
    SELECT 1 FROM public.pendaftaran
    WHERE pendaftaran.id::text = (storage.foldername(name))[1]
      AND pendaftaran.peserta_id = auth.uid()
      AND pendaftaran.status = 'menunggu_bayar'
      AND (pendaftaran.batas_bayar IS NULL OR pendaftaran.batas_bayar > now())
  )
);

-- 3.2 Policy UPDATE: Hanya pemilik sebelum batas bayar
DROP POLICY IF EXISTS "Peserta update bukti bayar sendiri sebelum batas" ON storage.objects;
CREATE POLICY "Peserta update bukti bayar sendiri sebelum batas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bukti_bayar' AND
  EXISTS (
    SELECT 1 FROM public.pendaftaran
    WHERE pendaftaran.id::text = (storage.foldername(name))[1]
      AND pendaftaran.peserta_id = auth.uid()
      AND pendaftaran.status = 'menunggu_bayar'
      AND (pendaftaran.batas_bayar IS NULL OR pendaftaran.batas_bayar > now())
  )
);

-- 3.3 Policy SELECT (Download/Read): Hanya pemilik dan admin
DROP POLICY IF EXISTS "Pemilik dan Admin dapat membaca bukti bayar" ON storage.objects;
CREATE POLICY "Pemilik dan Admin dapat membaca bukti bayar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bukti_bayar' AND (
    public.current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.pendaftaran
      WHERE pendaftaran.id::text = (storage.foldername(name))[1]
        AND pendaftaran.peserta_id = auth.uid()
    )
  )
);

-- 3.4 Policy DELETE: Hanya admin dan pemilik sebelum batas bayar
DROP POLICY IF EXISTS "Peserta dan Admin delete bukti bayar" ON storage.objects;
CREATE POLICY "Peserta dan Admin delete bukti bayar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bukti_bayar' AND (
    public.current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.pendaftaran
      WHERE pendaftaran.id::text = (storage.foldername(name))[1]
        AND pendaftaran.peserta_id = auth.uid()
        AND pendaftaran.status = 'menunggu_bayar'
        AND (pendaftaran.batas_bayar IS NULL OR pendaftaran.batas_bayar > now())
    )
  )
);

-- 4. RPC peserta_unggah_bukti_bayar dengan validasi ketat & audit log
CREATE OR REPLACE FUNCTION public.peserta_unggah_bukti_bayar(
  p_pendaftaran_id uuid,
  p_bukti_bayar_path text
)
RETURNS public.pendaftaran
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pendaftaran public.pendaftaran;
  v_path_sebelum text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  SELECT * INTO v_pendaftaran
  FROM public.pendaftaran
  WHERE id = p_pendaftaran_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  -- 1. Verifikasi pemilik pendaftaran
  IF v_pendaftaran.peserta_id != auth.uid() THEN
    RAISE EXCEPTION 'Akses ditolak: Anda bukan pemilik pendaftaran ini';
  END IF;

  -- 2. Verifikasi status harus menunggu_bayar
  IF v_pendaftaran.status != 'menunggu_bayar' THEN
    RAISE EXCEPTION 'Bukti bayar hanya dapat diunggah untuk pendaftaran berstatus menunggu_bayar (status saat ini: %)', v_pendaftaran.status;
  END IF;

  -- 3. Verifikasi sebelum batas_bayar
  IF v_pendaftaran.batas_bayar IS NOT NULL AND now() > v_pendaftaran.batas_bayar THEN
    RAISE EXCEPTION 'Waktu pembayaran telah kedaluwarsa. Bukti pembayaran tidak dapat diunggah lagi';
  END IF;

  v_path_sebelum := v_pendaftaran.bukti_bayar_path;

  UPDATE public.pendaftaran
  SET bukti_bayar_path = p_bukti_bayar_path
  WHERE id = p_pendaftaran_id
  RETURNING * INTO v_pendaftaran;

  -- 4. Catat aksi ke audit log
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
    'unggah_bukti_bayar',
    'pendaftaran',
    p_pendaftaran_id,
    jsonb_build_object('bukti_bayar_path', v_path_sebelum, 'status', 'menunggu_bayar'),
    jsonb_build_object('bukti_bayar_path', p_bukti_bayar_path, 'status', 'menunggu_bayar'),
    now()
  );

  RETURN v_pendaftaran;
END;
$$;

-- Izin fungsi: Hanya authenticated yang dapat memanggil RPC ini
REVOKE EXECUTE ON FUNCTION public.peserta_unggah_bukti_bayar(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.peserta_unggah_bukti_bayar(uuid, text) TO authenticated;
