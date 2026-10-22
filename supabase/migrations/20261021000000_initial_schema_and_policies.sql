-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.peran_enum AS ENUM ('peserta', 'instruktur', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_kursus_enum AS ENUM ('draf', 'ditinjau', 'terbit', 'ditutup');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_pendaftaran_enum AS ENUM ('menunggu_bayar', 'aktif', 'selesai', 'kedaluwarsa', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.metode_bayar_enum AS ENUM ('gratis', 'transfer_manual', 'mayar');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap text NOT NULL CHECK (char_length(trim(nama_lengkap)) BETWEEN 3 AND 100),
  email text NOT NULL UNIQUE,
  no_hp text CHECK (no_hp IS NULL OR no_hp ~ '^08[0-9]{8,11}$'),
  peran public.peran_enum NOT NULL DEFAULT 'peserta',
  aktif boolean NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 3. TABEL KURSUS
CREATE TABLE IF NOT EXISTS public.kursus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instruktur_id uuid NOT NULL REFERENCES public.profiles(id),
  judul text NOT NULL CHECK (char_length(trim(judul)) BETWEEN 5 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kategori text NOT NULL,
  ringkasan text NOT NULL CHECK (char_length(ringkasan) <= 200),
  deskripsi text NOT NULL,
  harga integer NOT NULL CHECK (harga = 0 OR (harga >= 50000 AND harga <= 5000000)),
  kuota integer NOT NULL CHECK (kuota >= 1 AND kuota <= 100),
  nilai_lulus smallint NOT NULL DEFAULT 70 CHECK (nilai_lulus >= 50 AND nilai_lulus <= 100),
  status public.status_kursus_enum NOT NULL DEFAULT 'draf',
  catatan_tinjauan text CHECK (catatan_tinjauan IS NULL OR char_length(trim(catatan_tinjauan)) >= 10),
  diajukan_pada timestamptz,
  diterbitkan_pada timestamptz,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now()
);

-- 4. TABEL MODUL
CREATE TABLE IF NOT EXISTS public.modul (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kursus_id uuid NOT NULL REFERENCES public.kursus(id) ON DELETE CASCADE,
  urutan smallint NOT NULL CHECK (urutan >= 1 AND urutan <= 10),
  judul text NOT NULL,
  isi_materi text NOT NULL,
  video_url text CHECK (video_url IS NULL OR video_url ~ '^https://'),
  lampiran_path text,
  durasi_menit smallint NOT NULL CHECK (durasi_menit >= 5 AND durasi_menit <= 240),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_modul_kursus_urutan UNIQUE (kursus_id, urutan)
);

-- 5. TABEL SOAL
CREATE TABLE IF NOT EXISTS public.soal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES public.modul(id) ON DELETE CASCADE,
  urutan smallint NOT NULL CHECK (urutan >= 1 AND urutan <= 20),
  pertanyaan text NOT NULL,
  pilihan_a text NOT NULL,
  pilihan_b text NOT NULL,
  pilihan_c text NOT NULL,
  pilihan_d text NOT NULL,
  kunci_jawaban char(1) NOT NULL CHECK (kunci_jawaban IN ('A', 'B', 'C', 'D')),
  CONSTRAINT uq_soal_modul_urutan UNIQUE (modul_id, urutan)
);

-- 6. TABEL PENDAFTARAN
CREATE TABLE IF NOT EXISTS public.pendaftaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kursus_id uuid NOT NULL REFERENCES public.kursus(id),
  peserta_id uuid NOT NULL REFERENCES public.profiles(id),
  status public.status_pendaftaran_enum NOT NULL,
  nominal integer NOT NULL CHECK (nominal >= 0),
  metode_bayar public.metode_bayar_enum NOT NULL,
  batas_bayar timestamptz,
  mayar_invoice_id text UNIQUE,
  dibayar_pada timestamptz,
  dikonfirmasi_oleh uuid REFERENCES public.profiles(id),
  alasan_batal text CHECK (alasan_batal IS NULL OR char_length(trim(alasan_batal)) >= 10),
  didaftarkan_pada timestamptz NOT NULL DEFAULT now(),
  selesai_pada timestamptz,
  dibatalkan_pada timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pendaftaran_aktif_per_kursus 
ON public.pendaftaran (kursus_id, peserta_id) 
WHERE (status IN ('menunggu_bayar', 'aktif', 'selesai'));

-- 7. TABEL PROGRES_MODUL
CREATE TABLE IF NOT EXISTS public.progres_modul (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendaftaran_id uuid NOT NULL REFERENCES public.pendaftaran(id) ON DELETE CASCADE,
  modul_id uuid NOT NULL REFERENCES public.modul(id),
  materi_dibaca_pada timestamptz NOT NULL DEFAULT now(),
  lulus_pada timestamptz,
  CONSTRAINT uq_progres_pendaftaran_modul UNIQUE (pendaftaran_id, modul_id),
  CONSTRAINT chk_lulus_setelah_baca CHECK (lulus_pada IS NULL OR lulus_pada >= materi_dibaca_pada)
);

-- 8. TABEL PERCOBAAN_KUIS
CREATE TABLE IF NOT EXISTS public.percobaan_kuis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendaftaran_id uuid NOT NULL REFERENCES public.pendaftaran(id) ON DELETE CASCADE,
  modul_id uuid NOT NULL REFERENCES public.modul(id),
  nomor_percobaan smallint NOT NULL CHECK (nomor_percobaan >= 1 AND nomor_percobaan <= 3),
  jawaban jsonb NOT NULL,
  jumlah_soal smallint NOT NULL CHECK (jumlah_soal > 0),
  jumlah_benar smallint NOT NULL CHECK (jumlah_benar >= 0 AND jumlah_benar <= jumlah_soal),
  nilai smallint NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
  lulus boolean NOT NULL,
  dikerjakan_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_percobaan_nomor UNIQUE (pendaftaran_id, modul_id, nomor_percobaan)
);

