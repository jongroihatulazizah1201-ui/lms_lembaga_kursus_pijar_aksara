import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  preload: true,
});

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
  const headersList = await headers();
  const currentPath = headersList.get('x-pathname') || '';
  const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register') || currentPath.startsWith('/daftar');
  const isInternalApp = currentPath.startsWith('/admin') ||
                        currentPath.startsWith('/instruktur') ||
                        currentPath.startsWith('/kursus-saya') ||
                        currentPath.startsWith('/belajar') ||
                        currentPath.startsWith('/dashboard') ||
                        currentPath.startsWith('/profil');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let urgentQueueCount = 0;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('nama_lengkap, peran, no_hp, avatar_url')
      .eq('id', user.id)
      .single();
    profile = data;

    if (profile?.peran === 'admin') {
      const { getUrgentQueueCount } = await import('@/lib/antrean');
      urgentQueueCount = await getUrgentQueueCount(supabase);
    }
  }

  // 1. JIKA PENGGUNA SUDAH LOGIN TETAPI MEMBUKA HALAMAN AUTH (/login, /register, /daftar):
  // Jangan pernah tampilkan halaman auth atau Navbar terautentikasi di /login!
  // Segera alihkan detik itu juga langsung ke ruang kerja masing-masing sesuai peran
  if (user && profile && isAuthPage) {
    if (profile.peran === 'admin') {
      redirect('/admin/dashboard');
    } else if (profile.peran === 'instruktur') {
      redirect('/instruktur');
    } else {
      redirect('/dashboard');
    }
  }

  // 2. JIKA DI HALAMAN AUTH UNTUK TAMU (Belum Login):
  // Tampilkan hanya Top Navbar & Form tanpa Footer agar footer tidak pernah muncul saat proses login
  if (isAuthPage) {
    return (
      <html lang="id" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
        <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-[#ffdf0f] selection:text-slate-900">
          <Navbar user={user} profile={profile} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    );
  }

  // 3. JIKA DI AREA APLIKASI INTERNAL ATAU PENGGUNA TERAUTENTIKASI:
  // Tampilkan antarmuka portal aplikasi dengan Sidebar Kiri, TANPA Footer publik
  if (isInternalApp || (user && profile)) {
    return (
      <html lang="id" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
        <body suppressHydrationWarning className="bg-white text-slate-900 min-h-screen flex flex-col lg:flex-row antialiased selection:bg-[#ffdf0f] selection:text-slate-900">
          {/* Left Sidebar untuk pengguna terautentikasi (Dibalut Suspense untuk useSearchParams) */}
          <Suspense fallback={<aside className="w-72 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 hidden lg:block z-30" />}>
            <Sidebar user={user} profile={profile} urgentQueueCount={urgentQueueCount} />
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

  // 4. JIKA SEBAGAI TAMU DI HALAMAN PUBLIK (Landing page, Katalog Kursus, dsb.):
  // Tampilkan Top Navbar, Konten Publik, dan Footer
  return (
    <html lang="id" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-[#ffdf0f] selection:text-slate-900">
        <Navbar user={user} profile={profile} />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
