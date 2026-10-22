import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lembaga Kursus Pijar Aksara | Kursus Vokasi & Pelatihan Kompetensi',
  description: 'Platform pembelajaran kursus vokasi dan keterampilan praktis berstandar industri di Depok. Tingkatkan keahlian administrasi perkantoran, desain grafis, pembukuan, dan bahasa.',
  keywords: ['kursus depok', 'pijar aksara', 'kursus excel', 'kursus canva', 'kursus pembukuan umkm', 'pelatihan vokasi'],
  icons: {
    icon: '/logo-pijar-aksara.png',
    apple: '/logo-pijar-aksara.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('nama_lengkap, peran')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // 1. JIKA SEBAGAI TAMU / BELUM LOGIN:
  // Tampilkan bentuk web awal standar (Horizontal Top Navbar, tanpa sidebar kiri)
  if (!user || !profile) {
    return (
      <html lang="id">
        <body className="bg-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-[#ffdf0f] selection:text-slate-900">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    );
  }

  // 2. JIKA SUDAH LOGIN (Peserta, Instruktur, atau Admin):
  // Tampilkan antarmuka portal aplikasi dengan Sidebar Kiri lengkap
  return (
    <html lang="id">
      <body className="bg-white text-slate-900 min-h-screen flex flex-col lg:flex-row antialiased selection:bg-[#ffdf0f] selection:text-slate-900">
        {/* Left Sidebar untuk pengguna terautentikasi (Dibalut Suspense untuk useSearchParams) */}
        <Suspense fallback={<aside className="w-72 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 hidden lg:block z-30" />}>
          <Sidebar user={user} profile={profile} />
        </Suspense>

        {/* Workspace konten aplikasi (Tanpa Footer publik saat login) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-white">
          <main className="flex-1 pb-20 lg:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav untuk akses cepat */}
        <MobileBottomNav user={user} profile={profile} />
      </body>
    </html>
  );
}
