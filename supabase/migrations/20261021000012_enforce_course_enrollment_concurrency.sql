-- ==============================================================================
-- Migrasi: Enforce Course Enrollment Concurrency & Anti-Race Condition (BR-01, BR-05, BR-06, BR-07, BR-12)
-- Mengunci baris kursus dengan FOR UPDATE untuk mencegah overbooking kursi terakhir
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.daftar_kursus(
  p_kursus_id uuid,
  p_metode_bayar text DEFAULT 'transfer_manual'
)
RETURNS public.pendaftaran
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_user_peran text;
  v_kursus public.kursus%ROWTYPE;
  v_kursi_terpakai integer;
  v_status public.status_pendaftaran_enum;
  v_batas_bayar timestamptz;
  v_metode public.metode_bayar_enum;
  v_pendaftaran public.pendaftaran;
BEGIN
  -- 1. Verifikasi Autentikasi Pengguna
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi';
  END IF;

  -- 2. Verifikasi Peran Pemanggil di tabel profiles (BR-05)
  SELECT peran::text INTO v_user_peran 
  FROM public.profiles 
  WHERE id = v_user_id;

  IF v_user_peran IS NULL OR v_user_peran != 'peserta' THEN
    RAISE EXCEPTION 'Pendaftaran ditolak: Hanya akun berperan Peserta yang dapat mendaftar kursus (BR-05)';
  END IF;

  -- 3. KUNCI BARIS KURSUS DENGAN 'FOR UPDATE' (BR-06 Anti-Race Condition)
  -- Setiap transaksi paralel yang mencoba mendaftar ke kursus ini WAJIB antre (wait-lock),
  -- memastikan perhitungan kursi terpakai selalu membaca state terbaru yang ter-commit.
  SELECT * INTO v_kursus 
  FROM public.kursus 
  WHERE id = p_kursus_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran ditolak: Kursus tidak ditemukan';
  END IF;

  -- 4. Verifikasi Status Kursus Harus 'terbit' (BR-01, BR-05)
  IF v_kursus.status != 'terbit' THEN
    RAISE EXCEPTION 'Pendaftaran ditolak: Kursus belum atau tidak berstatus terbit (BR-01)';
  END IF;

  -- 5. Periksa Apakah Peserta Sudah Memiliki Pendaftaran Berlaku (BR-05)
  IF EXISTS (
    SELECT 1 
    FROM public.pendaftaran 
    WHERE kursus_id = p_kursus_id 
      AND peserta_id = v_user_id 
      AND status IN ('menunggu_bayar', 'aktif', 'selesai')
  ) THEN
    RAISE EXCEPTION 'Pendaftaran ditolak: Anda sudah memiliki pendaftaran yang masih berlaku untuk kursus ini (BR-05)';
  END IF;

  -- 6. Hitung Kursi Terpakai Secara Eksklusif (BR-06)
  -- Kursi terpakai = aktif + selesai + menunggu_bayar yang belum lewat batas (24 jam)
  SELECT count(*)::integer INTO v_kursi_terpakai
  FROM public.pendaftaran
  WHERE kursus_id = p_kursus_id
    AND (
      status IN ('aktif', 'selesai')
      OR (status = 'menunggu_bayar' AND (batas_bayar IS NULL OR batas_bayar > now()))
    );

  -- Tolak jika kursi terpakai sudah mencapai atau melebihi kuota
  IF v_kursi_terpakai >= v_kursus.kuota THEN
    RAISE EXCEPTION 'Pendaftaran ditolak: Kuota kursus sudah penuh (%/% kursi) (BR-06)', 
      v_kursi_terpakai, v_kursus.kuota;
  END IF;

  -- 7. Tentukan Status Awal & Batas Waktu Bayar (BR-07)
  IF v_kursus.harga = 0 THEN
    v_status := 'aktif';
    v_metode := 'gratis';
    v_batas_bayar := NULL;
  ELSE
    v_status := 'menunggu_bayar';
    BEGIN
      v_metode := p_metode_bayar::public.metode_bayar_enum;
    EXCEPTION WHEN OTHERS THEN
      v_metode := 'transfer_manual';
    END;
    v_batas_bayar := now() + interval '24 hours';
  END IF;

  -- 8. Eksekusi Insert Pendaftaran
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
  )
  RETURNING * INTO v_pendaftaran;

  -- 9. Rekam Otomatis ke Audit Log (BR-12)
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
    'daftar_kursus',
    'pendaftaran',
    v_pendaftaran.id,
    NULL,
    jsonb_build_object(
      'kursus_id', p_kursus_id,
      'judul_kursus', v_kursus.judul,
      'status', v_status,
      'nominal', v_kursus.harga,
      'kursi_ke', v_kursi_terpakai + 1,
      'kuota', v_kursus.kuota
    ),
    now()
  );

  RETURN v_pendaftaran;
END;
$$;

GRANT EXECUTE ON FUNCTION public.daftar_kursus(uuid, text) TO authenticated;
