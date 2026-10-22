'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logo from './Logo';
import { logoutAction } from '@/app/auth/actions';
import {
  Home,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  CreditCard,
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
  X
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const [mobileOpen, setMobileOpen] = useState(false);

  const isPeserta = profile?.peran === 'peserta';
  const isInstruktur = profile?.peran === 'instruktur';
  const isAdmin = profile?.peran === 'admin';
  const portalHome = isAdmin ? '/admin/dashboard' : isInstruktur ? '/instruktur' : isPeserta ? '/kursus-saya' : '/';

  // =========================================================================
  // STRUKTUR MENU DITATA SPESIFIK & RAPI BERDASARKAN FITUR RIIL SETIAP PERAN
  // =========================================================================
  let navSections: NavSection[] = [];

  if (isAdmin) {
    // 1. MENU KHUSUS ADMINISTRATOR
    navSections = [
      {
        title: 'Manajemen Administrator',
        items: [
          {
            label: 'Dashboard Statistik',
            href: '/admin/dashboard',
            icon: BarChart3,
            badge: 'Analitik',
            badgeColor: 'bg-purple-50 text-[#843bab] border-purple-200'
          },
          {
            label: 'Tinjauan Kursus',
            href: '/admin?tab=kursus',
            icon: CheckSquare
          },
          {
            label: 'Pendaftaran & Pembayaran',
            href: '/admin?tab=pendaftaran',
            icon: CreditCard
          },
          {
            label: 'Kelola Pengguna & Peran',
            href: '/admin?tab=pengguna',
            icon: Users
          },
          {
            label: 'Audit Log Sistem',
            href: '/admin?tab=audit',
            icon: FileText
          },
          {
            label: 'Buku Nilai (Semua Kursus)',
            href: '/instruktur/nilai',
            icon: ClipboardCheck
          },
        ],
      },
      {
        title: 'Katalog & Informasi',
        items: [
          { label: 'Katalog Kursus', href: '/kursus', icon: BookOpen },
          { label: 'Verifikasi Sertifikat', href: '/sertifikat/cek', icon: ShieldCheck },
        ],
      },
    ];
  } else if (isInstruktur) {
    // 2. MENU KHUSUS INSTRUKTUR
    navSections = [
      {
        title: 'Studio Instruktur',
        items: [
          {
            label: 'Kelola Kursus & Silabus',
            href: '/instruktur',
            icon: FileEdit,
            badge: 'Kursus',
            badgeColor: 'bg-[#843bab]/10 text-[#843bab] border-[#843bab]/20'
          },
          {
            label: 'Buat Kursus Baru',
            href: '/instruktur/kursus/baru',
            icon: PlusCircle
          },
          {
            label: 'Peserta & Nilai Kuis',
            href: '/instruktur/nilai',
            icon: ClipboardCheck,
            badge: 'Nilai',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
          },
        ],
      },
      {
        title: 'Katalog & Informasi',
        items: [
          { label: 'Katalog Kursus', href: '/kursus', icon: BookOpen },
          { label: 'Verifikasi Sertifikat', href: '/sertifikat/cek', icon: ShieldCheck },
        ],
      },
    ];
  } else if (isPeserta) {
    // 3. MENU KHUSUS PESERTA
    navSections = [
      {
        title: 'Pembelajaran Saya',
        items: [
          {
            label: 'Kursus Saya',
            href: '/kursus-saya',
            icon: GraduationCap,
            badge: 'Aktif',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
          },
        ],
      },
      {
        title: 'Katalog & Informasi',
        items: [
          { label: 'Katalog Kursus', href: '/kursus', icon: BookOpen },
          { label: 'Verifikasi Sertifikat', href: '/sertifikat/cek', icon: ShieldCheck },
        ],
      },
    ];
  } else {
    // 4. PENGUNJUNG TAMU (Belum Login)
    navSections = [
      {
        title: 'Menu Utama Publik',
        items: [
          { label: 'Katalog Kursus', href: '/kursus', icon: BookOpen },
          { label: 'Verifikasi Sertifikat', href: '/sertifikat/cek', icon: ShieldCheck },
          { label: 'Beranda Utama', href: '/', icon: Home },
        ],
      },
    ];
  }

  // =========================================================================
  // LOGIKA AKTIF TUNGGAL (STRICT SINGLE ACTIVE STATE - TANPA OVERLAP)
  // Memastikan HANYA 1 tombol menu yang berwarna ungu / aktif pada satu waktu
  // =========================================================================
  const isLinkActive = (href: string) => {
    // 1. Beranda Utama (tepat '/')
    if (href === '/') {
      return pathname === '/';
    }

    // 2. Sub-tab Admin di halaman /admin (kursus, pendaftaran, pengguna, audit)
    if (href.startsWith('/admin?tab=')) {
      if (pathname !== '/admin') return false;
      const targetTab = href.split('?tab=')[1];
      if (targetTab === 'kursus') {
        return !currentTab || currentTab === 'kursus';
      }
      return currentTab === targetTab;
    }

    // 3. Dashboard Statistik Admin (/admin/dashboard)
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }

    // 4. Instruktur - Kelola Kursus & Silabus (/instruktur dan editor /instruktur/kursus/[id])
    if (href === '/instruktur') {
      if (pathname === '/instruktur') return true;
      // Aktif saat di halaman edit modul/kursus, tapi BUKAN saat di form /instruktur/kursus/baru
      return pathname.startsWith('/instruktur/kursus/') && pathname !== '/instruktur/kursus/baru';
    }

    // 5. Instruktur - Form Buat Kursus Baru (/instruktur/kursus/baru)
    if (href === '/instruktur/kursus/baru') {
      return pathname === '/instruktur/kursus/baru';
    }

    // 6. Peserta & Buku Nilai (/instruktur/nilai)
    if (href === '/instruktur/nilai') {
      return pathname === '/instruktur/nilai' || pathname.startsWith('/instruktur/nilai/');
    }

    // 7. Kursus Saya & Ruang Belajar (/kursus-saya dan /belajar/[id])
    if (href === '/kursus-saya') {
      return pathname === '/kursus-saya' || pathname.startsWith('/belajar');
    }

    // 8. Katalog Kursus (/kursus) - Ketat: TIDAK BOLEH mencocokkan /kursus-saya!
    if (href === '/kursus') {
      return pathname === '/kursus' || pathname.startsWith('/kursus/');
    }

    // 9. Verifikasi Sertifikat (/sertifikat/cek)
    if (href === '/sertifikat/cek') {
      return pathname.startsWith('/sertifikat');
    }

    return pathname === href;
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Logo Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <Logo size="sm" href={portalHome} />
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

      {/* Role Badge Banner */}
      {user && profile && (
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isAdmin
                  ? 'bg-[#843bab]'
                  : isInstruktur
                  ? 'bg-[#843bab]'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-[11px] font-bold text-slate-600">
              {isAdmin
                ? 'Hak Akses Admin'
                : isInstruktur
                ? 'Hak Akses Instruktur'
                : 'Hak Akses Peserta'}
            </span>
          </div>

          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
              isAdmin
                ? 'bg-purple-50 text-[#843bab] border-purple-200'
                : isInstruktur
                ? 'bg-purple-50 text-[#843bab] border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {profile.peran}
          </span>
        </div>
      )}

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


      {/* User Session Footer (Profile Capsule & Logout) */}
      <div className="p-3 border-t border-slate-200 bg-white">
        {user && profile ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs ${
                  isAdmin
                    ? 'bg-[#843bab]'
                    : isInstruktur
                    ? 'bg-[#843bab]'
                    : 'bg-emerald-600'
                }`}
              >
                {profile.nama_lengkap.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {profile.nama_lengkap}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-colors min-h-[36px] cursor-pointer"
              >
                <LogOut size={13} />
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
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 hidden lg:block z-30">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE TOP BAR WITH SIDEBAR HAMBURGER */}
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
          <Logo size="sm" href={portalHome} showText={true} />
        </div>

        {user && profile ? (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
              isAdmin
                ? 'bg-purple-50 text-[#843bab] border-purple-200'
                : isInstruktur
                ? 'bg-purple-50 text-[#843bab] border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {profile.peran}
          </span>
        ) : (
          <Link
            href="/login"
            className="text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] px-3.5 py-1.5 rounded-lg shadow-xs"
          >
            Masuk
          </Link>
        )}
      </div>

      {/* 3. MOBILE OFF-CANVAS SLIDE-OVER SIDEBAR DRAWER */}
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
