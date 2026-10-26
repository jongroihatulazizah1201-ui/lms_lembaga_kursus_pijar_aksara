import Link from 'next/link';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import UserNav from './UserNav';
import MobileBottomNav from './MobileBottomNav';
import Logo from './Logo';

import ProgramDropdown from './ProgramDropdown';

export default async function Navbar() {
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

  return (
    <>
      {/* =========================================================================
          1. DESKTOP STICKY HEADER (hidden md:block)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 hidden md:block shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Brand Sisi Kiri */}
          <Logo size="md" />

          {/* Sisi Kanan: Home, Pilihan Program, Pembatas & Tombol Masuk/Daftar */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              <ProgramDropdown />
              <Link
                href="/sertifikat/cek"
                className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-[#843bab] hover:bg-purple-50/60 transition-all cursor-pointer"
              >
                Cek Sertifikat
              </Link>
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-[#843bab] hover:bg-purple-50/60 transition-all cursor-pointer"
              >
                Home
              </Link>
            </nav>

            {/* Separator Vertikal Halus */}
            <div className="h-6 w-px bg-slate-200 mx-1" />

            {user && profile ? (
              <UserNav user={user} profile={profile} />
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <LogIn size={16} />
                  <span>Masuk</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <UserPlus size={16} />
                  <span>Daftar Akun</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MOBILE TOP BAR (md:hidden) - Bersih, rapi, dan proporsional untuk HP
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 block md:hidden px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          {/* Logo Sisi Kiri */}
          <Logo size="sm" />

          {/* Sisi Kanan: Tombol Aksi Bersih (Tanpa Teks Berdesakan) */}
          <div className="flex items-center gap-2">
            {user && profile ? (
              <UserNav user={user} profile={profile} />
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-xs transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. MOBILE FIXED BOTTOM NAVIGATION BAR (md:hidden)
         ========================================================================= */}
      <MobileBottomNav user={user} profile={profile} />
    </>
  );
}
