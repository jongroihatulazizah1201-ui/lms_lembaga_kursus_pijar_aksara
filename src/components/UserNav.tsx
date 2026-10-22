'use client';

import Link from 'next/link';
import { logoutAction } from '@/app/auth/actions';
import { LogOut, Award, Shield, LayoutDashboard, PenTool } from 'lucide-react';

interface Props {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    nama_lengkap: string;
    peran: 'peserta' | 'instruktur' | 'admin';
  };
}

export default function UserNav({ user, profile }: Props) {
  const isPeserta = profile.peran === 'peserta';
  const isInstruktur = profile.peran === 'instruktur';
  const isAdmin = profile.peran === 'admin';

  const roleBadgeClass = isAdmin
    ? 'bg-purple-50 text-[#843bab] border-purple-200'
    : isInstruktur
    ? 'bg-purple-50 text-[#843bab] border-purple-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="flex items-center gap-4">
      {/* Role specific links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-4 text-sm font-semibold">
        {isPeserta && (
          <Link
            href="/kursus-saya"
            className="flex items-center gap-1.5 text-slate-700 hover:text-[#843bab] transition-colors"
          >
            <Award size={16} className="text-[#843bab]" />
            <span>Kursus Saya</span>
          </Link>
        )}

        {isInstruktur && (
          <>
            <Link
              href="/instruktur"
              className="flex items-center gap-1.5 text-slate-700 hover:text-[#843bab] transition-colors"
            >
              <PenTool size={16} className="text-[#843bab]" />
              <span>Kelola Kursus</span>
            </Link>
            <Link
              href="/instruktur/nilai"
              className="text-slate-600 hover:text-[#843bab] transition-colors"
            >
              Peserta & Nilai
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-slate-700 hover:text-[#843bab] transition-colors"
            >
              <Shield size={16} className="text-[#843bab]" />
              <span>Panel Admin</span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#843bab] transition-colors"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/instruktur/nilai"
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#843bab] transition-colors"
            >
              <Award size={15} className="text-[#843bab]" />
              <span>Peserta & Nilai</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Info Capsule */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
        <div className="w-7 h-7 rounded-full bg-[#843bab] text-white flex items-center justify-center text-xs font-bold shadow-sm">
          {profile.nama_lengkap.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
          {profile.nama_lengkap}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${roleBadgeClass}`}>
          {profile.peran}
        </span>
      </div>

      {/* Logout Action */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all"
          title="Keluar dari akun"
        >
          <LogOut size={16} />
        </button>
      </form>
    </div>
  );
}
