-- ==============================================================================
-- Migrasi: Enforce Quiz Submission Concurrency & Security (US-04, BR-08, BR-09, BR-10, BR-11, BR-12)
-- Menjamin ketahanan terhadap race condition pengiriman ganda bersamaan pada batas 3 percobaan.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.submit_kuis(
  p_pendaftaran_id uuid,
  p_modul_id uuid,
  p_jawaban jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran RECORD;
  v_progres_id uuid;
  v_materi_dibaca_pada timestamptz;
  v_lulus_pada timestamptz;
  v_jumlah_percobaan smallint;
  v_nomor_percobaan smallint;
  v_total_soal smallint;
  v_jumlah_benar smallint := 0;
  v_nilai smallint;
  v_is_lulus boolean;
  v_soal RECORD;
  v_jawaban_peserta text;
  v_percobaan_id uuid;
  v_modul_belum_lulus_count integer := 0;
  v_sertifikat public.sertifikat;
BEGIN
  -- 0. Autentikasi Pengguna
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi';
  END IF;

  -- 1. Validasi Pendaftaran dan Kursus (BR-08, BR-12)
  SELECT p.*, k.nilai_lulus, k.id AS kursus_id
  INTO v_pendaftaran
  FROM public.pendaftaran p
  JOIN public.kursus k ON k.id = p.kursus_id
  WHERE p.id = p_pendaftaran_id AND p.peserta_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak valid atau bukan milik pengguna ini (BR-12)';
  END IF;

  IF v_pendaftaran.status != 'aktif' THEN
    RAISE EXCEPTION 'Pengerjaan kuis hanya dapat dilakukan pada pendaftaran berstatus aktif (BR-08)';
  END IF;

  -- 2. Kunci Transaksi Advisory (Anti-Race Condition per Pendaftaran & Modul)
  -- Mencegah submission ganda bersamaan oleh peserta yang sama di modul yang sama
  PERFORM pg_advisory_xact_lock(hashtext('kuis:' || p_pendaftaran_id::text || ':' || p_modul_id::text));

  -- 3. Cek Status Materi dan Kunci Baris progres_modul (FOR UPDATE)
  SELECT pm.id, pm.materi_dibaca_pada, pm.lulus_pada
  INTO v_progres_id, v_materi_dibaca_pada, v_lulus_pada
  FROM public.progres_modul pm
  WHERE pm.pendaftaran_id = p_pendaftaran_id AND pm.modul_id = p_modul_id
  FOR UPDATE;

  -- Ketentuan 1 (BR-08): Materi harus sudah ditandai dibaca terlebih dahulu
  IF v_progres_id IS NULL OR v_materi_dibaca_pada IS NULL THEN
    RAISE EXCEPTION 'Materi modul harus ditandai sudah dibaca terlebih dahulu sebelum mengerjakan kuis (BR-08)';
  END IF;

  -- Ketentuan 2a (BR-10): Jika modul sudah berstatus lulus, tidak boleh dikerjakan lagi
  IF v_lulus_pada IS NOT NULL THEN
    RAISE EXCEPTION 'Modul ini sudah lulus dan tidak bisa dikerjakan lagi (BR-10)';
  END IF;

  -- 4. Periksa Batas Maksimal 3 Percobaan (BR-10)
  SELECT COUNT(*)::smallint INTO v_jumlah_percobaan
  FROM public.percobaan_kuis
  WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = p_modul_id;

  -- Ketentuan 2b (BR-10): Jika sudah 3 kali percobaan, tolak pengiriman
  IF v_jumlah_percobaan >= 3 THEN
    RAISE EXCEPTION 'Batas maksimal 3 kali percobaan kuis telah habis (BR-10)';
  END IF;

  v_nomor_percobaan := (v_jumlah_percobaan + 1)::smallint;

  -- 5. Hitung Total Soal pada Modul
  SELECT COUNT(*)::smallint INTO v_total_soal
  FROM public.soal
  WHERE modul_id = p_modul_id;

  IF v_total_soal = 0 THEN
    RAISE EXCEPTION 'Modul ini belum memiliki soal kuis';
  END IF;

  -- 6. Penilaian Rahasia di Server terhadap Kunci Jawaban (BR-09)
  FOR v_soal IN 
    SELECT id, kunci_jawaban 
    FROM public.soal 
    WHERE modul_id = p_modul_id 
    ORDER BY urutan ASC 
  LOOP
    v_jawaban_peserta := UPPER(TRIM(p_jawaban->>v_soal.id::text));
    
    IF v_jawaban_peserta IS NULL OR v_jawaban_peserta = '' THEN
      RAISE EXCEPTION 'Semua soal kuis wajib dijawab (BR-09)';
    END IF;

    IF v_jawaban_peserta = v_soal.kunci_jawaban THEN
      v_jumlah_benar := v_jumlah_benar + 1;
    END IF;
  END LOOP;

  -- 7. Perhitungan Nilai (Floor) & Penentuan Kelulusan (BR-09)
  v_nilai := FLOOR((v_jumlah_benar::numeric / v_total_soal::numeric) * 100)::smallint;
  v_is_lulus := (v_nilai >= v_pendaftaran.nilai_lulus);

  -- 8. Simpan Riwayat Percobaan Kuis (BR-10)
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
    v_nomor_percobaan,
    p_jawaban,
    v_total_soal,
    v_jumlah_benar,
    v_nilai,
    v_is_lulus,
    now()
  ) RETURNING id INTO v_percobaan_id;

  -- 9. Pembaruan Progres & Penerbitan Sertifikat Otomatis (BR-11)
  IF v_is_lulus THEN
    -- Perbarui status progres modul menjadi lulus
    UPDATE public.progres_modul
    SET lulus_pada = now()
    WHERE id = v_progres_id;

    -- Periksa apakah masih ada modul lain dalam kursus yang belum lulus
    SELECT COUNT(*) INTO v_modul_belum_lulus_count
    FROM public.modul m
    LEFT JOIN public.progres_modul pm 
      ON pm.modul_id = m.id 
      AND pm.pendaftaran_id = p_pendaftaran_id 
      AND pm.lulus_pada IS NOT NULL
    WHERE m.kursus_id = v_pendaftaran.kursus_id
      AND pm.id IS NULL;

    -- Jika seluruh modul telah lulus, selesaikan kursus dan terbitkan sertifikat (BR-11)
    IF v_modul_belum_lulus_count = 0 THEN
      UPDATE public.pendaftaran
      SET status = 'selesai', selesai_pada = now()
      WHERE id = p_pendaftaran_id;

      -- Terbitkan sertifikat resmi otomatis (format unik: PA-TAHUN-NOMOR)
      SELECT * INTO v_sertifikat FROM public.generate_sertifikat(p_pendaftaran_id);
    END IF;
  END IF;

  -- 10. Pencatatan Jejak Aksi Sensitif ke Tabel audit_log (BR-12)
  INSERT INTO public.audit_log (
    pelaku_id,
    aksi,
    nama_tabel,
    id_data,
    data_sebelum,
    data_sesudah,
    dibuat_pada
  ) VALUES (
    v_user_id,
    'submit_kuis',
    'percobaan_kuis',
    v_percobaan_id,
    jsonb_build_object(
      'pendaftaran_id', p_pendaftaran_id,
      'modul_id', p_modul_id,
      'nomor_percobaan_terakhir', v_jumlah_percobaan
    ),
    jsonb_build_object(
      'percobaan_id', v_percobaan_id,
      'nomor_percobaan', v_nomor_percobaan,
      'jumlah_soal', v_total_soal,
      'jumlah_benar', v_jumlah_benar,
      'nilai', v_nilai,
      'nilai_lulus', v_pendaftaran.nilai_lulus,
      'lulus', v_is_lulus,
      'selesai_kursus', (v_is_lulus AND v_modul_belum_lulus_count = 0),
      'nomor_sertifikat', v_sertifikat.nomor_sertifikat
    ),
    now()
  );

  -- 11. Kembalikan Ringkasan Hasil ke Klien
  RETURN jsonb_build_object(
    'nomor_percobaan', v_nomor_percobaan,
    'jumlah_soal', v_total_soal,
    'jumlah_benar', v_jumlah_benar,
    'nilai', v_nilai,
    'nilai_lulus', v_pendaftaran.nilai_lulus,
    'lulus', v_is_lulus,
    'sisa_percobaan', GREATEST(0, 3 - v_nomor_percobaan),
    'semua_modul_selesai', (v_is_lulus AND v_modul_belum_lulus_count = 0),
    'nomor_sertifikat', v_sertifikat.nomor_sertifikat
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_kuis(uuid, uuid, jsonb) TO authenticated;
