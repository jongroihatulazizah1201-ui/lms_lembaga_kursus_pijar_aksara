-- =============================================================================
-- MIGRATION: ENFORCE MATERIAL PROTECTION & STRICT QUIZ-ONLY MODULE COMPLETION
-- 1. Tutup celah materi bocor via API publik: Buka akses modul/materi hanya untuk
--    peserta aktif/selesai, instruktur pemilik, dan admin.
-- 2. Buat fungsi get_silabus_kursus (SECURITY DEFINER) untuk menampilkan judul & durasi
--    modul di halaman katalog tanpa pernah membocorkan isi_materi, video_url, atau lampiran.
-- 3. Cegah peserta menandai modul lulus sendiri:
--    - Drop policy INSERT/UPDATE bebas pada progres_modul
--    - Pasang trigger pengaman: kolom lulus_pada hanya sah jika ada rekaman percobaan_kuis lulus
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FUNGSI SILABUS PUBLIK AMAN (Hanya Mengembalikan Judul & Durasi, Bukan Isi Materi)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_silabus_kursus(p_kursus_id uuid)
RETURNS TABLE (
  id uuid,
  urutan smallint,
  judul text,
  durasi_menit smallint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.urutan, m.judul, m.durasi_menit
  FROM public.modul m
  JOIN public.kursus k ON k.id = m.kursus_id
  WHERE m.kursus_id = p_kursus_id
    AND k.status = 'terbit'
  ORDER BY m.urutan ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_silabus_kursus(uuid) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. PERKETAT RLS TABEL MODUL: Hanya Peserta Aktif/Selesai, Instruktur Pengampu, & Admin
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS modul_select ON public.modul;
CREATE POLICY modul_select ON public.modul
FOR SELECT
TO authenticated
USING (
  (public.current_user_role() = 'admin')
  OR (EXISTS (
    SELECT 1 FROM public.kursus k 
    WHERE k.id = modul.kursus_id AND k.instruktur_id = auth.uid()
  ))
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pendaftaran p 
      WHERE p.kursus_id = modul.kursus_id 
        AND p.peserta_id = auth.uid() 
        AND p.status IN ('aktif', 'selesai')
    )
  )
);

-- Pastikan anon tidak memiliki izin SELECT langsung pada tabel modul (anti-scraping API)
REVOKE SELECT ON public.modul FROM anon;

-- -----------------------------------------------------------------------------
-- 3. TRIGGER PENGAMAN PROGRES MODUL: Status Lulus Wajib dari Evaluasi Kuis
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_progres_modul_lulus_pada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Jika kolom lulus_pada diisi atau diubah menjadi tidak null
  IF (TG_OP = 'INSERT' AND NEW.lulus_pada IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.lulus_pada IS NOT NULL AND (OLD.lulus_pada IS NULL OR NEW.lulus_pada <> OLD.lulus_pada)) THEN
     
    -- Admin dikecualikan untuk keperluan pemeliharaan/intervensi data resmi
    IF public.current_user_role() = 'admin' THEN
      RETURN NEW;
    END IF;

    -- Validasi: Wajib ada data percobaan kuis dengan status lulus yang sah pada modul dan pendaftaran ini
    IF NOT EXISTS (
      SELECT 1 FROM public.percobaan_kuis pk
      WHERE pk.pendaftaran_id = NEW.pendaftaran_id
        AND pk.modul_id = NEW.modul_id
        AND pk.lulus = true
    ) THEN
      RAISE EXCEPTION 'Status kelulusan modul tidak dapat ditandai secara manual. Kelulusan modul hanya sah jika peserta telah mengerjakan kuis dan dinyatakan lulus evaluasi (passing grade).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_progres_modul_lulus_pada ON public.progres_modul;
CREATE TRIGGER trg_protect_progres_modul_lulus_pada
BEFORE INSERT OR UPDATE ON public.progres_modul
FOR EACH ROW
EXECUTE FUNCTION public.protect_progres_modul_lulus_pada();

-- -----------------------------------------------------------------------------
-- 4. PERKETAT RLS PROGRES_MODUL: Hapus Izin Modifikasi Bebas dari Klien
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "progres_modul_insert_update" ON public.progres_modul;
DROP POLICY IF EXISTS "progres_modul_admin_all" ON public.progres_modul;
CREATE POLICY "progres_modul_admin_all" ON public.progres_modul
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');