-- 9. TABEL SERTIFIKAT
CREATE TABLE IF NOT EXISTS public.sertifikat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendaftaran_id uuid NOT NULL UNIQUE REFERENCES public.pendaftaran(id),
  tahun smallint NOT NULL,
  nomor_urut integer NOT NULL CHECK (nomor_urut > 0),
  nomor_sertifikat text NOT NULL UNIQUE,
  nama_peserta text NOT NULL,
  judul_kursus text NOT NULL,
  diterbitkan_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sertifikat_tahun_nomor UNIQUE (tahun, nomor_urut)
);

-- 10. TABEL AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pelaku_id uuid REFERENCES public.profiles(id),
  aksi text NOT NULL,
  nama_tabel text NOT NULL,
  id_data uuid,
  data_sebelum jsonb,
  data_sesudah jsonb,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 11. TRIGGER & HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, email, no_hp, peran, aktif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'no_hp',
    'peserta',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT peran::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kursus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modul ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progres_modul ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.percobaan_kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sertifikat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_select_instruktur_public" ON public.profiles;
CREATE POLICY "profiles_select_instruktur_public" ON public.profiles
  FOR SELECT TO anon
  USING (peran = 'instruktur');

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (
    (public.current_user_role() = 'admin') OR 
    (id = auth.uid() AND peran = 'peserta' AND aktif = true)
  );

-- POLICIES: KURSUS
DROP POLICY IF EXISTS "kursus_select" ON public.kursus;
CREATE POLICY "kursus_select" ON public.kursus
  FOR SELECT TO public
  USING (
    status = 'terbit' 
    OR (auth.uid() IS NOT NULL AND instruktur_id = auth.uid())
    OR (public.current_user_role() = 'admin')
    OR (EXISTS (
      SELECT 1 FROM public.pendaftaran 
      WHERE pendaftaran.kursus_id = kursus.id 
      AND pendaftaran.peserta_id = auth.uid()
      AND pendaftaran.status IN ('aktif', 'selesai')
    ))
  );

DROP POLICY IF EXISTS "kursus_insert_instruktur" ON public.kursus;
CREATE POLICY "kursus_insert_instruktur" ON public.kursus
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'instruktur' 
    AND instruktur_id = auth.uid()
    AND status = 'draf'
  );

DROP POLICY IF EXISTS "kursus_update" ON public.kursus;
CREATE POLICY "kursus_update" ON public.kursus
  FOR UPDATE TO authenticated
  USING (
    (public.current_user_role() = 'admin')
    OR (instruktur_id = auth.uid() AND status = 'draf')
  );

-- POLICIES: MODUL
DROP POLICY IF EXISTS "modul_select" ON public.modul;
CREATE POLICY "modul_select" ON public.modul
  FOR SELECT TO public
  USING (
    EXISTS (SELECT 1 FROM public.kursus WHERE kursus.id = modul.kursus_id AND kursus.status = 'terbit')
    OR (EXISTS (SELECT 1 FROM public.kursus WHERE kursus.id = modul.kursus_id AND kursus.instruktur_id = auth.uid()))
    OR (public.current_user_role() = 'admin')
  );

