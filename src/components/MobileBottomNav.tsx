'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  LogIn,
  UserPlus,
  GraduationCap,
  LayoutDashboard,
  UserCircle,
} from 'lucide-react';

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
  const [activeProfile, setActiveProfile] = useState(profile);

  useEffect(() => {
    setActiveProfile(profile);
  }, [profile]);

  useEffect(() => {
    const handleProfileUpdated = (
      e: CustomEvent<{
        nama_lengkap?: string;
        no_hp?: string;
        avatar_url?: string | null;
      }>
    ) => {
      if (e.detail) {
        setActiveProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(e.detail.nama_lengkap ? { nama_lengkap: e.detail.nama_lengkap } : {}),
          };
        });
      }
    };

    window.addEventListener('lms:profile-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('lms:profile-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  const isInstruktur = activeProfile?.peran === 'instruktur';
  const isAdmin = activeProfile?.peran === 'admin';

  // Helper untuk cek status tab aktif
  const isHomeActive = pathname === '/';
  const isKatalogActive = pathname === '/kursus' || (pathname.startsWith('/kursus/') && !pathname.startsWith('/kursus-saya'));
  const isMasukActive = pathname === '/login';
  const isDaftarActive = pathname === '/register' || pathname === '/daftar';

  const isBelajarActive = pathname.startsWith('/kursus-saya') || pathname.startsWith('/belajar');
  const isAdminActive = pathname.startsWith('/admin');
  const isInstrukturActive = pathname.startsWith('/instruktur');
  const isProfilActive = pathname.startsWith('/profil');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
        {/* ===================================================================
            KONDISI 1: PENGGUNA BELUM MASUK (Tamu / Publik)
            Sesuai permintaan: 4 tab tetap -> Home, Katalog, Masuk, Daftar
           =================================================================== */}
        {!user ? (
          <>
            {/* Tab 1: Home */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isHomeActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isHomeActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <Home size={20} className={isHomeActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Home</span>
            </Link>

            {/* Tab 2: Katalog */}
            <Link
              href="/kursus"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isKatalogActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isKatalogActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <BookOpen size={20} className={isKatalogActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Katalog</span>
            </Link>

            {/* Tab 3: Masuk */}
            <Link
              href="/login"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isMasukActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isMasukActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <LogIn size={20} className={isMasukActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Masuk</span>
            </Link>

            {/* Tab 4: Daftar */}
            <Link
              href="/register"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isDaftarActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isDaftarActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <UserPlus size={20} className={isDaftarActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Daftar</span>
            </Link>
          </>
        ) : (
          /* ===================================================================
              KONDISI 2: PENGGUNA SUDAH MASUK (Peserta / Instruktur / Admin)
              Tetap 4 tab: Home, Katalog, Ruang Kerja/Belajar, Profil
             =================================================================== */
          <>
            {/* Tab 1: Home */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isHomeActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isHomeActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <Home size={20} className={isHomeActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Home</span>
            </Link>

            {/* Tab 2: Katalog */}
            <Link
              href="/kursus"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isKatalogActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isKatalogActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <BookOpen size={20} className={isKatalogActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1">Katalog</span>
            </Link>

            {/* Tab 3: Belajar / Instruktur / Admin */}
            {isAdmin ? (
              <Link
                href="/admin"
                className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                  isAdminActive
                    ? 'text-[#843bab] font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                {isAdminActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
                )}
                <LayoutDashboard size={20} className={isAdminActive ? 'stroke-[2.5]' : ''} />
                <span className="text-[11px] mt-1">Admin</span>
              </Link>
            ) : isInstruktur ? (
              <Link
                href="/instruktur"
                className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                  isInstrukturActive
                    ? 'text-[#843bab] font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                {isInstrukturActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
                )}
                <LayoutDashboard size={20} className={isInstrukturActive ? 'stroke-[2.5]' : ''} />
                <span className="text-[11px] mt-1">Instruktur</span>
              </Link>
            ) : (
              <Link
                href="/kursus-saya"
                className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                  isBelajarActive
                    ? 'text-[#843bab] font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                {isBelajarActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
                )}
                <GraduationCap size={20} className={isBelajarActive ? 'stroke-[2.5]' : ''} />
                <span className="text-[11px] mt-1">Belajar</span>
              </Link>
            )}

            {/* Tab 4: Profil */}
            <Link
              href="/profil"
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isProfilActive
                  ? 'text-[#843bab] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {isProfilActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#843bab] rounded-full" />
              )}
              <UserCircle size={20} className={isProfilActive ? 'stroke-[2.5]' : ''} />
              <span className="text-[11px] mt-1 truncate max-w-[64px]">Profil</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
