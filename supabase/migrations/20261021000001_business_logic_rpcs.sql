-- ========================================================
-- 1. FUNCTION GENERATE SERTIFIKAT ATOMIK (BR-11)
-- ========================================================
CREATE OR REPLACE FUNCTION public.generate_sertifikat(p_pendaftaran_id uuid)
RETURNS public.sertifikat AS $$
DECLARE
  v_pendaftaran RECORD;
  v_tahun smallint;
  v_nomor_urut integer;
  v_nomor_sertifikat text;
  v_sertifikat public.sertifikat;
BEGIN
  -- Cek jika sudah pernah terbit (idempotent, BR-11: 1 pendaftaran hanya 1 sertifikat)
  SELECT * INTO v_sertifikat FROM public.sertifikat WHERE pendaftaran_id = p_pendaftaran_id;
  IF FOUND THEN
    RETURN v_sertifikat;
  END IF;

  SELECT p.*, prof.nama_lengkap AS nama_peserta, k.judul AS judul_kursus
  INTO v_pendaftaran
  FROM public.pendaftaran p
  JOIN public.profiles prof ON prof.id = p.peserta_id
  JOIN public.kursus k ON k.id = p.kursus_id
  WHERE p.id = p_pendaftaran_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  v_tahun := EXTRACT(YEAR FROM now())::smallint;

  -- Kunci pencacah nomor urut per tahun agar tidak dobel nomor
  PERFORM pg_advisory_xact_lock(v_tahun::bigint);

  SELECT COALESCE(MAX(nomor_urut), 0) + 1 INTO v_nomor_urut 
  FROM public.sertifikat 
  WHERE tahun = v_tahun;

  v_nomor_sertifikat := 'PA-' || v_tahun || '-' || LPAD(v_nomor_urut::text, 4, '0');

  INSERT INTO public.sertifikat (
    pendaftaran_id,
    tahun,
    nomor_urut,
    nomor_sertifikat,
    nama_peserta,
    judul_kursus,
    diterbitkan_pada
  ) VALUES (
    p_pendaftaran_id,
    v_tahun,
    v_nomor_urut,
    v_nomor_sertifikat,
    v_pendaftaran.nama_peserta,
    v_pendaftaran.judul_kursus,
    now()
  ) RETURNING * INTO v_sertifikat;

  RETURN v_sertifikat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 2. FUNCTION DAFTAR KURSUS ANTI-RACE CONDITION (BR-05, BR-06)
-- ========================================================
CREATE OR REPLACE FUNCTION public.daftar_kursus(
  p_kursus_id uuid,
  p_metode_bayar text DEFAULT 'gratis'
)
RETURNS public.pendaftaran AS $$
DECLARE
  v_user_id uuid;
  v_user_peran text;
  v_kursus RECORD;
  v_kursi_terpakai integer;
  v_status public.status_pendaftaran_enum;
  v_batas_bayar timestamptz;
  v_metode public.metode_bayar_enum;
  v_pendaftaran public.pendaftaran;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  SELECT peran::text INTO v_user_peran FROM public.profiles WHERE id = v_user_id;
  IF v_user_peran != 'peserta' THEN
    RAISE EXCEPTION 'Hanya akun berperan Peserta yang dapat mendaftar kursus (BR-05)';
  END IF;

  -- Kunci baris kursus untuk cegah race condition kuota (BR-06)
  SELECT * INTO v_kursus FROM public.kursus WHERE id = p_kursus_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  IF v_kursus.status != 'terbit' THEN
    RAISE EXCEPTION 'Hanya kursus berstatus terbit yang bisa didaftar (BR-01, BR-05)';
  END IF;

  -- Cek pendaftaran aktif/berlaku (BR-05)
  IF EXISTS (
    SELECT 1 FROM public.pendaftaran 
    WHERE kursus_id = p_kursus_id 
      AND peserta_id = v_user_id 
      AND status IN ('menunggu_bayar', 'aktif', 'selesai')
  ) THEN
    RAISE EXCEPTION 'Anda sudah memiliki pendaftaran yang masih berlaku untuk kursus ini (BR-05)';
  END IF;

  -- Hitung kursi terpakai (aktif + selesai + menunggu_bayar belum expired) (BR-06)
  SELECT COUNT(*) INTO v_kursi_terpakai
  FROM public.pendaftaran
  WHERE kursus_id = p_kursus_id
    AND (
      status IN ('aktif', 'selesai')
      OR (status = 'menunggu_bayar' AND (batas_bayar IS NULL OR batas_bayar > now()))
    );

  IF v_kursi_terpakai >= v_kursus.kuota THEN
    RAISE EXCEPTION 'Kuota kursus sudah penuh (BR-06)';
  END IF;

  -- Tentukan status dan metode pembayaran (BR-07)
  IF v_kursus.harga = 0 THEN
    v_status := 'aktif';
    v_metode := 'gratis';
    v_batas_bayar := NULL;
  ELSE
    v_status := 'menunggu_bayar';
    v_metode := p_metode_bayar::public.metode_bayar_enum;
    v_batas_bayar := now() + interval '24 hours';
  END IF;

  INSERT INTO public.pendaftaran (
    kursus_id,
    peserta_id,
    status,
    nominal,
    metode_bayar,
    batas_bayar,
    didaftarkan_pada
  ) VALUES (
    p_kursus_id,
    v_user_id,
    v_status,
    v_kursus.harga,
    v_metode,
    v_batas_bayar,
    now()
  ) RETURNING * INTO v_pendaftaran;

  RETURN v_pendaftaran;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 3. FUNCTION AMBIL SOAL KUIS AMAN TANPA KUNCI (BR-09)
