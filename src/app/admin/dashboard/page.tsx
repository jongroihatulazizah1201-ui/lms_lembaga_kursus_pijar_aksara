import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AdminDashboardView, { AdminDashboardData } from '@/components/AdminDashboardView';

// Kebutuhan Non-Fungsional PRD Bagian 10: Dashboard wajib noindex dan tidak masuk sitemap
export const metadata: Metadata = {
  title: 'Dashboard Statistik & Laporan | Lembaga Kursus Pijar Aksara',
  description: 'Dashboard khusus Admin untuk melihat ringkasan performa pendaftaran, pendapatan, dan rasio penyelesaian kursus.',
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  // 1. Verifikasi peran admin di level database (Route Guard & BR-12)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    // PRD Bagian 9: Instruktur tidak membuka Dashboard; diarahkan ke ringkasan kursus
    redirect('/kursus-saya');
  }

  // 2. Hitung rentang tanggal berdasarkan filter preset (PRD Bagian 9: bawaan 8 minggu terakhir)
  let weeksCount = 8;
  if (currentRange === '4w') weeksCount = 4;
  else if (currentRange === '12w') weeksCount = 12;
  else if (currentRange === 'all') weeksCount = 52;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - weeksCount * 7);

  // 3. Panggil RPC Database get_admin_dashboard_analytics (Enforced at DB level, BR-12)
  const { data: analytics, error: errAnalytics } = await supabase.rpc(
    'get_admin_dashboard_analytics',
    {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    }
  );

  if (errAnalytics) {
    console.error('Error fetching admin dashboard analytics:', errAnalytics);
  }

  const initialData: AdminDashboardData = {
    summary: analytics?.summary || {
      pendaftaran_bulan_ini: 0,
      pendapatan_bulan_ini: 0,
      peserta_aktif: 0,
      sertifikat_terbit: 0,
    },
    weekly_registrations: analytics?.weekly_registrations || [],
    weekly_revenue: analytics?.weekly_revenue || [],
    course_completion_rates: analytics?.course_completion_rates || [],
    low_pass_modules: analytics?.low_pass_modules || [],
    nearly_full_courses: analytics?.nearly_full_courses || [],
    generated_at: analytics?.generated_at,
  };

  return (
    <AdminDashboardView
      initialData={initialData}
      currentRange={currentRange}
      adminName={profile.nama_lengkap || 'Administrator'}
      adminEmail={profile.email || user.email || ''}
    />
  );
}
