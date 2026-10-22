'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { logoutAction } from '@/app/auth/actions';
import {
  Home,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  CreditCard,
  Award,
  FileEdit,
  PlusCircle,
  ClipboardCheck,
  CheckSquare,
  Users,
  FileText,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: {
    nama_lengkap: string;
    peran: 'peserta' | 'instruktur' | 'admin';
  } | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  description?: string;
  items: NavItem[];
}

export default function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPeserta = profile?.peran === 'peserta';
  const isInstruktur = profile?.peran === 'instruktur';
  const isAdmin = profile?.peran === 'admin';

  // Struktur Menu Seluruh Fitur Platform LMS Pijar Aksara
  const navSections: NavSection[] = [
    {
      title: 'Fitur Utama Publik',
      items: [
        { label: 'Beranda', href: '/', icon: Home },
        { label: 'Katalog Kursus', href: '/kursus', icon: BookOpen },
        { label: 'Verifikasi Sertifikat', href: '/sertifikat/cek', icon: ShieldCheck },
      ],
    },
    {
      title: 'Area Peserta (Belajar)',
      items: [
        { label: 'Kursus Saya', href: '/kursus-saya', icon: GraduationCap, badge: isPeserta ? 'Aktif' : undefined, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { label: 'Status Pendaftaran', href: '/kursus-saya#pendaftaran', icon: CreditCard },
        { label: 'Sertifikat Kelulusan', href: '/kursus-saya#sertifikat', icon: Award },
      ],
    },
    {
      title: 'Studio Instruktur',
      items: [
        { label: 'Kelola Kursus & Silabus', href: '/instruktur', icon: FileEdit, badge: 'Instruktur', badgeColor: 'bg-[#843bab]/10 text-[#843bab] border-[#843bab]/20' },
        { label: 'Buat Kursus Baru', href: '/instruktur/kursus/baru', icon: PlusCircle },
        { label: 'Peserta & Nilai Kuis', href: '/instruktur/nilai', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Panel Administrator',
      items: [
        { label: 'Tinjauan Kursus (BR-02)', href: '/admin?tab=kursus', icon: CheckSquare, badge: 'Admin', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
        { label: 'Pendaftaran & Bayar', href: '/admin?tab=pendaftaran', icon: CreditCard },
        { label: 'Kelola Akun & Peran', href: '/admin?tab=pengguna', icon: Users },
        { label: 'Audit Log (BR-12)', href: '/admin?tab=audit', icon: FileText },
        { label: 'Statistik Lembaga', href: '/admin/dashboard', icon: BarChart3 },
      ],
    },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // Remove query params or hashes for matching
    const baseHref = href.split('?')[0].split('#')[0];
    if (baseHref === '/admin') {
      return pathname.startsWith('/admin') && (href === '/admin?tab=kursus' ? !pathname.includes('/dashboard') : true);
    }
    return pathname.startsWith(baseHref);
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <Logo size="sm" href="/" />
        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={closeMobile}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Tutup Menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Feature Navigation List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {/* Section Header */}
            <div className="px-3 pb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </span>
            </div>

            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const active = isLinkActive(item.href);

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group min-h-[42px] ${
                      active
                        ? 'bg-[#843bab]/10 text-[#843bab] font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          active
                            ? 'text-[#843bab] stroke-[2.2]'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${
                          item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Card / Auth Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        {user && profile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#843bab] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {profile.nama_lengkap.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {profile.nama_lengkap}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                      isAdmin
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isInstruktur
                        ? 'bg-purple-50 text-[#843bab] border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {profile.peran}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <form action={logoutAction} className="pt-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors min-h-[38px] cursor-pointer"
              >
                <LogOut size={14} />
                <span>Keluar dari Akun</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={closeMobile}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors min-h-[40px]"
            >
              <LogIn size={15} />
              <span>Masuk Akun</span>
            </Link>
            <Link
              href="/register"
              onClick={closeMobile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] rounded-xl shadow-xs transition-colors min-h-[40px]"
            >
              <UserPlus size={15} />
              <span>Daftar Akun Baru</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* =====================================================================
          1. DESKTOP PERMANENT LEFT SIDEBAR (lg:flex)
         ===================================================================== */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 hidden lg:block z-30">
        {sidebarContent}
      </aside>

      {/* =====================================================================
          2. MOBILE TOP BAR WITH SIDEBAR HAMBURGER (lg:hidden)
         ===================================================================== */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Buka Menu Fitur"
          >
            <Menu size={22} />
          </button>
          <Logo size="sm" href="/" showText={true} />
        </div>

        {user && profile ? (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                isAdmin
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isInstruktur
                  ? 'bg-purple-50 text-[#843bab] border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {profile.peran}
            </span>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] px-3.5 py-1.5 rounded-lg shadow-xs"
          >
            Masuk
          </Link>
        )}
      </div>

      {/* =====================================================================
          3. MOBILE OFF-CANVAS SLIDE-OVER SIDEBAR DRAWER (lg:hidden)
         ===================================================================== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
