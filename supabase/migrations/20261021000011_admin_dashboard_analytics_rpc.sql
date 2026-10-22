-- ==============================================================================
-- Migrasi: Admin Dashboard Analytics RPC (US-10, BR-06, BR-11, BR-12, PRD Bagian 9)
-- Menyediakan fungsi analitik terpusat dan terproteksi di level database
-- Akses non-admin ditolak seketika (RAISE EXCEPTION)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_analytics(
  p_start_date timestamptz DEFAULT (now() - interval '8 weeks'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_summary jsonb;
  v_weekly_reg jsonb;
  v_weekly_rev jsonb;
  v_completion_rates jsonb;
  v_low_pass_modules jsonb;
  v_nearly_full jsonb;
BEGIN
  -- 1. Verifikasi Wewenang Admin (BR-12, PRD Bagian 9)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi';
  END IF;

  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang berhak mengakses dashboard analitik (BR-12)';
  END IF;

  -- 2. Ringkasan 4 Kartu KPI Utama (PRD Bagian 9 Poin 1)
  SELECT jsonb_build_object(
    'pendaftaran_bulan_ini', (
      SELECT count(*)::integer 
      FROM public.pendaftaran 
      WHERE date_trunc('month', didaftarkan_pada) = date_trunc('month', now())
    ),
    'pendapatan_bulan_ini', (
      SELECT coalesce(sum(nominal), 0)::bigint
      FROM public.pendaftaran
      WHERE status IN ('aktif', 'selesai')
        AND dibayar_pada IS NOT NULL
        AND date_trunc('month', dibayar_pada) = date_trunc('month', now())
    ),
    'peserta_aktif', (
      SELECT count(DISTINCT peserta_id)::integer
      FROM public.pendaftaran
      WHERE status = 'aktif'
    ),
    'sertifikat_terbit', (
      SELECT count(*)::integer
      FROM public.sertifikat
    )
  ) INTO v_summary;

  -- 3. Grafik Batang Pendaftaran per Minggu: Gratis vs Berbayar (PRD Bagian 9 Poin 2)
  WITH weeks AS (
    SELECT generate_series(
      date_trunc('week', p_start_date),
      date_trunc('week', p_end_date),
      interval '1 week'
    ) AS week_start
  ),
  reg_weekly AS (
    SELECT 
      w.week_start,
      to_char(w.week_start, 'DD Mon') AS label,
      count(p.id) FILTER (WHERE p.id IS NOT NULL AND p.nominal = 0)::integer AS gratis_count,
      count(p.id) FILTER (WHERE p.id IS NOT NULL AND p.nominal > 0)::integer AS berbayar_count,
      count(p.id) FILTER (WHERE p.id IS NOT NULL)::integer AS total_count
    FROM weeks w
    LEFT JOIN public.pendaftaran p 
      ON p.didaftarkan_pada >= w.week_start 
      AND p.didaftarkan_pada < w.week_start + interval '1 week'
    GROUP BY w.week_start
    ORDER BY w.week_start ASC
  )
  SELECT coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  INTO v_weekly_reg
  FROM (SELECT * FROM reg_weekly ORDER BY week_start ASC) sub;

  -- 4. Grafik Garis Pendapatan per Minggu (PRD Bagian 9 Poin 3)
  WITH weeks AS (
    SELECT generate_series(
      date_trunc('week', p_start_date),
      date_trunc('week', p_end_date),
      interval '1 week'
    ) AS week_start
  ),
  rev_weekly AS (
    SELECT 
      w.week_start,
      to_char(w.week_start, 'DD Mon') AS label,
      coalesce(sum(p.nominal), 0)::bigint AS revenue
    FROM weeks w
    LEFT JOIN public.pendaftaran p 
      ON p.dibayar_pada >= w.week_start 
      AND p.dibayar_pada < w.week_start + interval '1 week'
      AND p.status IN ('aktif', 'selesai')
    GROUP BY w.week_start
    ORDER BY w.week_start ASC
  )
  SELECT coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  INTO v_weekly_rev
  FROM (SELECT * FROM rev_weekly ORDER BY week_start ASC) sub;

  -- 5. Tingkat Penyelesaian per Kursus: selesai / (aktif + selesai) (PRD Bagian 9 Poin 4)
  WITH course_stats AS (
    SELECT 
      k.id,
      k.judul,
      k.slug,
      count(p.id) FILTER (WHERE p.status = 'aktif')::integer AS aktif_count,
      count(p.id) FILTER (WHERE p.status = 'selesai')::integer AS selesai_count,
      count(p.id) FILTER (WHERE p.status IN ('aktif', 'selesai'))::integer AS total_belajar,
      CASE 
        WHEN count(p.id) FILTER (WHERE p.status IN ('aktif', 'selesai')) > 0 THEN
          round(
            (count(p.id) FILTER (WHERE p.status = 'selesai')::numeric / 
             count(p.id) FILTER (WHERE p.status IN ('aktif', 'selesai'))::numeric) * 100, 
            1
          )
        ELSE 0
      END AS completion_rate
    FROM public.kursus k
    LEFT JOIN public.pendaftaran p ON p.kursus_id = k.id
    WHERE k.status = 'terbit'
    GROUP BY k.id, k.judul, k.slug
    ORDER BY completion_rate DESC, k.judul ASC
  )
  SELECT coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  INTO v_completion_rates
  FROM (SELECT * FROM course_stats ORDER BY completion_rate DESC, judul ASC) sub;

  -- 6. Tabel Modul dengan Tingkat Lulus Percobaan Pertama Terendah (PRD Bagian 9 Poin 5)
  WITH attempt_stats AS (
    SELECT 
      m.id AS modul_id,
      m.judul AS modul_judul,
      k.judul AS kursus_judul,
      count(pk.id)::integer AS total_percobaan_1,
      count(pk.id) FILTER (WHERE pk.lulus = true)::integer AS lulus_percobaan_1,
      CASE 
        WHEN count(pk.id) > 0 THEN
          round((count(pk.id) FILTER (WHERE pk.lulus = true)::numeric / count(pk.id)::numeric) * 100, 1)
        ELSE 0
      END AS first_pass_rate
    FROM public.modul m
    JOIN public.kursus k ON k.id = m.kursus_id
    JOIN public.percobaan_kuis pk ON pk.modul_id = m.id AND pk.nomor_percobaan = 1
    GROUP BY m.id, m.judul, k.judul
    HAVING count(pk.id) >= 1
    ORDER BY first_pass_rate ASC, total_percobaan_1 DESC
    LIMIT 6
  )
  SELECT coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  INTO v_low_pass_modules
  FROM (SELECT * FROM attempt_stats ORDER BY first_pass_rate ASC, total_percobaan_1 DESC) sub;

  -- 7. Tabel Kursus Hampir Penuh (Sisa Kursi <= 2) (PRD Bagian 9 Poin 6, BR-06)
  WITH seat_stats AS (
    SELECT 
      k.id,
      k.judul,
      k.slug,
      k.harga,
      k.kuota,
      count(p.id) FILTER (
        WHERE p.status IN ('aktif', 'selesai')
           OR (p.status = 'menunggu_bayar' AND (p.batas_bayar IS NULL OR p.batas_bayar > now()))
      )::integer AS kursi_terpakai,
      (k.kuota - count(p.id) FILTER (
        WHERE p.status IN ('aktif', 'selesai')
           OR (p.status = 'menunggu_bayar' AND (p.batas_bayar IS NULL OR p.batas_bayar > now()))
      )::integer) AS sisa_kursi
    FROM public.kursus k
    LEFT JOIN public.pendaftaran p ON p.kursus_id = k.id
    WHERE k.status = 'terbit'
    GROUP BY k.id, k.judul, k.slug, k.harga, k.kuota
  )
  SELECT coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  INTO v_nearly_full
  FROM (
    SELECT * 
    FROM seat_stats 
    WHERE sisa_kursi <= 2 
    ORDER BY sisa_kursi ASC, kuota DESC
  ) sub;

  -- 8. Kembalikan paket analitik lengkap
  RETURN jsonb_build_object(
    'summary', v_summary,
    'weekly_registrations', v_weekly_reg,
    'weekly_revenue', v_weekly_rev,
    'course_completion_rates', v_completion_rates,
    'low_pass_modules', v_low_pass_modules,
    'nearly_full_courses', v_nearly_full,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_analytics(timestamptz, timestamptz) TO authenticated;
