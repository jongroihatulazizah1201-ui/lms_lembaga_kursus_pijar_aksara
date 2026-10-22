import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  ArrowLeft,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Filter,
  BarChart3,
  LineChart,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Dashboard wajib noindex
export const metadata: Metadata = {
  title: 'Dashboard Statistik & Analitik | Lembaga Kursus Pijar Aksara',
  description: 'Dashboard pengelola lembaga untuk melihat analitik pendaftaran, pendapatan, dan tingkat penyelesaian kursus.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const { range } = await searchParams;
  const currentRange = range || '8w';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  // 1. Verifikasi peran admin (Route Guard)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    redirect('/kursus-saya');
  }

  // 2. Hitung rentang tanggal berdasarkan preset filter (PRD Bagian 9)
  let weeksCount = 8;
  if (currentRange === '4w') weeksCount = 4;
  else if (currentRange === '12w') weeksCount = 12;
  else if (currentRange === 'all') weeksCount = 26;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - weeksCount * 7);

  // 3. Panggil RPC Database get_admin_dashboard_analytics (Enforced at DB level, BR-12)
  const { data: analytics, error: errAnalytics } = await supabase.rpc('get_admin_dashboard_analytics', {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString()
  });

  const summary = analytics?.summary || {
    pendaftaran_bulan_ini: 0,
    pendapatan_bulan_ini: 0,
    peserta_aktif: 0,
    sertifikat_terbit: 0,
  };

  const weeklyRegistrations = (analytics?.weekly_registrations || []) as Array<{
    week_start: string;
    label: string;
    gratis_count: number;
    berbayar_count: number;
    total_count: number;
  }>;

  const weeklyRevenue = (analytics?.weekly_revenue || []) as Array<{
    week_start: string;
    label: string;
    revenue: number;
  }>;

  const courseCompletionRates = (analytics?.course_completion_rates || []) as Array<{
    id: string;
    judul: string;
    slug: string;
    aktif_count: number;
    selesai_count: number;
    total_belajar: number;
    completion_rate: number;
  }>;

  const lowPassModules = (analytics?.low_pass_modules || []) as Array<{
    modul_id: string;
    modul_judul: string;
    kursus_judul: string;
    total_percobaan_1: number;
    lulus_percobaan_1: number;
    first_pass_rate: number;
  }>;

  const nearlyFullCourses = (analytics?.nearly_full_courses || []) as Array<{
    id: string;
    judul: string;
    slug: string;
    harga: number;
    kuota: number;
    kursi_terpakai: number;
    sisa_kursi: number;
  }>;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Kalkulasi data untuk visualisasi grafik SVG
  const maxRegWeekly = Math.max(...weeklyRegistrations.map((w) => w.total_count), 5);
  const maxRevenueWeekly = Math.max(...weeklyRevenue.map((w) => w.revenue), 1000000);

  return (
    <div style={{ paddingBottom: '96px' }}>
      {/* Header Section */}
      <section style={{
        backgroundColor: 'rgba(18, 26, 43, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '32px 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <Link
                href="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.86rem',
                  color: 'var(--text-dim)',
                  textDecoration: 'none',
                  marginBottom: '10px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Kembali ke Panel Pengelola</span>
              </Link>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#ffffff', marginBottom: '6px' }}>
                Dashboard Statistik & Laporan
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
                Pantau performa pendaftaran, pendapatan terverifikasi, dan tingkat penyelesaian kursus secara real-time.
              </p>
            </div>

            {/* Filter Rentang Tanggal (PRD Bagian 9) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Calendar size={15} color="var(--primary)" style={{ marginLeft: '6px' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginRight: '6px' }}>Rentang:</span>
              {[
                { id: '4w', label: '4 Minggu' },
                { id: '8w', label: '8 Minggu' },
                { id: '12w', label: '12 Minggu' },
                { id: 'all', label: 'Semua' },
              ].map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/dashboard?range=${p.id}`}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: currentRange === p.id ? 600 : 400,
                    backgroundColor: currentRange === p.id ? 'var(--primary)' : 'transparent',
                    color: currentRange === p.id ? '#ffffff' : 'var(--text-dim)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '32px' }}>
        {/* ROW 1: 4 KARTU RINGKASAN KPI (PRD Bagian 9 Poin 1) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Card 1: Pendaftaran Bulan Ini */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Pendaftaran Bulan Ini
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}>
                <CreditCard size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {summary.pendaftaran_bulan_ini}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Bulan berjalan (seluruh kursus)
            </div>
          </div>

          {/* Card 2: Pendapatan Bulan Ini */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Pendapatan Bulan Ini
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', lineHeight: 1.1 }}>
              {formatRupiah(summary.pendapatan_bulan_ini)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Pembayaran terverifikasi & aktif
            </div>
          </div>

          {/* Card 3: Peserta Aktif */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Peserta Aktif
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {summary.peserta_aktif}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Peserta sedang belajar di platform
            </div>
          </div>

          {/* Card 4: Sertifikat Terbit */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Sertifikat Terbit
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc'
              }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {summary.sertifikat_terbit}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Nomor unik terbit (BR-11)
            </div>
          </div>
        </div>

        {/* ROW 2: 2 GRAFIK UTAMA (PRD Bagian 9 Poin 2 & Poin 3) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Grafik 1: Pendaftaran Mingguan (Gratis vs Berbayar) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 4px 0' }}>
                  Pendaftaran per Minggu
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0 }}>
                  Perbandingan pendaftaran kursus gratis vs berbayar
                </p>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
                  Berbayar
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                  Gratis
                </span>
              </div>
            </div>

            {/* SVG Bar Chart */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              {weeklyRegistrations.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                  Tidak ada data pendaftaran dalam rentang ini
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingBottom: '24px' }}>
                  {weeklyRegistrations.map((w, idx) => {
                    const paidHeight = (w.berbayar_count / maxRegWeekly) * 140;
                    const freeHeight = (w.gratis_count / maxRegWeekly) * 140;

                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', padding: '0 4px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                          {w.total_count > 0 ? w.total_count : ''}
                        </div>

                        {/* Stacked Bar */}
                        <div style={{ width: '100%', maxWidth: '28px', display: 'flex', flexDirection: 'column', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                          {w.berbayar_count > 0 && (
                            <div style={{ height: `${paidHeight}px`, backgroundColor: '#3b82f6', minHeight: '4px' }} title={`Berbayar: ${w.berbayar_count}`} />
                          )}
                          {w.gratis_count > 0 && (
                            <div style={{ height: `${freeHeight}px`, backgroundColor: '#10b981', minHeight: '4px' }} title={`Gratis: ${w.gratis_count}`} />
                          )}
                          {w.total_count === 0 && (
                            <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                          )}
                        </div>

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                          {w.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Grafik 2: Pendapatan Mingguan (Line / Area Chart) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 4px 0' }}>
                  Pendapatan per Minggu
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0 }}>
                  Total omzet kursus terbayar (aktif dan selesai)
                </p>
              </div>

              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#10b981' }}>
                Total: {formatRupiah(weeklyRevenue.reduce((acc, curr) => acc + curr.revenue, 0))}
              </div>
            </div>

            {/* SVG Area Chart */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              {weeklyRevenue.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                  Tidak ada pendapatan dalam rentang ini
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingBottom: '24px' }}>
                  {weeklyRevenue.map((w, idx) => {
                    const barHeight = maxRevenueWeekly > 0 ? (w.revenue / maxRevenueWeekly) * 140 : 0;

                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', padding: '0 4px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>
                          {w.revenue > 0 ? (w.revenue >= 1000000 ? `${(w.revenue / 1000000).toFixed(1)}jt` : `${Math.round(w.revenue / 1000)}k`) : ''}
                        </div>

                        {/* Revenue Bar with gradient */}
                        <div style={{
                          width: '100%',
                          maxWidth: '28px',
                          height: `${Math.max(barHeight, w.revenue > 0 ? 6 : 2)}px`,
                          borderRadius: '4px 4px 0 0',
                          background: w.revenue > 0 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.06)'
                        }} title={formatRupiah(w.revenue)} />

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                          {w.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: GRAFIK TINGKAT PENYELESAIAN PER KURSUS (PRD Bagian 9 Poin 4) */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 4px 0' }}>
                Tingkat Penyelesaian per Kursus
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', margin: 0 }}>
                Rasio kelulusan peserta: Selesai &divide; (Aktif + Selesai) &times; 100%
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {courseCompletionRates.map((c) => (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>
                    {c.judul}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {c.selesai_count} lulus / {c.total_belajar} peserta
                    </span>
                    <strong style={{ color: c.completion_rate >= 70 ? '#10b981' : c.completion_rate >= 40 ? '#fbbf24' : '#f87171' }}>
                      {c.completion_rate}%
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '10px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${c.completion_rate}%`,
                    borderRadius: '5px',
                    backgroundColor: c.completion_rate >= 70 ? '#10b981' : c.completion_rate >= 40 ? '#fbbf24' : '#ef4444',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 4: TABEL MASUKAN INSTRUKTUR & KURSUS HAMPIR PENUH (PRD Bagian 9 Poin 5 & Poin 6) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px'
        }}>
          {/* Tabel Modul Percobaan 1 Terendah */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={18} color="#fbbf24" />
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                  Evaluasi Materi & Soal Kuis
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                  Modul dengan tingkat lulus percobaan pertama terendah (masukan instruktur)
                </p>
              </div>
            </div>

            {lowPassModules.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
                Belum ada data pengerjaan kuis pada percobaan pertama.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Modul & Kursus</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Peserta</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Lulus Ke-1</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPassModules.map((m) => (
                    <tr key={m.modul_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ color: '#ffffff', fontWeight: 500 }}>{m.modul_judul}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{m.kursus_judul}</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {m.lulus_percobaan_1} / {m.total_percobaan_1}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          color: m.first_pass_rate < 50 ? '#ef4444' : '#fbbf24'
                        }}>
                          {m.first_pass_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Tabel Kursus Hampir Penuh (Sisa Kursi <= 2) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                  Kursus Hampir Penuh
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                  Kursus terbit dengan sisa kursi 2 atau kurang (BR-06)
                </p>
              </div>

              <Link
                href="/admin?tab=kursus"
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                <span>Kelola Kuota</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {nearlyFullCourses.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#10b981', fontSize: '0.86rem' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                Seluruh kursus terbit memiliki ketersediaan kursi yang cukup (&gt; 2 kursi).
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Judul Kursus</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Kuota</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Terpakai</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Sisa Kursi</th>
                  </tr>
                </thead>
                <tbody>
                  {nearlyFullCourses.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ color: '#ffffff', fontWeight: 500 }}>{c.judul}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                          {c.harga === 0 ? 'Gratis' : formatRupiah(c.harga)}
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {c.kuota}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {c.kursi_terpakai}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                          {c.sisa_kursi === 0 ? 'Penuh' : `Sisa ${c.sisa_kursi}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
