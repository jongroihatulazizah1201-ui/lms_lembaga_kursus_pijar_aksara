'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRupiah } from './CourseCard';
import CourseIllustration from './CourseIllustration';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Award,
  BookOpen,
  Printer,
  CreditCard,
  User,
  Calendar,
} from 'lucide-react';

export interface EnrollmentCourseData {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  harga: number;
  instruktur_nama: string;
  total_modul: number;
}

export interface EnrollmentItem {
  id: string;
  status: string;
  nominal: number;
  metode_bayar: string;
  batas_bayar: string | null;
  didaftarkan_pada: string;
  mayar_invoice_id: string | null;
  kursus: EnrollmentCourseData;
  modul_lulus: number;
  sertifikat?: {
    id: string;
    nomor_sertifikat: string;
    diterbitkan_pada: string;
  } | null;
}

interface Props {
  enrollment: EnrollmentItem;
  onCancelRequest?: (id: string, courseTitle: string) => void;
}

export default function MyCourseCard({ enrollment, onCancelRequest }: Props) {
  const { kursus, status, nominal, batas_bayar, modul_lulus, id, didaftarkan_pada, sertifikat } = enrollment;
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Perhitungan progres kelulusan
  const totalModul = kursus.total_modul || 1;
  const progressPercent = Math.min(100, Math.round((modul_lulus / totalModul) * 100));

  // Live countdown timer untuk batas waktu bayar (24 jam)
  useEffect(() => {
    if (status !== 'menunggu_bayar' || !batas_bayar) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(batas_bayar).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Waktu bayar telah habis');
        setIsExpired(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, batas_bayar]);

  const formattedDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formattedDeadline = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Aktif Belajar
          </span>
        );
      case 'menunggu_bayar':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Clock size={13} className="text-amber-600" />
            Menunggu Pembayaran
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200 shadow-2xs">
            <Award size={13} className="text-[#843bab]" />
            Selesai & Lulus
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle size={13} className="text-rose-600" />
            Dibatalkan
          </span>
        );
      case 'kedaluwarsa':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
            <AlertCircle size={13} className="text-slate-500" />
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-[#843bab]/30 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Course Illustration Banner */}
        <Link
          href={`/kursus/${kursus.slug}`}
          className="block overflow-hidden bg-slate-50 border-b border-slate-100 hover:opacity-95 transition-all group-hover:scale-[1.01]"
        >
          <CourseIllustration slug={kursus.slug} title={kursus.judul} className="h-36 sm:h-40" />
        </Link>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          {/* Category & Status Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#843bab]/10 text-[#843bab] border border-[#843bab]/20">
              {kursus.kategori}
            </span>
            {getStatusBadge()}
          </div>

          {/* Course Title */}
          <div>
            <Link
              href={`/kursus/${kursus.slug}`}
              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#843bab] transition-colors line-clamp-2 leading-snug"
            >
              {kursus.judul}
            </Link>
          </div>

          {/* Meta Info: Instructor & Registration Date */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span className="truncate max-w-[140px] font-medium text-slate-600">
                {kursus.instruktur_nama}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar size={13} />
              <span>{formattedDate(didaftarkan_pada)}</span>
            </div>
          </div>

          {/* =========================================================
              BAGIAN: PROGRES BELAJAR (Untuk status 'aktif' dan 'selesai')
             ========================================================= */}
          {(status === 'aktif' || status === 'selesai') && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  Progres Belajar
                  {status === 'selesai' && (
                    <Award size={13} className="text-emerald-600 inline" />
                  )}
                </span>
                <span
                  className={`font-black ${
                    status === 'selesai' ? 'text-emerald-600' : 'text-[#843bab]'
                  }`}
                >
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === 'selesai'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-[#843bab] to-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>
                  {modul_lulus} dari {totalModul} modul selesai
                </span>
                {status === 'selesai' && (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Lulus
                  </span>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              BAGIAN: BATAS BAYAR (Untuk status 'menunggu_bayar')
             ========================================================= */}
          {status === 'menunggu_bayar' && (
            <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-800">Nominal Tagihan:</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {formatRupiah(nominal)}
                </span>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Batas Waktu Bayar:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {formattedDeadline(batas_bayar)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Sisa Waktu:</span>
                  <div
                    className={`font-mono text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    <Clock size={12} />
                    <span>{timeLeft || '24:00:00'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              BAGIAN: SERTIFIKAT INFO (Untuk status 'selesai')
             ========================================================= */}
          {status === 'selesai' && sertifikat?.nomor_sertifikat && (
            <div className="flex items-center justify-between text-xs bg-purple-50/60 border border-purple-100 rounded-lg px-3 py-2 text-purple-900">
              <span className="text-slate-500">Nomor Sertifikat:</span>
              <span className="font-mono font-bold text-[#843bab]">
                {sertifikat.nomor_sertifikat}
              </span>
            </div>
          )}

          {/* =========================================================
              BAGIAN: NOTICE BATAL / KEDALUWARSA
             ========================================================= */}
          {(status === 'dibatalkan' || status === 'kedaluwarsa') && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-500 leading-relaxed">
              {status === 'dibatalkan'
                ? 'Pendaftaran ini telah dibatalkan. Kuota telah dikembalikan.'
                : 'Batas waktu pembayaran 24 jam telah berakhir.'}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          BAGIAN: TOMBOL AKSI (Footer Card)
         ========================================================= */}
      <div className="p-5 pt-0">
        {/* 1. Status AKTIF: Tombol Lanjut Belajar */}
        {status === 'aktif' && (
          <Link
            href={`/belajar/${kursus.slug}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
          >
            <BookOpen size={16} />
            <span>Lanjut Belajar</span>
            <ArrowRight size={16} />
          </Link>
        )}

        {/* 2. Status MENUNGGU_BAYAR: Tombol Batal & Bayar Sekarang */}
        {status === 'menunggu_bayar' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onCancelRequest?.(id, kursus.judul)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-300 hover:border-rose-400 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
            >
              <XCircle size={14} />
              <span>Batalkan</span>
            </button>

            <Link
              href={`/kursus/${kursus.slug}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs"
            >
              <CreditCard size={14} />
              <span>Bayar Sekarang</span>
            </Link>
          </div>
        )}

        {/* 3. Status SELESAI: Tombol Lihat Sertifikat (Versi Cetak) & Review Materi */}
        {status === 'selesai' && (
          <div className="flex flex-col gap-2">
            <Link
              href={`/sertifikat/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs hover:shadow-md transition-all"
            >
              <Award size={16} />
              <span>Lihat Sertifikat (Versi Cetak)</span>
              <Printer size={15} className="opacity-80" />
            </Link>

            <Link
              href={`/belajar/${kursus.slug}`}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              <BookOpen size={14} />
              <span>Review Materi Kursus</span>
            </Link>
          </div>
        )}

        {/* 4. Status DIBATALKAN / KEDALUWARSA: Tombol Daftar Kembali */}
        {(status === 'dibatalkan' || status === 'kedaluwarsa') && (
          <Link
            href={`/kursus/${kursus.slug}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#843bab]/30 text-[#843bab] hover:bg-purple-50/50 font-bold text-xs transition-all"
          >
            <span>Daftar Kembali Kursus Ini</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
