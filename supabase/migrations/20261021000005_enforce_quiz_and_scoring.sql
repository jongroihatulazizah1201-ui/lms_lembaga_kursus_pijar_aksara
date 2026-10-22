-- ==============================================================================
-- Migrasi: Enforce Quiz, Secret Keys, Server Scoring & Max 3 Attempts (US-04, BR-08, BR-09, BR-10, BR-11, BR-12)
-- ==============================================================================

-- 1. Fungsi RPC untuk mengambil soal kuis TANPA kunci jawaban (BR-09)
CREATE OR REPLACE FUNCTION public.get_soal_kuis(p_modul_id uuid)
RETURNS TABLE (
  id uuid,
  modul_id uuid,
  urutan smallint,
  pertanyaan text,
  pilihan_a text,
  pilihan_b text,
  pilihan_c text,
  pilihan_d text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_kursus_id uuid;
  v_modul_urutan smallint;
  v_is_instruktur_or_admin boolean;
  v_pendaftaran_id uuid;
  v_materi_baca timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: pengguna belum login';
  END IF;

  SELECT m.kursus_id, m.urutan INTO v_kursus_id, v_modul_urutan
  FROM public.modul m
  WHERE m.id = p_modul_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modul tidak ditemukan';
  END IF;

  -- Admin atau Instruktur pemilik boleh melihat soal
  SELECT (public.current_user_role() = 'admin' OR k.instruktur_id = v_user_id)
  INTO v_is_instruktur_or_admin
  FROM public.kursus k
  WHERE k.id = v_kursus_id;

  IF NOT v_is_instruktur_or_admin THEN
    -- Peserta wajib punya pendaftaran aktif atau selesai (BR-08)
    SELECT p.id INTO v_pendaftaran_id
    FROM public.pendaftaran p
    WHERE p.kursus_id = v_kursus_id 
      AND p.peserta_id = v_user_id 
      AND p.status IN ('aktif', 'selesai')
    ORDER BY p.didaftarkan_pada DESC
    LIMIT 1;

    IF v_pendaftaran_id IS NULL THEN
      RAISE EXCEPTION 'Akses ditolak: Anda belum terdaftar di kursus ini (BR-08)';
    END IF;

    -- Wajib sudah tekan tombol "Tandai materi sudah dibaca" pada modul ini (BR-08)
    SELECT pm.materi_dibaca_pada INTO v_materi_baca
    FROM public.progres_modul pm
    WHERE pm.pendaftaran_id = v_pendaftaran_id 
      AND pm.modul_id = p_modul_id;

    IF v_materi_baca IS NULL THEN
      RAISE EXCEPTION 'Silakan baca dan tandai materi modul terlebih dahulu sebelum mengerjakan kuis (BR-08)';
    END IF;
  END IF;

  -- Kembalikan soal TANPA kolom kunci_jawaban ke klien (BR-09)
  RETURN QUERY
  SELECT s.id, s.modul_id, s.urutan, s.pertanyaan, s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d
  FROM public.soal s
  WHERE s.modul_id = p_modul_id
  ORDER BY s.urutan ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_soal_kuis(uuid) TO authenticated;


-- 2. Fungsi RPC untuk submit kuis, penilaian di server, dan batas 3 percobaan (BR-09, BR-10, BR-11)
CREATE OR REPLACE FUNCTION public.submit_kuis(
  p_pendaftaran_id uuid,
  p_modul_id uuid,
  p_jawaban jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran RECORD;
  v_kursus RECORD;
  v_sudah_lulus boolean;
  v_sudah_baca boolean;
  v_jumlah_percobaan smallint;
  v_total_soal smallint;
  v_jumlah_benar smallint := 0;
  v_nilai smallint;
  v_is_lulus boolean;
  v_soal RECORD;
  v_jawaban_peserta text;
  v_modul_belum_lulus_count integer;
  v_progres_id uuid;
  v_sertifikat public.sertifikat;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  SELECT p.*, k.nilai_lulus, k.id AS kursus_id
  INTO v_pendaftaran
  FROM public.pendaftaran p
  JOIN public.kursus k ON k.id = p.kursus_id
  WHERE p.id = p_pendaftaran_id AND p.peserta_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak valid untuk pengguna ini';
  END IF;

  IF v_pendaftaran.status != 'aktif' THEN
    RAISE EXCEPTION 'Pengerjaan kuis hanya untuk pendaftaran berstatus aktif (BR-08)';
  END IF;

  -- Cek apakah materi sudah dibaca (BR-08)
  SELECT id, (lulus_pada IS NOT NULL), (materi_dibaca_pada IS NOT NULL)
  INTO v_progres_id, v_sudah_lulus, v_sudah_baca
  FROM public.progres_modul
  WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = p_modul_id;

  IF v_progres_id IS NULL OR NOT v_sudah_baca THEN
    RAISE EXCEPTION 'Materi modul harus ditandai sudah dibaca terlebih dahulu (BR-08)';
  END IF;

  IF v_sudah_lulus THEN
    RAISE EXCEPTION 'Modul ini sudah lulus dan tidak bisa dikerjakan lagi (BR-10)';
  END IF;

  -- Kunci transaksi advisory untuk cegah race condition percobaan kuis (BR-10)
  PERFORM pg_advisory_xact_lock(hashtext(p_pendaftaran_id::text || p_modul_id::text));

  SELECT COUNT(*)::smallint INTO v_jumlah_percobaan
  FROM public.percobaan_kuis
  WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = p_modul_id;

  IF v_jumlah_percobaan >= 3 THEN
    RAISE EXCEPTION 'Batas maksimal 3 kali percobaan kuis telah habis (BR-10)';
  END IF;

  -- Hitung total soal
  SELECT COUNT(*)::smallint INTO v_total_soal
  FROM public.soal
  WHERE modul_id = p_modul_id;

  IF v_total_soal = 0 THEN
    RAISE EXCEPTION 'Modul tidak memiliki soal kuis';
  END IF;

  -- Cocokkan jawaban peserta dengan kunci jawaban rahasia di server (BR-09)
  FOR v_soal IN SELECT id, kunci_jawaban FROM public.soal WHERE modul_id = p_modul_id LOOP
    v_jawaban_peserta := UPPER(TRIM(p_jawaban->>v_soal.id::text));
    IF v_jawaban_peserta IS NULL OR v_jawaban_peserta = '' THEN
      RAISE EXCEPTION 'Semua soal kuis wajib dijawab (BR-09)';
    END IF;
    IF v_jawaban_peserta = v_soal.kunci_jawaban THEN
      v_jumlah_benar := v_jumlah_benar + 1;
    END IF;
  END LOOP;

  -- Hitung nilai: dibulatkan ke bawah (floor) (BR-09)
  v_nilai := FLOOR((v_jumlah_benar::numeric / v_total_soal::numeric) * 100)::smallint;
  v_is_lulus := (v_nilai >= v_pendaftaran.nilai_lulus);

  -- Simpan riwayat percobaan (BR-10)
  INSERT INTO public.percobaan_kuis (
    pendaftaran_id,
    modul_id,
    nomor_percobaan,
    jawaban,
    jumlah_soal,
    jumlah_benar,
    nilai,
    lulus,
    dikerjakan_pada
  ) VALUES (
    p_pendaftaran_id,
    p_modul_id,
    (v_jumlah_percobaan + 1)::smallint,
    p_jawaban,
    v_total_soal,
    v_jumlah_benar,
    v_nilai,
    v_is_lulus,
    now()
  );

  -- Jika lulus, perbarui progres_modul
  IF v_is_lulus THEN
    UPDATE public.progres_modul
    SET lulus_pada = now()
    WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = p_modul_id;

    -- Cek apakah semua modul di kursus ini telah lulus (BR-11)
    SELECT COUNT(*) INTO v_modul_belum_lulus_count
    FROM public.modul m
    LEFT JOIN public.progres_modul pm 
      ON pm.modul_id = m.id 
      AND pm.pendaftaran_id = p_pendaftaran_id 
      AND pm.lulus_pada IS NOT NULL
    WHERE m.kursus_id = v_pendaftaran.kursus_id
      AND pm.id IS NULL;

    -- Jika semua modul lulus, otomatis ubah status pendaftaran ke 'selesai' dan terbitkan sertifikat (BR-11)
    IF v_modul_belum_lulus_count = 0 THEN
      UPDATE public.pendaftaran
      SET status = 'selesai', selesai_pada = now()
      WHERE id = p_pendaftaran_id;

      SELECT * INTO v_sertifikat FROM public.generate_sertifikat(p_pendaftaran_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'nomor_percobaan', v_jumlah_percobaan + 1,
    'jumlah_soal', v_total_soal,
    'jumlah_benar', v_jumlah_benar,
    'nilai', v_nilai,
    'nilai_lulus', v_pendaftaran.nilai_lulus,
    'lulus', v_is_lulus,
    'sisa_percobaan', 3 - (v_jumlah_percobaan + 1),
    'semua_modul_selesai', (v_is_lulus AND v_modul_belum_lulus_count = 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_kuis(uuid, uuid, jsonb) TO authenticated;
