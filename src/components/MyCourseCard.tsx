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
  Building,
  Copy,
  Check,
  X,
  AlertTriangle,
  CreditCardCheck,
  BadgeCheck,
  Target,
  QrCode,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { getOrCreateMayarPaymentUrlAction } from '@/app/kursus-saya/actions';
import LoadingSpinner from '@/components/LoadingSpinner';

export interface ModulSummaryItem {
  id: string;
  urutan: number;
  judul: string;
  durasi_menit: number;
  is_lulus: boolean;
  is_read: boolean;
}

export interface NextModulInfo {
  urutan: number;
  judul: string;
  is_read: boolean;
}

export interface EnrollmentCourseData {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  harga: number;
  instruktur_nama: string;
  total_modul: number;
  total_durasi_menit?: number;
  modul_list?: ModulSummaryItem[];
}

export interface EnrollmentItem {
  id: string;
  status: string;
  nominal: number;
  metode_bayar: string;
  batas_bayar: string | null;
  bukti_bayar_path?: string | null;
  didaftarkan_pada: string;
  mayar_invoice_id: string | null;
  kursus: EnrollmentCourseData;
  modul_lulus: number;
  durasi_selesai_menit?: number;
  next_modul?: NextModulInfo | null;
  sertifikat?: {
    id: string;
    nomor_sertifikat: string;
    diterbitkan_pada: string;
  } | null;
  nilai_kuis_terbaik?: number | null;
  rata_rata_kuis?: number | null;
}

interface Props {
  enrollment: EnrollmentItem;
  onCancelRequest?: (id: string, courseTitle: string) => void;
}