-- ========================================================
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
) AS $$
DECLARE
  v_user_id uuid;
  v_kursus_id uuid;
  v_modul_urutan smallint;
  v_is_instruktur_or_admin boolean;
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

  -- Admin atau Instruktur pemilik boleh langsung
  SELECT (public.current_user_role() = 'admin' OR k.instruktur_id = v_user_id)
  INTO v_is_instruktur_or_admin
  FROM public.kursus k
  WHERE k.id = v_kursus_id;

  IF NOT v_is_instruktur_or_admin THEN
    -- Peserta wajib punya pendaftaran aktif atau selesai
    IF NOT EXISTS (
      SELECT 1 FROM public.pendaftaran p
      WHERE p.kursus_id = v_kursus_id 
        AND p.peserta_id = v_user_id 
        AND p.status IN ('aktif', 'selesai')
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Anda belum terdaftar di kursus ini (BR-08)';
    END IF;

    -- Wajib sudah tekan tombol "Tandai materi sudah dibaca" (BR-08)
    IF NOT EXISTS (
      SELECT 1 FROM public.progres_modul pm
      JOIN public.pendaftaran p ON p.id = pm.pendaftaran_id
      WHERE pm.modul_id = p_modul_id 
        AND p.peserta_id = v_user_id 
        AND pm.materi_dibaca_pada IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Silakan baca dan tandai materi modul terlebih dahulu sebelum mengerjakan kuis (BR-08)';
    END IF;
  END IF;

  -- Kembalikan soal TANPA kolom kunci_jawaban (BR-09)
  RETURN QUERY
  SELECT s.id, s.modul_id, s.urutan, s.pertanyaan, s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d
  FROM public.soal s
  WHERE s.modul_id = p_modul_id
  ORDER BY s.urutan ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 4. FUNCTION EVALUASI KUIS DI SERVER (BR-08, BR-09, BR-10, BR-11)
-- ========================================================
CREATE OR REPLACE FUNCTION public.submit_kuis(
  p_pendaftaran_id uuid,
  p_modul_id uuid,
  p_jawaban jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran RECORD;
  v_kursus RECORD;
  v_sudah_lulus boolean;
  v_jumlah_percobaan smallint;
  v_total_soal smallint;
  v_jumlah_benar smallint := 0;
  v_nilai smallint;
  v_is_lulus boolean;
  v_soal RECORD;
  v_jawaban_peserta text;
  v_modul_belum_lulus_count integer;
  v_progres_id uuid;
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
  SELECT id, (lulus_pada IS NOT NULL) INTO v_progres_id, v_sudah_lulus
  FROM public.progres_modul
  WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = p_modul_id;

  IF v_progres_id IS NULL THEN
    RAISE EXCEPTION 'Materi modul harus ditandai sudah dibaca terlebih dahulu (BR-08)';
  END IF;

  IF v_sudah_lulus THEN
    RAISE EXCEPTION 'Modul ini sudah lulus dan tidak bisa dikerjakan lagi (BR-10)';
  END IF;

  -- Kunci baris untuk proteksi konkurensi percobaan kuis (BR-10)
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

  -- Simpan riwayat percobaan
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

      PERFORM public.generate_sertifikat(p_pendaftaran_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'nomor_percobaan', v_jumlah_percobaan + 1,
    'jumlah_soal', v_total_soal,
    'jumlah_benar', v_jumlah_benar,
    'nilai', v_nilai,
    'lulus', v_is_lulus,
    'sisa_percobaan', 3 - (v_jumlah_percobaan + 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
