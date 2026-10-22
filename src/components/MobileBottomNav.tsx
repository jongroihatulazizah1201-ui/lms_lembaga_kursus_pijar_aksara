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
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
        {/* Tab 1: Beranda / Katalog */}
        <Link
          href="/kursus"
          className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
            isActive('/kursus') || pathname === '/'
              ? 'text-[#843bab] font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={20} className={isActive('/kursus') || pathname === '/' ? 'stroke-[2.5]' : ''} />
          <span className="text-[11px] mt-1">Katalog</span>
        </Link>

        {/* Tab 2: Kursus Saya / Belajar */}
        <Link
          href={user ? '/kursus-saya' : '/login'}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
            isActive('/kursus-saya') || isActive('/belajar')
              ? 'text-[#843bab] font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap size={20} className={isActive('/kursus-saya') || isActive('/belajar') ? 'stroke-[2.5]' : ''} />
          <span className="text-[11px] mt-1">{user ? 'Belajar' : 'Masuk'}</span>
        </Link>

        {/* Tab 3: Workspace Khusus Peran */}
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
            href={user ? '/kursus-saya' : '/register'}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/register') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award size={20} className={isActive('/register') || isActive('/kursus-saya') ? 'stroke-[2.5]' : ''} />
            <span className="text-[11px] mt-1">{user ? 'Progres' : 'Daftar'}</span>
          </Link>
        )}

        {/* Tab 4: Profil / Akun */}
        {user ? (
          <Link
            href={isAdmin ? '/admin' : isInstruktur ? '/instruktur' : '/kursus-saya'}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/profil') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCircle size={20} />
            <span className="text-[11px] mt-1 truncate max-w-[64px]">
              {profile?.nama_lengkap?.split(' ')[0] || 'Akun'}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive('/login') ? 'text-[#843bab] font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn size={20} />
            <span className="text-[11px] mt-1">Masuk</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
