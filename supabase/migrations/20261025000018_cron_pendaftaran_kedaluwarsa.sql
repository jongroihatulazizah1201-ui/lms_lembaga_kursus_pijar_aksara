-- ============================================================================
-- Migrasi: 20261025000018_cron_pendaftaran_kedaluwarsa.sql
-- Tujuan: RPC Service Role untuk Memproses Pendaftaran Kedaluwarsa Otomatis
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_proses_pendaftaran_kedaluwarsa()
RETURNS TABLE (
  pendaftaran_id uuid,
  kursus_id uuid,
  peserta_id uuid,
  status_lama text,
  status_baru text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  r RECORD;
  v_now timestamptz := now();
BEGIN
  -- Loop seluruh pendaftaran berstatus menunggu_bayar yang telah melewati batas_bayar
  FOR r IN
    SELECT p.id, p.kursus_id, p.peserta_id, p.status, p.nominal, p.batas_bayar
    FROM public.pendaftaran p
    WHERE p.status = 'menunggu_bayar'
      AND p.batas_bayar IS NOT NULL
      AND p.batas_bayar <= v_now
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update status pendaftaran menjadi kedaluwarsa (idempoten karena filter status = 'menunggu_bayar')
    UPDATE public.pendaftaran
    SET status = 'kedaluwarsa'
    WHERE id = r.id;

    -- Catat jejak audit aksi sistem (BR-07, BR-12)
    INSERT INTO public.audit_log (
      pelaku_id,
      aksi,
      nama_tabel,
      id_data,
      data_sebelum,
      data_sesudah,
      dibuat_pada
    ) VALUES (
      NULL, -- Aksi otomatis sistem (background cron)
      'kedaluwarsa_otomatis_sistem',
      'pendaftaran',
      r.id,
      jsonb_build_object(
        'status', r.status,
        'nominal', r.nominal,
        'batas_bayar', r.batas_bayar
      ),
      jsonb_build_object(
        'status', 'kedaluwarsa',
        'nominal', r.nominal,
        'batas_bayar', r.batas_bayar,
        'dieksekusi_pada', v_now
      ),
      v_now
    );

    pendaftaran_id := r.id;
    kursus_id := r.kursus_id;
    peserta_id := r.peserta_id;
    status_lama := r.status::text;
    status_baru := 'kedaluwarsa';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Cabut dari public dan anon, hanya service_role yang memiliki hak eksekusi
REVOKE ALL ON FUNCTION public.cron_proses_pendaftaran_kedaluwarsa() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_proses_pendaftaran_kedaluwarsa() TO service_role;
