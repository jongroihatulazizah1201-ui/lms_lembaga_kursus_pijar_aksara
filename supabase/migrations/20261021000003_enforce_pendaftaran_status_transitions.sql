-- ==============================================================================
-- Migrasi: Enforce Pendaftaran Status Transitions & Participant Cancellation (US-02, BR-05, BR-06, BR-07, Tabel 6.2)
-- ==============================================================================

-- 1. Fungsi Trigger Validasi Status Pendaftaran (Tabel 6.2 PRD)
CREATE OR REPLACE FUNCTION public.fn_validasi_status_pendaftaran()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kursus_harga integer;
BEGIN
  -- Jika INSERT (status baru)
  IF TG_OP = 'INSERT' THEN
    SELECT harga INTO v_kursus_harga FROM public.kursus WHERE id = NEW.kursus_id;
    
    IF v_kursus_harga = 0 THEN
      IF NEW.status != 'aktif' THEN
        RAISE EXCEPTION 'Pendaftaran kursus gratis harus langsung berstatus "aktif" (Tabel 6.2, BR-07)';
      END IF;
    ELSE
      IF NEW.status != 'menunggu_bayar' THEN
        RAISE EXCEPTION 'Pendaftaran kursus berbayar harus berstatus awal "menunggu_bayar" (Tabel 6.2, BR-07)';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- Jika UPDATE status
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Status selesai, kedaluwarsa, dan dibatalkan adalah STATUS AKHIR (terminal)
    IF OLD.status IN ('selesai', 'kedaluwarsa', 'dibatalkan') THEN
      RAISE EXCEPTION 'Status pendaftaran "%" adalah status akhir dan tidak dapat diubah lagi (Tabel 6.2 PRD)', OLD.status;
    END IF;

    -- Validasi alur perpindahan status dari 'menunggu_bayar'
    IF OLD.status = 'menunggu_bayar' THEN
      IF NEW.status = 'aktif' THEN
        -- menunggu_bayar -> aktif: harus sebelum batas_bayar
        IF OLD.batas_bayar IS NOT NULL AND now() > OLD.batas_bayar THEN
          RAISE EXCEPTION 'Tidak dapat mengaktifkan pendaftaran karena sudah melewati batas waktu pembayaran (Tabel 6.2, BR-07)';
        END IF;
        IF NEW.dibayar_pada IS NULL THEN
          NEW.dibayar_pada := now();
        END IF;

      ELSIF NEW.status = 'kedaluwarsa' THEN
        -- menunggu_bayar -> kedaluwarsa: batas bayar lewat
        NULL;

      ELSIF NEW.status = 'dibatalkan' THEN
        -- menunggu_bayar -> dibatalkan: belum dibayar
        IF OLD.dibayar_pada IS NOT NULL THEN
          RAISE EXCEPTION 'Pendaftaran yang sudah dibayar tidak dapat dibatalkan dengan alur ini (BR-07)';
        END IF;
        IF NEW.dibatalkan_pada IS NULL THEN
          NEW.dibatalkan_pada := now();
        END IF;

      ELSE
        RAISE EXCEPTION 'Perpindahan status pendaftaran tidak diizinkan: dari "%" ke "%" (Tabel 6.2 PRD)', OLD.status, NEW.status;
      END IF;

    -- Validasi alur perpindahan status dari 'aktif'
    ELSIF OLD.status = 'aktif' THEN
      IF NEW.status = 'dibatalkan' THEN
        -- aktif -> dibatalkan: Admin boleh membatalkan pendaftaran aktif dengan alasan minimal 10 karakter (BR-07)
        IF NEW.alasan_batal IS NULL OR length(trim(NEW.alasan_batal)) < 10 THEN
          RAISE EXCEPTION 'Pembatalan pendaftaran aktif wajib menyertakan alasan minimal 10 karakter (BR-07)';
        END IF;
        IF NEW.dibatalkan_pada IS NULL THEN
          NEW.dibatalkan_pada := now();
        END IF;

      ELSIF NEW.status = 'selesai' THEN
        -- aktif -> selesai: semua modul lulus
        IF NEW.selesai_pada IS NULL THEN
          NEW.selesai_pada := now();
        END IF;

      ELSE
        RAISE EXCEPTION 'Perpindahan status pendaftaran tidak diizinkan: dari "%" ke "%" (Tabel 6.2 PRD)', OLD.status, NEW.status;
      END IF;

    ELSE
      RAISE EXCEPTION 'Perpindahan status pendaftaran tidak diizinkan: dari "%" ke "%" (Tabel 6.2 PRD)', OLD.status, NEW.status;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Pasang Trigger pada tabel pendaftaran
DROP TRIGGER IF EXISTS trg_validasi_status_pendaftaran ON public.pendaftaran;
CREATE TRIGGER trg_validasi_status_pendaftaran
  BEFORE INSERT OR UPDATE ON public.pendaftaran
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validasi_status_pendaftaran();


-- 2. Fungsi RPC untuk pembatalan pendaftaran oleh peserta (BR-07)
CREATE OR REPLACE FUNCTION public.batalkan_pendaftaran_peserta(p_pendaftaran_id uuid)
RETURNS public.pendaftaran
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran public.pendaftaran;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  SELECT * INTO v_pendaftaran FROM public.pendaftaran WHERE id = p_pendaftaran_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  IF v_pendaftaran.peserta_id != v_user_id THEN
    RAISE EXCEPTION 'Anda hanya dapat membatalkan pendaftaran milik sendiri (BR-07, BR-12)';
  END IF;

  IF v_pendaftaran.status != 'menunggu_bayar' THEN
    RAISE EXCEPTION 'Peserta hanya boleh membatalkan pendaftaran yang belum dibayar / menunggu bayar (BR-07)';
  END IF;

  UPDATE public.pendaftaran
  SET status = 'dibatalkan',
      dibatalkan_pada = now()
  WHERE id = p_pendaftaran_id
  RETURNING * INTO v_pendaftaran;

  RETURN v_pendaftaran;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batalkan_pendaftaran_peserta(uuid) TO authenticated;


-- 3. Fungsi RPC untuk memeriksa pendaftaran aktif user pada kursus tertentu
CREATE OR REPLACE FUNCTION public.get_pendaftaran_saya(p_kursus_id uuid)
RETURNS TABLE (
  id uuid,
  status public.status_pendaftaran_enum,
  nominal integer,
  metode_bayar public.metode_bayar_enum,
  batas_bayar timestamptz,
  didaftarkan_pada timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.status,
    p.nominal,
    p.metode_bayar,
    p.batas_bayar,
    p.didaftarkan_pada
  FROM public.pendaftaran p
  WHERE p.peserta_id = auth.uid()
    AND p.kursus_id = p_kursus_id
    AND p.status IN ('menunggu_bayar', 'aktif', 'selesai')
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pendaftaran_saya(uuid) TO authenticated;