DROP POLICY IF EXISTS "modul_insert_instruktur" ON public.modul;
CREATE POLICY "modul_insert_instruktur" ON public.modul
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kursus 
      WHERE kursus.id = modul.kursus_id 
      AND kursus.instruktur_id = auth.uid() 
      AND kursus.status = 'draf'
    )
  );

DROP POLICY IF EXISTS "modul_update_instruktur" ON public.modul;
CREATE POLICY "modul_update_instruktur" ON public.modul
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kursus 
      WHERE kursus.id = modul.kursus_id 
      AND kursus.instruktur_id = auth.uid() 
      AND kursus.status = 'draf'
    )
  );

DROP POLICY IF EXISTS "modul_delete_instruktur" ON public.modul;
CREATE POLICY "modul_delete_instruktur" ON public.modul
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kursus 
      WHERE kursus.id = modul.kursus_id 
      AND kursus.instruktur_id = auth.uid() 
      AND kursus.status = 'draf'
    )
  );

-- POLICIES: SOAL
DROP POLICY IF EXISTS "soal_select" ON public.soal;
CREATE POLICY "soal_select" ON public.soal
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.modul
      JOIN public.kursus ON kursus.id = modul.kursus_id
      WHERE modul.id = soal.modul_id AND kursus.instruktur_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "soal_insert_instruktur" ON public.soal;
CREATE POLICY "soal_insert_instruktur" ON public.soal
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modul
      JOIN public.kursus ON kursus.id = modul.kursus_id
      WHERE modul.id = soal.modul_id AND kursus.instruktur_id = auth.uid() AND kursus.status = 'draf'
    )
  );

DROP POLICY IF EXISTS "soal_update_instruktur" ON public.soal;
CREATE POLICY "soal_update_instruktur" ON public.soal
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modul
      JOIN public.kursus ON kursus.id = modul.kursus_id
      WHERE modul.id = soal.modul_id AND kursus.instruktur_id = auth.uid() AND kursus.status = 'draf'
    )
  );

DROP POLICY IF EXISTS "soal_delete_instruktur" ON public.soal;
CREATE POLICY "soal_delete_instruktur" ON public.soal
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modul
      JOIN public.kursus ON kursus.id = modul.kursus_id
      WHERE modul.id = soal.modul_id AND kursus.instruktur_id = auth.uid() AND kursus.status = 'draf'
    )
  );

-- POLICIES: PENDAFTARAN
DROP POLICY IF EXISTS "pendaftaran_select" ON public.pendaftaran;
CREATE POLICY "pendaftaran_select" ON public.pendaftaran
  FOR SELECT TO authenticated
  USING (
    peserta_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.kursus 
      WHERE kursus.id = pendaftaran.kursus_id AND kursus.instruktur_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pendaftaran_update" ON public.pendaftaran;
CREATE POLICY "pendaftaran_update" ON public.pendaftaran
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR (peserta_id = auth.uid() AND status = 'menunggu_bayar')
  );

-- POLICIES: PROGRES_MODUL
DROP POLICY IF EXISTS "progres_modul_select" ON public.progres_modul;
CREATE POLICY "progres_modul_select" ON public.progres_modul
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pendaftaran WHERE pendaftaran.id = progres_modul.pendaftaran_id AND pendaftaran.peserta_id = auth.uid())
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.pendaftaran 
      JOIN public.kursus ON kursus.id = pendaftaran.kursus_id
      WHERE pendaftaran.id = progres_modul.pendaftaran_id AND kursus.instruktur_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "progres_modul_insert_update" ON public.progres_modul;
CREATE POLICY "progres_modul_insert_update" ON public.progres_modul
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pendaftaran WHERE pendaftaran.id = progres_modul.pendaftaran_id AND pendaftaran.peserta_id = auth.uid())
    OR public.current_user_role() = 'admin'
  );

-- POLICIES: PERCOBAAN_KUIS
DROP POLICY IF EXISTS "percobaan_kuis_select" ON public.percobaan_kuis;
CREATE POLICY "percobaan_kuis_select" ON public.percobaan_kuis
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pendaftaran WHERE pendaftaran.id = percobaan_kuis.pendaftaran_id AND pendaftaran.peserta_id = auth.uid())
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.pendaftaran 
      JOIN public.kursus ON kursus.id = pendaftaran.kursus_id
      WHERE pendaftaran.id = percobaan_kuis.pendaftaran_id AND kursus.instruktur_id = auth.uid()
    )
  );

-- POLICIES: SERTIFIKAT
DROP POLICY IF EXISTS "sertifikat_select" ON public.sertifikat;
CREATE POLICY "sertifikat_select" ON public.sertifikat
  FOR SELECT TO public
  USING (true);

-- POLICIES: AUDIT_LOG
DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');
