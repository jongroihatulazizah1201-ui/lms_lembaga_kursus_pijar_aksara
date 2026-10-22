-- ==============================================================================
-- Migrasi: Enforce Module Access & Progress (US-03, BR-08, BR-11, BR-12)
-- ==============================================================================

-- 1. Buat bucket penyimpanan privat materi_pdf jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('materi_pdf', 'materi_pdf', false, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- 2. Fungsi RPC untuk mengambil seluruh modul dan status aksesnya di Ruang Belajar (BR-08)
CREATE OR REPLACE FUNCTION public.get_ruang_belajar(p_slug text)
RETURNS TABLE (
  pendaftaran_id uuid,
  kursus_id uuid,
  kursus_judul text,
  kursus_slug text,
  modul_id uuid,
  urutan smallint,
  judul text,
  durasi_menit smallint,
  video_url text,
  lampiran_path text,
  isi_materi text,
  status_akses text, -- 'terbuka', 'lulus', 'terkunci'
  materi_dibaca_pada timestamptz,
  lulus_pada timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran public.pendaftaran;
  v_kursus public.kursus;
  v_prev_lulus boolean;
  r RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  -- Cari kursus berdasarkan slug
  SELECT * INTO v_kursus FROM public.kursus WHERE slug = p_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus dengan slug "%" tidak ditemukan', p_slug;
  END IF;

  -- Periksa pendaftaran peserta aktif atau selesai (BR-08)
  SELECT * INTO v_pendaftaran 
  FROM public.pendaftaran p
  WHERE p.kursus_id = v_kursus.id 
    AND p.peserta_id = v_user_id 
    AND p.status IN ('aktif', 'selesai')
  ORDER BY p.didaftarkan_pada DESC 
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Materi hanya dapat dibuka oleh peserta dengan pendaftaran aktif atau selesai (BR-08)';
  END IF;

  -- Iterasi modul secara berurutan dan tentukan status akses
  v_prev_lulus := true; -- Modul 1 selalu terbuka (BR-08)

  FOR r IN (
    SELECT 
      m.id AS m_id,
      m.urutan AS m_urutan,
      m.judul AS m_judul,
      m.durasi_menit AS m_durasi,
      m.video_url AS m_video,
      m.lampiran_path AS m_lampiran,
      m.isi_materi AS m_isi,
      pm.materi_dibaca_pada AS pm_baca,
      pm.lulus_pada AS pm_lulus
    FROM public.modul m
    LEFT JOIN public.progres_modul pm 
      ON pm.modul_id = m.id AND pm.pendaftaran_id = v_pendaftaran.id
    WHERE m.kursus_id = v_kursus.id
    ORDER BY m.urutan ASC
  ) LOOP
    pendaftaran_id := v_pendaftaran.id;
    kursus_id := v_kursus.id;
    kursus_judul := v_kursus.judul;
    kursus_slug := v_kursus.slug;
    modul_id := r.m_id;
    urutan := r.m_urutan;
    judul := r.m_judul;
    durasi_menit := r.m_durasi;
    materi_dibaca_pada := r.pm_baca;
    lulus_pada := r.pm_lulus;

    IF r.pm_lulus IS NOT NULL THEN
      status_akses := 'lulus';
      video_url := r.m_video;
      lampiran_path := r.m_lampiran;
      isi_materi := r.m_isi;
      v_prev_lulus := true;
    ELSIF v_prev_lulus THEN
      status_akses := 'terbuka';
      video_url := r.m_video;
      lampiran_path := r.m_lampiran;
      isi_materi := r.m_isi;
      v_prev_lulus := false; -- Modul berikutnya belum lulus
    ELSE
      -- Terkunci (BR-08): sembunyikan konten rahasia di level DB
      status_akses := 'terkunci';
      video_url := NULL;
      lampiran_path := NULL;
      isi_materi := NULL;
      v_prev_lulus := false;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ruang_belajar(text) TO authenticated;


-- 3. Fungsi RPC untuk menandai materi sudah dibaca (BR-08)
CREATE OR REPLACE FUNCTION public.tandai_materi_dibaca(p_pendaftaran_id uuid, p_modul_id uuid)
RETURNS public.progres_modul
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pendaftaran public.pendaftaran;
  v_modul public.modul;
  v_prev_modul public.modul;
  v_prev_progres public.progres_modul;
  v_result public.progres_modul;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  -- 1. Validasi kepemilikan pendaftaran dan status aktif/selesai
  SELECT * INTO v_pendaftaran FROM public.pendaftaran WHERE id = p_pendaftaran_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan';
  END IF;

  IF v_pendaftaran.peserta_id != v_user_id THEN
    RAISE EXCEPTION 'Akses ditolak: Pendaftaran bukan milik Anda (BR-12)';
  END IF;

  IF v_pendaftaran.status NOT IN ('aktif', 'selesai') THEN
    RAISE EXCEPTION 'Hanya pendaftaran aktif atau selesai yang dapat menandai materi (BR-08)';
  END IF;

  -- 2. Ambil data modul
  SELECT * INTO v_modul FROM public.modul WHERE id = p_modul_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modul tidak ditemukan';
  END IF;

  IF v_modul.kursus_id != v_pendaftaran.kursus_id THEN
    RAISE EXCEPTION 'Modul tidak sesuai dengan kursus yang didaftar';
  END IF;

  -- 3. Periksa apakah modul terkunci (urutan > 1 harus sudah lulus modul sebelumnya, BR-08)
  IF v_modul.urutan > 1 THEN
    SELECT * INTO v_prev_modul 
    FROM public.modul 
    WHERE kursus_id = v_pendaftaran.kursus_id AND urutan = v_modul.urutan - 1;

    IF FOUND THEN
      SELECT * INTO v_prev_progres 
      FROM public.progres_modul 
      WHERE pendaftaran_id = p_pendaftaran_id AND modul_id = v_prev_modul.id;

      IF v_prev_progres.lulus_pada IS NULL THEN
        RAISE EXCEPTION 'Modul % masih terkunci. Anda harus lulus kuis modul sebelumnya terlebih dahulu (BR-08)', v_modul.urutan;
      END IF;
    END IF;
  END IF;

  -- 4. Catat atau perbarui materi_dibaca_pada
  INSERT INTO public.progres_modul (
    pendaftaran_id,
    modul_id,
    materi_dibaca_pada
  ) VALUES (
    p_pendaftaran_id,
    p_modul_id,
    now()
  )
  ON CONFLICT (pendaftaran_id, modul_id)
  DO UPDATE SET
    materi_dibaca_pada = COALESCE(public.progres_modul.materi_dibaca_pada, now())
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tandai_materi_dibaca(uuid, uuid) TO authenticated;
