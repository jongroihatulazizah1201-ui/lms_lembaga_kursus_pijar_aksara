'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, Users, Lock, ArrowRight } from 'lucide-react';
import { CourseData, formatRupiah } from './CourseCard';
import CourseIllustration from './CourseIllustration';
import MarqueeBanner from './MarqueeBanner';

interface Props {
  courses: CourseData[];
}

export default function PopularCoursesCarousel({ courses }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (current) current.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [courses]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Carousel: Judul Sesuai Permintaan & Kontrol Panah Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Kelas Kursus dan Pelatihan <span className="text-[#843bab]">Pijar Aksara</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1.5 font-medium leading-relaxed">
            Kembangkan kemampuan dengan beragam kursus pilihan
          </p>
        </div>

        {/* Action Bar: Link Katalog & Tombol Panah Geser */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/kursus"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:text-[#6a2f8a] hover:underline"
          >
            <span>Lihat Semua ({courses.length})</span>
            <ArrowRight size={14} />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
              }`}
              aria-label="Geser ke kiri"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
              }`}
              aria-label="Geser ke kanan"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Marquee Auto-Scrolling Strip di Bagian Atas Pamflet Kursus */}
      <div className="py-0.5">
        <MarqueeBanner />
      </div>

      {/* Horizontal Scroll Track Pamflet Kursus */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {courses.map((course) => {
          const isFree = course.harga === 0;
          const isFull = course.sisa_kursi <= 0;
          const isLastSeat = course.sisa_kursi === 1;

          return (
            <article
              key={course.id}
              className="w-[290px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 hover:border-[#843bab]/40 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Konten Utama Kartu */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                {/* Banner Ilustrasi Top */}
                <Link
                  href={`/kursus/${course.slug}`}
                  className="block overflow-hidden rounded-xl bg-slate-50 border border-slate-100 hover:opacity-95 transition-all group-hover:scale-[1.01]"
                >
                  <CourseIllustration slug={course.slug} title={course.judul} imageUrl={course.gambar_url} className="h-32 sm:h-36" />
                </Link>

                {/* Badge Kategori & Jumlah Modul */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#843bab] bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-md">
                    {course.kategori}
                  </span>
                  <div className="flex items-center gap-2">
                    {isFree && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Gratis
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500">
                      {course.jumlah_modul || 5} Modul
                    </span>
                  </div>
                </div>

                {/* Judul Kursus */}
                <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#843bab] transition-colors line-clamp-2">
                  <Link href={`/kursus/${course.slug}`} className="hover:underline">
                    {course.judul}
                  </Link>
                </h3>

                {/* Ringkasan */}
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 flex-1">
                  {course.ringkasan}
                </p>

                {/* Instruktur & Kapasitas Kursi */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 truncate text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User size={12} className="text-[#843bab]" />
                    </div>
                    <span className="truncate font-medium text-slate-800">
                      {course.instruktur_nama}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="text-slate-500">Kapasitas:</span>
                    {isFull ? (
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <Lock size={11} />
                        Penuh
                      </span>
                    ) : isLastSeat ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[#843bab] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Users size={11} />
                        Sisa 1 Kursi!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Users size={11} />
                        Sisa {course.sisa_kursi} dari {course.kuota}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Kartu (Biaya & Tombol CTA Kuning Resmi) */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Biaya Kursus
                  </div>
                  <div className={`text-base font-black tracking-tight ${isFree ? 'text-[#843bab]' : 'text-slate-900'}`}>
                    {formatRupiah(course.harga)}
                  </div>
                </div>

                {isFull ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed min-h-[38px]"
                  >
                    Penuh
                  </button>
                ) : (
                  <Link
                    href={`/kursus/${course.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all min-h-[38px]"
                  >
                    <span>Daftar</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Banner Promosi / Arahkan ke Katalog Lengkap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-900">
            Ingin mencari materi atau jadwal pelatihan spesifik?
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Jelajahi seluruh daftar kursus terbit dengan filter biaya dan kategori lengkap di halaman katalog.
          </p>
        </div>
        <Link
          href="/kursus"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm shrink-0 transition-all hover:-translate-y-0.5"
        >
          <span>Buka Katalog Lengkap</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
