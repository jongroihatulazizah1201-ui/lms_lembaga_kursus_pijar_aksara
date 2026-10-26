'use client';

import React from 'react';

const BASE_ITEMS = [
  'Kurikulum Standar Industri',
  'Praktik Langsung Siap Kerja',
  'Program Pelatihan Unggulan',
  'Sertifikat Nomor Registrasi',
  'Materi Bertahap Aplikatif',
];

// Replikasi agar panjang 1 set mencukupi seluruh lebar layar monitor besar
const SET_ITEMS = [...BASE_ITEMS, ...BASE_ITEMS, ...BASE_ITEMS, ...BASE_ITEMS];

export default function MarqueeBanner() {
  return (
    <div
      className="marquee-container py-3 border-y border-slate-100 select-none bg-slate-50/40"
      role="region"
      aria-label="Keunggulan Program Lembaga Kursus Pijar Aksara"
    >
      <div className="marquee-track flex items-center gap-0">
        {/* Set 1: Konten Utama (Berjalan dari 0% ke -50%) */}
        <div className="flex items-center shrink-0">
          {SET_ITEMS.map((text, index) => (
            <div key={`set1-${index}`} className="flex items-center shrink-0">
              <span className="text-xs sm:text-[13px] font-semibold text-slate-700 hover:text-[#843bab] transition-colors whitespace-nowrap tracking-wide">
                {text}
              </span>
              <span className="text-[#843bab] text-xs sm:text-sm font-bold px-4 sm:px-6 select-none opacity-60">
                •
              </span>
            </div>
          ))}
        </div>

        {/* Set 2: Duplikat Persis untuk Perulangan Mulus */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {SET_ITEMS.map((text, index) => (
            <div key={`set2-${index}`} className="flex items-center shrink-0">
              <span className="text-xs sm:text-[13px] font-semibold text-slate-700 hover:text-[#843bab] transition-colors whitespace-nowrap tracking-wide">
                {text}
              </span>
              <span className="text-[#843bab] text-xs sm:text-sm font-bold px-4 sm:px-6 select-none opacity-60">
                •
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
