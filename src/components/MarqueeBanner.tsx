'use client';

import React from 'react';
import { Award, Briefcase, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

interface MarqueeItem {
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const BASE_ITEMS: MarqueeItem[] = [
  { text: 'Kurikulum Standar Industri', icon: CheckCircle2 },
  { text: 'Praktik Langsung Siap Kerja', icon: Briefcase },
  { text: 'Program Pelatihan Unggulan', icon: Sparkles },
  { text: 'Sertifikat Nomor Registrasi', icon: Award },
  { text: 'Materi Bertahap Aplikatif', icon: BookOpen },
];

// Replikasi array dasar agar panjang 1 set mencukupi seluruh lebar layar (hingga monitor 4K)
const SET_ITEMS = [...BASE_ITEMS, ...BASE_ITEMS, ...BASE_ITEMS];

export default function MarqueeBanner() {
  return (
    <div
      className="marquee-container py-1.5 select-none"
      role="region"
      aria-label="Keunggulan Program Lembaga Kursus Pijar Aksara"
    >
      <div className="marquee-track flex items-center py-1 gap-0">
        {/* Set 1: Konten Asli (Berjalan dari 0% ke -50%) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4">
          {SET_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`set1-${index}`}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80 hover:from-purple-100 hover:to-purple-50 border border-[#843bab]/25 hover:border-[#843bab] text-slate-800 transition-all shadow-2xs hover:shadow-xs group cursor-default shrink-0"
              >
                <span className="w-5 h-5 rounded-full bg-[#843bab]/10 group-hover:bg-[#843bab] text-[#843bab] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Icon size={12} className="stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13px] font-extrabold tracking-tight text-slate-800 whitespace-nowrap">
                  {item.text}
                </span>
                <span className="text-[#843bab]/40 text-xs pl-1 select-none font-black">✦</span>
              </div>
            );
          })}
        </div>

        {/* Set 2: Duplikat Persis untuk Loop Mulus Berkesinambungan */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4" aria-hidden="true">
          {SET_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`set2-${index}`}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80 hover:from-purple-100 hover:to-purple-50 border border-[#843bab]/25 hover:border-[#843bab] text-slate-800 transition-all shadow-2xs hover:shadow-xs group cursor-default shrink-0"
              >
                <span className="w-5 h-5 rounded-full bg-[#843bab]/10 group-hover:bg-[#843bab] text-[#843bab] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Icon size={12} className="stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13px] font-extrabold tracking-tight text-slate-800 whitespace-nowrap">
                  {item.text}
                </span>
                <span className="text-[#843bab]/40 text-xs pl-1 select-none font-black">✦</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
