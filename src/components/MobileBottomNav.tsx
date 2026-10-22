'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, GraduationCap, LayoutDashboard, UserCircle, LogIn, Award } from 'lucide-react';

interface Props {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: {
    nama_lengkap: string;
    peran: 'peserta' | 'instruktur' | 'admin';
  } | null;
}

export default function MobileBottomNav({ user, profile }: Props) {
  const pathname = usePathname();

  const isPeserta = profile?.peran === 'peserta';
  const isInstruktur = profile?.peran === 'instruktur';
  const isAdmin = profile?.peran === 'admin';

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/kursus') {
      return pathname === '/kursus' || pathname.startsWith('/kursus/');
    }
    if (path === '/kursus-saya') {
      return pathname === '/kursus-saya' || pathname.startsWith('/belajar');
    }
    if (path === '/admin') {
      return pathname.startsWith('/admin');
    }
    if (path === '/instruktur') {
      return pathname.startsWith('/instruktur');
    }
    if (path === '/sertifikat/cek') {
      return pathname.startsWith('/sertifikat');
    }
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
        {/* Tab 1: Katalog Kursus */}
        <Link
          href="/kursus"
          className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
            isActive('/kursus')
              ? 'text-[#843bab] font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={20} className={isActive('/kursus') ? 'stroke-[2.5]' : ''} />
          <span className="text-[11px] mt-1">Katalog</span>
        </Link>

        {/* Tab 2: Kursus Saya / Ruang Belajar */}
        <Link
          href={user ? '/kursus-saya' : '/login'}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
            user && isActive('/kursus-saya')
              ? 'text-[#843bab] font-semibold'
              : !user && pathname === '/login'
              ? 'text-[#843bab] font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap
            size={20}
            className={(user && isActive('/kursus-saya')) || (!user && pathname === '/login') ? 'stroke-[2.5]' : ''}
          />
          <span className="text-[11px] mt-1">{user ? 'Belajar' : 'Masuk'}</span>
        </Link>

        {/* Tab 3: Fitur Utama Sesuai Peran */}
        {isAdmin ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/admin') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={20} className={isActive('/admin') ? 'stroke-[2.5]' : ''} />
            <span className="text-[11px] mt-1">Admin</span>
          </Link>
        ) : isInstruktur ? (
          <Link
            href="/instruktur"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/instruktur') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={20} className={isActive('/instruktur') ? 'stroke-[2.5]' : ''} />
            <span className="text-[11px] mt-1">Instruktur</span>
          </Link>
        ) : (
          <Link
            href="/sertifikat/cek"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/sertifikat/cek') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award size={20} className={isActive('/sertifikat/cek') ? 'stroke-[2.5]' : ''} />
            <span className="text-[11px] mt-1">Sertifikat</span>
          </Link>
        )}

        {/* Tab 4: Beranda */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
            pathname === '/' ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCircle size={20} className={pathname === '/' ? 'stroke-[2.5]' : ''} />
          <span className="text-[11px] mt-1">Beranda</span>
        </Link>
      </div>
    </nav>
  );
}
