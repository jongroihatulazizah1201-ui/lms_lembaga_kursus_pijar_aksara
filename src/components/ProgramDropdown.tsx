'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  BookOpen,
  Briefcase,
  Palette,
  Languages,
  Calculator,
  Mic,
  ArrowRight
} from 'lucide-react';

export default function ProgramDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sinkron 100% dengan data kategori kursus di database Supabase:
  // 1. Perkantoran (Excel untuk Administrasi Perkantoran, Microsoft Word untuk Surat Dinas)
  // 2. Desain (Desain Konten Media Sosial dengan Canva, Fotografi Produk dengan Ponsel)
  // 3. Bahasa (Bahasa Inggris untuk Percakapan Kerja)
  // 4. Keuangan (Dasar Pembukuan untuk UMKM)
  // 5. Pengembangan Diri (Public Speaking untuk Presentasi Kantor)
  const programs = [
    {
      title: 'Perkantoran',
      desc: 'Excel Administrasi Perkantoran & Word Surat Dinas',
      href: '/kursus?kategori=Perkantoran',
      icon: Briefcase,
    },
    {
      title: 'Desain',
      desc: 'Desain Konten Canva & Fotografi Produk Ponsel',
      href: '/kursus?kategori=Desain',
      icon: Palette,
    },
    {
      title: 'Bahasa',
      desc: 'Bahasa Inggris untuk Percakapan & Komunikasi Kerja',
      href: '/kursus?kategori=Bahasa',
      icon: Languages,
    },
    {
      title: 'Keuangan',
      desc: 'Dasar Pembukuan Kas Masuk-Keluar & Laba Rugi UMKM',
      href: '/kursus?kategori=Keuangan',
      icon: Calculator,
    },
    {
      title: 'Pengembangan Diri',
      desc: 'Public Speaking & Percaya Diri Presentasi Kantor',
      href: '/kursus?kategori=Pengembangan%20Diri',
      icon: Mic,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Pilihan Kursus / Program di Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-[#843bab] hover:bg-purple-50/60 transition-all cursor-pointer"
        aria-expanded={isOpen}
      >
        <span>Kategori Program</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 text-slate-500 ${
            isOpen ? 'rotate-180 text-[#843bab]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Mengambang */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Kategori Program Pelatihan Resmi
            </span>
          </div>

          <div className="space-y-1">
            {programs.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0 group-hover:bg-[#843bab] group-hover:text-white transition-colors">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#843bab] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100">
            <Link
              href="/kursus"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-[#843bab] bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={15} />
                <span>Lihat Seluruh Katalog Kursus</span>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
