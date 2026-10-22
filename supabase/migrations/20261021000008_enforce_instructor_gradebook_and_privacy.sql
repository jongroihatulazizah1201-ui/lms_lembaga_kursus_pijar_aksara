-- ==============================================================================
-- Migrasi: Enforce Instructor Gradebook & Participant Privacy (US-07, BR-12)
-- 1. RPC get_peserta_dan_nilai_kursus: Mengambil rekapitulasi peserta, progres,
--    dan nilai kuis per modul dengan proteksi ketat kepemilikan instruktur (BR-12).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_peserta_dan_nilai_kursus(p_kursus_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_kursus RECORD;
  v_modul_list jsonb;
  v_peserta_list jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();

  -- Ambil data kursus
  SELECT id, judul, slug, kategori, instruktur_id
  INTO v_kursus
  FROM public.kursus
  WHERE id = p_kursus_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus tidak ditemukan';
  END IF;

  -- Validasi Otorisasi (BR-12): Hanya instruktur pemilik kursus atau admin
  IF v_role != 'admin' AND v_kursus.instruktur_id != v_user_id THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki izin untuk melihat data peserta pada kursus ini (BR-12)';
  END IF;

  -- Ambil daftar modul kursus berurutan
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'urutan', m.urutan,
        'judul', m.judul
      ) ORDER BY m.urutan ASC
    ),
    '[]'::jsonb
  ) INTO v_modul_list
  FROM public.modul m
  WHERE m.kursus_id = p_kursus_id;

  -- Ambil data seluruh peserta terdaftar beserta progres dan nilai kuis per modul
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'pendaftaran_id', p.id,
        'peserta_id', prof.id,
        'nama_lengkap', prof.nama_lengkap,
        'email', prof.email,
        'no_hp', prof.no_hp,
        'status_pendaftaran', p.status,
        'didaftarkan_pada', p.didaftarkan_pada,
        'modul_lulus_count', (
          SELECT COUNT(*) 
          FROM public.progres_modul pm
          WHERE pm.pendaftaran_id = p.id AND pm.lulus_pada IS NOT NULL
        ),
        'nilai_per_modul', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'modul_id', m.id,
              'urutan', m.urutan,
              'lulus', (pm.lulus_pada IS NOT NULL),
              'nilai_terbaik', (
                SELECT MAX(pk.nilai)
                FROM public.percobaan_kuis pk
                WHERE pk.pendaftaran_id = p.id AND pk.modul_id = m.id
              ),
              'jumlah_percobaan', (
                SELECT COUNT(*)
                FROM public.percobaan_kuis pk
                WHERE pk.pendaftaran_id = p.id AND pk.modul_id = m.id
              )
            ) ORDER BY m.urutan ASC
          )
          FROM public.modul m
          LEFT JOIN public.progres_modul pm 
            ON pm.modul_id = m.id AND pm.pendaftaran_id = p.id
          WHERE m.kursus_id = p_kursus_id
        )
      ) ORDER BY p.didaftarkan_pada DESC
    ),
    '[]'::jsonb
  ) INTO v_peserta_list
  FROM public.pendaftaran p
  JOIN public.profiles prof ON prof.id = p.peserta_id
  WHERE p.kursus_id = p_kursus_id;

  RETURN jsonb_build_object(
    'kursus_id', v_kursus.id,
    'judul_kursus', v_kursus.judul,
    'slug', v_kursus.slug,
    'kategori', v_kursus.kategori,
    'modul', v_modul_list,
    'peserta', v_peserta_list
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_peserta_dan_nilai_kursus(uuid) TO authenticated;
