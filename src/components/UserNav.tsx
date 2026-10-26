'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LogoutConfirmModal from './LogoutConfirmModal';
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
    avatar_url?: string | null;
  };
}

export default function UserNav({ user, profile }: Props) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeProfile, setActiveProfile] = useState(profile);

  React.useEffect(() => {
    setActiveProfile(profile);
  }, [profile]);

  React.useEffect(() => {
    const handleProfileUpdated = (
      e: CustomEvent<{
        nama_lengkap?: string;
        no_hp?: string;
        avatar_url?: string | null;
      }>
    ) => {
      if (e.detail) {
        setActiveProfile((prev) => ({
          ...prev,
          ...(e.detail.nama_lengkap ? { nama_lengkap: e.detail.nama_lengkap } : {}),
          ...(e.detail.avatar_url !== undefined ? { avatar_url: e.detail.avatar_url } : {}),
        }));
      }
    };

    window.addEventListener('lms:profile-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('lms:profile-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  const isPeserta = activeProfile.peran === 'peserta';
  const isInstruktur = activeProfile.peran === 'instruktur';
  const isAdmin = activeProfile.peran === 'admin';

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
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-slate-700 hover:text-[#843bab] transition-colors"
            >
              <LayoutDashboard size={16} className="text-[#843bab]" />
              <span>Dashboard Siswa</span>
            </Link>
            <Link
              href="/kursus-saya"
              className="flex items-center gap-1.5 text-slate-700 hover:text-[#843bab] transition-colors"
            >
              <Award size={16} className="text-[#843bab]" />
              <span>Kursus Saya</span>
            </Link>
          </>
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
      <Link
        href="/profil"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-sm transition-colors cursor-pointer"
        title="Lihat & Kelola Profil Saya"
      >
        {activeProfile.avatar_url ? (
          <img
            src={activeProfile.avatar_url}
            alt={activeProfile.nama_lengkap}
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#843bab] text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
            {activeProfile.nama_lengkap.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
          {activeProfile.nama_lengkap}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${roleBadgeClass}`}>
          {activeProfile.peran}
        </span>
      </Link>

      {/* Logout Action */}
      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        className="p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
        title="Keluar dari akun"
        aria-label="Keluar dari akun"
      >
        <LogOut size={16} />
      </button>

      {/* Confirmation Modal when logging out */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        userName={activeProfile.nama_lengkap}
      />
    </div>
  );
}