export default function MyCourseCard({ enrollment, onCancelRequest }: Props) {
  const { kursus, status, nominal, batas_bayar, modul_lulus, id, didaftarkan_pada, sertifikat } = enrollment;
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [isRedirectingMayar, setIsRedirectingMayar] = useState(false);
  const [mayarError, setMayarError] = useState<string | null>(null);

  const handlePayViaMayar = async () => {
    setIsRedirectingMayar(true);
    setMayarError(null);
    try {
      const res = await getOrCreateMayarPaymentUrlAction(id);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        setIsRedirectingMayar(false);
        setMayarError(res?.error || 'Gagal menyiapkan halaman pembayaran Mayar.');
      }
    } catch (e: any) {
      setIsRedirectingMayar(false);
      setMayarError(e?.message || 'Terjadi gangguan saat menghubungi Mayar.');
    }
  };

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
        if (enrollment.bukti_bayar_path) {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
              <Clock size={13} className="text-amber-600 animate-pulse" />
              Menunggu Konfirmasi Admin
            </span>
          );
        }
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
            <XCircle size={13} className="text-red-600" />
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
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
              {/* Header Skala */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#843bab]" />
                  <span>Skala Penugasan</span>
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

              {/* Visual Segmented Progress Scale (Pills Stepper) */}
              {kursus.modul_list && kursus.modul_list.length > 0 && kursus.modul_list.length <= 8 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 w-full">
                    {kursus.modul_list.map((m, idx) => {
                      const isNextTask = enrollment.next_modul?.urutan === m.urutan && status === 'aktif';
                      return (
                        <div
                          key={m.id || idx}
                          title={`Modul ${m.urutan}: ${m.judul} (${m.is_lulus ? 'Lulus Kuis' : isNextTask ? 'Tugas Aktif' : 'Belum Dikerjakan'})`}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 relative ${
                            m.is_lulus
                              ? 'bg-emerald-500'
                              : isNextTask
                              ? 'bg-[#843bab] animate-pulse ring-2 ring-[#843bab]/30'
                              : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Fallback Continuous Progress Bar */
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status === 'selesai'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-[#843bab] to-purple-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Status Rincian: Berapa modul lulus, berapa tugas belum dikerjakan */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5 border-t border-slate-200/60">
                <span className="font-medium">
                  <strong className="text-slate-900 font-bold">{modul_lulus}</strong> dari{' '}
                  <strong className="text-slate-900 font-bold">{totalModul}</strong> modul lulus
                  {kursus.total_durasi_menit ? (
                    <span className="text-slate-400 ml-1">
                      ({enrollment.durasi_selesai_menit || 0}/{kursus.total_durasi_menit} mnt)
                    </span>
                  ) : null}
                </span>
                {status === 'selesai' ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Lulus 100%
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 text-[10px]">
                    {totalModul - modul_lulus} tugas tersisa
                  </span>
                )}
              </div>

              {/* Callout Tugas Berikutnya yang Belum Dikerjakan */}
              {status === 'aktif' && enrollment.next_modul && (
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] text-slate-700 flex items-start gap-2">
                  <Target size={14} className="text-[#843bab] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="font-bold text-slate-900 truncate">
                      Tugas Berikutnya: Modul {enrollment.next_modul.urutan}
                    </div>
                    <div className="text-slate-600 truncate text-[10.5px]">
                      {enrollment.next_modul.judul}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        enrollment.next_modul.is_read ? 'bg-amber-500' : 'bg-[#843bab]'
                      }`} />
                      <span className="text-[10px] font-semibold text-slate-700">
                        {enrollment.next_modul.is_read ? 'Kuis Menunggu Dikerjakan' : 'Pelajari Materi & Video'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    <Clock size={12} />
                    <span>{timeLeft || '24:00:00'}</span>
                  </div>
                </div>

                {enrollment.bukti_bayar_path && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 bg-amber-100/70 -mx-1 -mb-1 p-2 rounded-lg flex items-start gap-2">
                    <FileText size={14} className="text-[#843bab] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-950 leading-snug">
                      <span className="font-extrabold">Bukti transfer telah dikirim.</span> Menunggu verifikasi Admin untuk membuka akses kelas.
                    </p>
                  </div>
                )}
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

        {/* 2. Status MENUNGGU_BAYAR: Tombol Bayar & Batal */}
        {status === 'menunggu_bayar' && (
          <div className="space-y-2">
            <Link
              href={`/kursus-saya/${id}/bayar`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {enrollment.bukti_bayar_path ? (
                <>
                  <FileText size={14} className="text-[#ffdf0f]" />
                  <span>Lihat / Perbarui Bukti Transfer</span>
                </>
              ) : (
                <>
                  <CreditCardCheck size={14} className="text-[#ffdf0f]" />
                  <span>Bayar Kursus (Mayar / Transfer)</span>
                </>
              )}
              <ArrowRight size={14} />
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onCancelRequest?.(id, kursus.judul)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
              >
                <XCircle size={13} />
                <span>Batalkan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
              >
                <CreditCard size={13} />
                <span>Petunjuk Bayar</span>
              </button>
            </div>
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

      {/* Modal Petunjuk Pembayaran Kursus */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto text-slate-900">
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X size={20} />
            </button>

            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  Instruksi Pembayaran
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                  {kursus.judul}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selesaikan pembayaran Anda sebelum batas waktu berakhir untuk mengaktifkan akses materi kursus.
                </p>
              </div>

              {/* Rincian Tagihan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Nominal Tagihan:</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatRupiah(nominal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>Batas Waktu Bayar:</span>
                  <span className="font-semibold text-slate-800">
                    {formattedDeadline(batas_bayar)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Sisa Waktu:</span>
                  <span className={`font-mono font-bold ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
                    {timeLeft || '24:00:00'}
                  </span>
                </div>
              </div>

              {/* JIKA SUDAH KEDALUWARSA */}
              {isExpired ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900">
                        Batas Waktu Pembayaran Telah Habis
                      </h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        Batas waktu pembayaran 24 jam untuk pendaftaran ini telah terlewati, sehingga reservasi kursi otomatis hangus dan tidak dapat dikonfirmasi. Silakan batalkan pendaftaran ini terlebih dahulu, lalu daftar kembali dari katalog untuk mendapatkan batas waktu baru.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      onCancelRequest?.(id, kursus.judul);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Batalkan Pendaftaran Ini Sekarang
                  </button>
                </div>
              ) : (
                /* JIKA BELUM KEDALUWARSA: TAMPILKAN METODE MAYAR & REKENING TRANSFER MANUAL */
                <div className="space-y-4">
                  {/* METODE 1: MAYAR (OTOMATIS) */}
                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#843bab] text-white">
                        <BadgeCheck size={12} className="text-[#ffdf0f]" />
                        <span>Rekomendasi • Otomatis</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Gerbang Resmi Mayar
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CreditCardCheck size={16} className="text-[#843bab]" />
                        <span>Pembayaran Otomatis (QRIS & VA)</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Bayar via <strong>QRIS</strong> (e-wallet / m-Banking) atau <strong>Virtual Account Bank</strong>. Akses kursus langsung aktif otomatis tanpa menunggu konfirmasi manual admin.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                        <QrCode size={11} className="text-[#843bab]" /> QRIS
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        BCA VA
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        Mandiri VA
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        BNI / BRI VA
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        E-Wallet
                      </span>
                    </div>

                    {/* Langkah Singkat Bayar via Mayar */}
                    <div className="pt-2 border-t border-purple-200/60 space-y-1.5 text-[11px] text-slate-700">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <HelpCircle size={12} className="text-[#843bab]" />
                        <span>Langkah Pembayaran Otomatis:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-0.5 leading-relaxed">
                        <li>Klik tombol <strong>"Bayar Sekarang via Mayar"</strong> di bawah.</li>
                        <li>Pilih <strong>QRIS</strong> untuk scan via m-Banking/e-wallet, atau pilih <strong>Virtual Account</strong> bank Anda.</li>
                        <li>Selesaikan transfer. Akses belajar langsung <strong>aktif otomatis</strong> tanpa kirim bukti bayar!</li>
                      </ol>
                    </div>

                    {mayarError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                        <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                        <span>{mayarError}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handlePayViaMayar}
                        disabled={isRedirectingMayar}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#843bab] hover:bg-[#723294] active:bg-[#612880] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {isRedirectingMayar ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="xs" variant="white" active={true} delayMs={0} />
                            <span>Mengarahkan ke Mayar...</span>
                          </div>
                        ) : (
                          <>
                            <CreditCardCheck size={14} className="text-[#ffdf0f]" />
                            <span>Bayar Sekarang via Mayar (QRIS / VA)</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* METODE 2: TRANSFER MANUAL */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[#843bab]" />
                        <span>Metode 2: Alternatif Transfer Bank Manual</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Jika Anda ingin transfer langsung antarbank, silakan transfer ke rekening berikut dan unggah bukti transfer:
                    </p>

                    {/* Rekening BCA */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#843bab]/40 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-[11px] shrink-0">
                          BCA
                        </div>
                        <div>
                          <div className="font-mono text-xs font-black text-slate-900 tracking-wider">
                            123-456-7890
                          </div>
                          <div className="text-[10px] text-slate-500">
                            a.n. Lembaga Kursus Pijar Aksara
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('1234567890');
                          setCopiedBank('BCA');
                          setTimeout(() => setCopiedBank(null), 2500);
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedBank === 'BCA' ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Rekening Mandiri */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#843bab]/40 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-black text-[11px] shrink-0">
                          MDR
                        </div>
                        <div>
                          <div className="font-mono text-xs font-black text-slate-900 tracking-wider">
                            157-00-1234567-8
                          </div>
                          <div className="text-[10px] text-slate-500">
                            a.n. Lembaga Kursus Pijar Aksara
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('1570012345678');
                          setCopiedBank('MANDIRI');
                          setTimeout(() => setCopiedBank(null), 2500);
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedBank === 'MANDIRI' ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Langkah Petunjuk Transfer Manual */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <HelpCircle size={12} className="text-slate-600" />
                        <span>Langkah Transfer Manual:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 pl-0.5 leading-relaxed">
                        <li>Transfer tepat sesuai nominal tagihan ke salah satu rekening resmi di atas.</li>
                        <li>Simpan struk / tangkap layar (*screenshot*) bukti transfer berhasil.</li>
                        <li>Buka tautan di bawah dan unggah struk transfer Anda agar diverifikasi admin.</li>
                      </ol>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/kursus-saya/${id}/bayar`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <CreditCard size={14} className="text-slate-600" />
                        <span>Halaman Pembayaran & Unggah Bukti Transfer</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol Tutup */}
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
