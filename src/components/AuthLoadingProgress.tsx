'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  PenTool, 
  BookOpen, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface Props {
  peran?: 'admin' | 'instruktur' | 'peserta' | string;
  nama?: string;
  targetUrl: string;
  mode?: 'login' | 'register';
}

export default function AuthLoadingProgress({
  peran = 'peserta',
  nama = '',
  targetUrl,
  mode = 'login',
}: Props) {
  const [progress, setProgress] = useState(15);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const isAdmin = peran === 'admin';
  const isInstruktur = peran === 'instruktur';

  const roleMeta = isAdmin
    ? {
        title: 'Akses Administrator',
        subtitle: 'Membuka Dashboard Analitik & Statistik',
        icon: LayoutDashboard,
        badgeColor: 'bg-amber-400/20 text-[#ffdf0f] border-amber-400/30',
        workspaceName: 'Dashboard Statistik & Laporan',
      }
    : isInstruktur
    ? {
        title: 'Akses Instruktur Vokasi',
        subtitle: 'Membuka Kelola Kursus & Silabus',
        icon: PenTool,
        badgeColor: 'bg-purple-400/20 text-purple-200 border-purple-400/30',
        workspaceName: 'Panel Kursus Instruktur',
      }
    : {
        title: 'Akses Peserta Pelatihan',
        subtitle: 'Membuka Ruang Belajar & Kursus Saya',
        icon: BookOpen,
        badgeColor: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
        workspaceName: 'Katalog & Kursus Saya',
      };

  const steps = [
    {
      label: mode === 'register' ? 'Pendaftaran Akun Baru' : 'Verifikasi Kredensial Akun',
      detail: 'Otentikasi aman via enkripsi Supabase Auth',
    },
    {
      label: 'Sinkronisasi Hak Akses & Profil',
      detail: `Memvalidasi peran ${roleMeta.title}`,
    },
    {
      label: 'Mengarahkan ke Ruang Kerja',
      detail: `Membuka ${roleMeta.workspaceName}`,
    },
  ];

  useEffect(() => {
    // Tahap 1: Mulai verifikasi
    const t1 = setTimeout(() => {
      setProgress(45);
      setActiveStepIndex(1);
    }, 220);

    // Tahap 2: Siapkan workspace
    const t2 = setTimeout(() => {
      setProgress(85);
      setActiveStepIndex(2);
    }, 460);

    // Tahap 3: Penuh & eksekusi redirect
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 160);
    }, 680);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [targetUrl]);

  const RoleIcon = roleMeta.icon;

  return (
    <aside 
      aria-label="Proses Pengalihan Halaman"
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#1a0429] via-[#3d1156] to-[#140220] flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none overflow-hidden"
    >
      {/* Ornamen Latar Belakang Berpendar Halus */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#843bab]/30 blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#ffdf0f]/20 blur-3xl pointer-events-none" 
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
        {/* Simbol UI: Logo Resmi Pijar Aksara dengan Ring Bercahaya */}
        <div className="relative mb-5">
          <div 
            aria-hidden="true" 
            className="absolute -inset-2 bg-gradient-to-r from-[#ffdf0f] via-purple-400 to-[#ffdf0f] rounded-2xl opacity-60 blur-md animate-pulse" 
          />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 p-3 sm:p-4 flex items-center justify-center shadow-2xl">
            <Image
              src="/logo-pijar-aksara.png"
              alt="Logo Resmi Lembaga Kursus Pijar Aksara"
              width={56}
              height={56}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Brand Label */}
        <div className="text-xs font-black tracking-widest uppercase text-purple-200 mb-1">
          LMS Lembaga Kursus Pijar Aksara
        </div>

        {/* Greeting & Headline */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {mode === 'register' ? 'Pendaftaran Berhasil!' : 'Autentikasi Berhasil!'}
        </h1>
        {nama ? (
          <p className="text-sm text-purple-100/90 mt-1 max-w-xs truncate">
            Selamat datang, <span className="font-bold text-[#ffdf0f]">{nama}</span>
          </p>
        ) : null}

        {/* Simbol UI: Badge Peran & Workspace */}
        <div className={`mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${roleMeta.badgeColor}`}>
          <RoleIcon size={14} className="shrink-0" />
          <span>{roleMeta.title}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/90 font-medium">{roleMeta.workspaceName}</span>
        </div>

        {/* Progress Bar Dinamis & Shimmer */}
        <div className="w-full mt-6 bg-white/10 rounded-full h-3 p-0.5 border border-white/20 overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#ffdf0f] via-amber-300 to-[#ffdf0f] rounded-full transition-all duration-300 ease-out shadow-[0_0_16px_rgba(255,223,15,0.8)] relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer light sweep */}
            <div 
              aria-hidden="true" 
              className="absolute inset-0 bg-white/30 skew-x-12 animate-pulse" 
            />
          </div>
        </div>

        {/* Indikator Status & Persentase */}
        <div className="w-full mt-2.5 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-1.5 font-medium truncate pr-2">
            <Loader2 size={13} className="animate-spin text-[#ffdf0f] shrink-0" />
            <span className="truncate">{steps[activeStepIndex]?.label}</span>
          </div>
          <span className="font-mono font-bold text-[#ffdf0f] shrink-0">
            {progress}%
          </span>
        </div>

        {/* 3 Step Visual Checklist */}
        <div className="w-full mt-6 grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-left">
          {steps.map((step, idx) => {
            const isCompleted = activeStepIndex > idx || progress === 100;
            const isCurrent = activeStepIndex === idx && progress < 100;

            return (
              <div 
                key={idx} 
                className={`p-2 rounded-xl transition-all ${
                  isCurrent 
                    ? 'bg-white/15 border border-white/25 shadow-sm' 
                    : isCompleted 
                    ? 'bg-white/5 opacity-90' 
                    : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 size={13} className="text-[#ffdf0f] shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full border-2 border-[#ffdf0f] border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-white truncate">
                    {idx === 0 ? 'Otentikasi' : idx === 1 ? 'Hak Akses' : 'Dashboard'}
                  </span>
                </div>
                <div className="text-[9px] text-purple-200/80 line-clamp-1">
                  {idx === 0 ? 'Sukses' : idx === 1 ? roleMeta.title.replace('Akses ', '') : 'Membuka'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
