import React from 'react';
import Link from 'next/link';
import { User, Users, BookOpen, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import CourseIllustration from './CourseIllustration';

export interface CourseData {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  ringkasan: string;
  harga: number;
  kuota: number;
  sisa_kursi: number;
  kursi_terpakai: number;
  instruktur_nama: string;
  jumlah_modul?: number;
  gambar_url?: string | null;
}

export function formatRupiah(amount: number): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CourseCard({ course }: { course: CourseData }) {
  const isFree = course.harga === 0;
  const isFull = course.sisa_kursi <= 0;
  const isLastSeat = course.sisa_kursi === 1;

  return (
    <article
      id={`kursus-${course.slug}`}
      className="bg-white rounded-2xl border border-slate-200 hover:border-[#843bab]/40 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group h-full"
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Banner Media Brosur / Ilustrasi Top */}
        <Link
          href={`/kursus/${course.slug}`}
          className="block overflow-hidden rounded-xl bg-slate-50 border border-slate-100 hover:opacity-95 transition-all group-hover:scale-[1.01]"
        >
          <CourseIllustration slug={course.slug} title={course.judul} imageUrl={course.gambar_url} />
        </Link>

        {/* Top Badges (Category, Free Label, Seats) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] border border-[#843bab]/20">
            {course.kategori}
          </span>

          {isFree ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#843bab] border border-purple-200">
              <CheckCircle2 size={12} className="text-[#843bab]" />
              Gratis
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Berbayar
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#843bab] transition-colors line-clamp-2">
          <Link href={`/kursus/${course.slug}`} className="hover:underline">
            {course.judul}
          </Link>
        </h3>

        {/* Ringkasan */}
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
          {course.ringkasan}
        </p>

        {/* Info Instruktur & Sisa Kursi (BR-06) */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          {/* Nama Instruktur */}
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2 truncate max-w-[200px]">
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User size={12} className="text-[#843bab]" />
              </div>
              <span className="truncate font-medium text-slate-800">
                {course.instruktur_nama}
              </span>
            </div>
            {course.jumlah_modul !== undefined && (
              <span className="text-slate-500 text-[11px] shrink-0">
                {course.jumlah_modul} Modul
              </span>
            )}
          </div>

          {/* Sisa Kursi Indicator */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-500">Kapasitas Kelas:</span>
            {isFull ? (
              <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                <Lock size={11} />
                Kuota Penuh
              </span>
            ) : isLastSeat ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                <Users size={11} />
                Sisa 1 Kursi Terakhir!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <Users size={11} />
                Sisa {course.sisa_kursi} dari {course.kuota} Kursi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer (Harga & CTA) */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Biaya Pendaftaran
          </div>
          <div className={`text-base sm:text-lg font-black tracking-tight ${isFree ? 'text-[#843bab]' : 'text-slate-900'}`}>
            {formatRupiah(course.harga)}
          </div>
        </div>

        {isFull ? (
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed min-h-[40px]"
          >
            Penuh
          </button>
        ) : (
          <Link
            href={`/kursus/${course.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all min-h-[40px]"
          >
            <span>Daftar Kursus</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}
