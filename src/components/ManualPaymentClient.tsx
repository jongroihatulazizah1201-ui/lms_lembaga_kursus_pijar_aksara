'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Zap,
  QrCode,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  unggahBuktiBayarAction,
  getSignedBuktiBayarUrlAction,
  getOrCreateMayarPaymentUrlAction,
} from '@/app/kursus-saya/actions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  registration: {
    id: string;
    status: string;
    nominal: number;
    metode_bayar: string;
    batas_bayar: string | null;
    bukti_bayar_path: string | null;
    mayar_invoice_id?: string | null;
    didaftarkan_pada: string;
    kursus: {
      id: string;
      judul: string;
      slug: string;
      kategori: string;
      ringkasan: string;
      harga: number;
      instruktur: {
        nama_lengkap: string;
      } | null;
    };
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  existingSignedUrl?: string | null;
  initialMayarPaymentUrl?: string | null;
}

export default function ManualPaymentClient({
  registration,
  bankDetails,
  existingSignedUrl,
  initialMayarPaymentUrl,
}: Props) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRedirectingMayar, setIsRedirectingMayar] = useState(false);
  const [mayarError, setMayarError] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isUrgent: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isUrgent: false,
  });

  // Calculate live countdown timer
  useEffect(() => {
    if (!registration.batas_bayar) return;

    const calculateTime = () => {
      const now = Date.now();
      const target = new Date(registration.batas_bayar!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          isUrgent: false,
        });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        // Sisa waktu kurang dari 3 jam diberi tanda merah
        const isUrgent = diff <= 3 * 60 * 60 * 1000;

        setTimeLeft({
          hours,
          minutes,
          seconds,
          isExpired: false,
          isUrgent,
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [registration.batas_bayar]);

  // Handle file selection and client-side validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validasi ukuran berkas di sisi klien (maksimal 2MB = 2097152 bytes)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi batas maksimal 2 MB. Silakan kompres atau pilih berkas lain.');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validasi tipe berkas di sisi klien
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas bertipe JPG, PNG, WebP, atau PDF.');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);

    // Buat image preview jika file berupa gambar
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Salin Nomor Rekening
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Salin Nominal
  const handleCopyNominal = () => {
    navigator.clipboard.writeText(registration.nominal.toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  // Redirect / Buat Link Pembayaran Otomatis Mayar (QRIS / VA)
  const handlePayViaMayar = async () => {
    if (timeLeft.isExpired) {
      setErrorMessage('Batas waktu pembayaran telah habis. Silakan daftar kembali dari katalog.');
      return;
    }

    setIsRedirectingMayar(true);
    setMayarError(null);

    if (initialMayarPaymentUrl) {
      window.location.href = initialMayarPaymentUrl;
      return;
    }

    try {
      const res = await getOrCreateMayarPaymentUrlAction(registration.id);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        setIsRedirectingMayar(false);
        setMayarError(res?.error || 'Gagal menyiapkan halaman pembayaran Mayar. Silakan gunakan metode transfer manual di bawah.');
      }
    } catch (e: any) {
      setIsRedirectingMayar(false);
      setMayarError(e?.message || 'Terjadi gangguan koneksi ke Mayar. Silakan gunakan transfer manual.');
    }
  };

  // Submit Upload Bukti Bayar
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Harap pilih berkas bukti pembayaran terlebih dahulu.');
      return;
    }

    if (timeLeft.isExpired) {
      setErrorMessage('Batas waktu pembayaran telah habis. Anda tidak dapat mengunggah bukti lagi.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    startTransition(async () => {
      const res = await unggahBuktiBayarAction(registration.id, formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || 'Bukti pembayaran berhasil diunggah!');
        setSelectedFile(null);
        setFilePreview(null);
        router.refresh();
      }
    });
  };

  // Format Helper Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format Helper Tanggal
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  const isTerminal =
    registration.status === 'selesai' ||
    registration.status === 'kedaluwarsa' ||
    registration.status === 'dibatalkan';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. BREADCRUMB & HEADER */}
      <div>
        <Link
          href="/kursus-saya"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Kursus Saya</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pembayaran Kursus
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gunakan pembayaran otomatis Mayar (QRIS / Virtual Account) untuk aktivasi instan, atau pilih transfer manual (BR-07).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-[#843bab] border border-purple-200">
              {registration.kursus.kategori}
            </span>
          </div>
        </div>
      </div>

      {/* ALERT STATUS JIKA SUDAH BUKAN MENUNGGU_BAYAR */}
      {registration.status === 'aktif' && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base">Pendaftaran Telah Dikonfirmasi & Aktif!</h3>
            <p className="text-xs text-emerald-700">
              Pembayaran Anda telah diverifikasi oleh administrator. Anda dapat langsung mulai belajar di ruang kursus.
            </p>
            <div className="pt-2">
              <Link
                href={`/belajar/${registration.kursus.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Mulai Belajar Sekarang</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {registration.status === 'kedaluwarsa' && (
        <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-start gap-3">
          <Clock size={24} className="text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base">Pendaftaran Telah Kedaluwarsa</h3>
            <p className="text-xs text-slate-600">
              Batas waktu 24 jam pembayaran telah berakhir sehingga pendaftaran ini ditutup otomatis oleh sistem.
            </p>
            <div className="pt-2">
              <Link
                href={`/kursus/${registration.kursus.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#723294] text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Daftar Ulang Kursus Ini</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {registration.status === 'dibatalkan' && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <XCircle size={24} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base">Pendaftaran Dibatalkan</h3>
            <p className="text-xs text-rose-700">
              Pendaftaran ini telah dibatalkan. Silakan mendaftar kembali jika masih berminat mengikuti kursus ini.
            </p>
            <div className="pt-2">
              <Link
                href={`/kursus/${registration.kursus.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#723294] text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Lihat Katalog Kursus</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK NOTIFICATION */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* 2. MAIN GRID (KIRI: PETUNJUK & REKENING, KANAN: FORM UPLOAD BUKTI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Kursus & Nominal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Kursus yang Dipilih
              </span>
              <span className="text-xs font-bold text-slate-500">
                ID: {registration.id.slice(0, 8)}...
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {registration.kursus.judul}
              </h2>
              {registration.kursus.instruktur && (
                <p className="text-xs text-slate-500 mt-1">
                  Instruktur: <span className="font-semibold text-slate-700">{registration.kursus.instruktur.nama_lengkap}</span>
                </p>
              )}
            </div>

            {/* Tagihan & Tombol Salin */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-900/70">Total Tagihan:</span>
                <div className="text-2xl font-black text-[#843bab]">
                  {formatRupiah(registration.nominal)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyNominal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-purple-100/50 text-[#843bab] text-xs font-bold border border-purple-200 transition-all shadow-2xs cursor-pointer"
                title="Salin nominal tagihan"
              >
                {copiedNominal ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedNominal ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Card Hitung Mundur Batas Waktu Bayar */}
          {registration.status === 'menunggu_bayar' && (
            <div
              className={`rounded-2xl p-6 border transition-all ${
                timeLeft.isUrgent
                  ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={18} className={timeLeft.isUrgent ? 'text-rose-600' : 'text-amber-500'} />
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${
                    timeLeft.isUrgent ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    Batas Waktu Pembayaran
                  </span>
                </div>

                {timeLeft.isUrgent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    <AlertTriangle size={11} />
                    <span>Mendesak (&lt; 3 Jam)</span>
                  </span>
                )}
              </div>

              {/* Countdown Digits */}
              {timeLeft.isExpired ? (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold text-center">
                  Waktu pembayaran telah kedaluwarsa. Pendaftaran tidak dapat diproses lagi.
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl sm:text-3xl font-black px-3 py-1.5 rounded-xl border ${
                        timeLeft.isUrgent
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-slate-900 text-white border-slate-800'
                      }`}>
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Jam</span>
                    </div>

                    <span className="text-xl font-bold text-slate-400">:</span>

                    <div className="flex flex-col items-center">
                      <span className={`text-2xl sm:text-3xl font-black px-3 py-1.5 rounded-xl border ${
                        timeLeft.isUrgent
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-slate-900 text-white border-slate-800'
                      }`}>
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Menit</span>
                    </div>

                    <span className="text-xl font-bold text-slate-400">:</span>

                    <div className="flex flex-col items-center">
                      <span className={`text-2xl sm:text-3xl font-black px-3 py-1.5 rounded-xl border ${
                        timeLeft.isUrgent
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-slate-900 text-white border-slate-800'
                      }`}>
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Detik</span>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 hidden sm:block">
                    <div className="text-[11px] text-slate-400">Jatuh Tempo:</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {formatDateTime(registration.batas_bayar)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              METODE 1: PEMBAYARAN OTOMATIS MAYAR (QRIS / VA) - REKOMENDASI
             ========================================================= */}
          {registration.status === 'menunggu_bayar' && (
            <div className="bg-white rounded-2xl border-2 border-[#843bab]/30 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Pembayaran Otomatis Mayar
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Aktivasi instan tanpa menunggu konfirmasi manual admin
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>Rekomendasi Utama</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Bayar instan via <strong>QRIS</strong> (GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin) atau <strong>Virtual Account Bank</strong> melalui gerbang resmi Mayar. Begitu pembayaran selesai, sistem webhook langsung mengaktifkan pendaftaran kursus Anda seketika!
              </p>

              {/* Supported payment badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <QrCode size={13} className="text-[#843bab]" />
                  <span>QRIS</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  BCA VA
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  Mandiri VA
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  BNI VA
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  BRI VA
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  E-Wallet
                </span>
              </div>

              {mayarError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{mayarError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePayViaMayar}
                  disabled={isRedirectingMayar || timeLeft.isExpired}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#843bab] hover:bg-[#723294] active:bg-[#612880] text-white text-xs font-extrabold shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isRedirectingMayar ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="xs" variant="white" active={true} delayMs={0} />
                      <span>Mengarahkan ke Halaman Mayar...</span>
                    </div>
                  ) : (
                    <>
                      <Zap size={14} className="text-[#ffdf0f]" />
                      <span>Bayar Sekarang via Mayar (QRIS / VA)</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              METODE 2: TRANSFER BANK MANUAL (BR-07) - ALTERNATIF
             ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Transfer Bank Manual
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfirmasi manual oleh administrator (BR-07)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Alternatif
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda ingin transfer antarbank langsung, silakan transfer ke rekening resmi di bawah ini dan unggah berkas bukti transfer pada formulir sebelah kanan:
            </p>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold tracking-wider uppercase text-[11px]">
                  {bankDetails.bankName}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/10">
                  Transfer Manual
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-slate-400">Nomor Rekening:</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-[#ffdf0f]">
                    {bankDetails.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
                  >
                    {copiedAccount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedAccount ? 'Tersalin' : 'Salin Rekening'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-1 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Atas Nama:</span>
                <span className="font-bold text-white tracking-wide">
                  {bankDetails.accountName}
                </span>
              </div>
            </div>

            {/* Langkah Instruksi */}
            <div className="pt-2 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-800">Petunjuk Pembayaran:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                <li>Buka aplikasi mobile banking / internet banking / ATM Anda.</li>
                <li>Transfer nominal yang tertera ke nomor rekening resmi di atas.</li>
                <li>Simpan bukti transfer dalam format JPG, PNG, WebP, atau PDF (maksimal 2 MB).</li>
                <li>Unggah berkas bukti pada form di sebelah kanan halaman ini.</li>
                <li>Administrator akan memeriksa bukti dan mengaktifkan akses kelas Anda.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (5 Kolom: Form Upload Bukti) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-[#843bab]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Unggah Bukti Bayar
                </h3>
              </div>

              {registration.bukti_bayar_path && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Check size={11} />
                  <span>Sudah Ada Bukti</span>
                </span>
              )}
            </div>

            {/* Info Bukti yang Sudah Pernah Diunggah */}
            {registration.bukti_bayar_path && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-500" />
                    <span>Bukti Tersimpan</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Tersedia</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Anda telah mengunggah bukti pembayaran. Admin sedang memverifikasi transaksi Anda.
                </p>

                {existingSignedUrl && (
                  <div className="pt-1">
                    <a
                      href={existingSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:text-[#723294] transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Lihat Bukti Bayar Anda (Tautan Aman 60 Menit)</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Form Upload Bukti Baru */}
            {registration.status === 'menunggu_bayar' && !timeLeft.isExpired ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Pilih Berkas Bukti Pembayaran:
                  </label>

                  <div className="border-2 border-dashed border-slate-200 hover:border-[#843bab] rounded-2xl p-4 sm:p-6 text-center transition-all bg-slate-50/50 hover:bg-purple-50/20 cursor-pointer relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      disabled={isPending}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />

                    <div className="space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-purple-50 text-[#843bab] flex items-center justify-center mx-auto">
                        <Upload size={20} />
                      </div>

                      {selectedFile ? (
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
                            {selectedFile.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk ganti berkas
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-700">
                            Tarik berkas ke sini atau klik untuk memilih
                          </div>
                          <div className="text-[11px] text-slate-400">
                            JPG, PNG, WebP, atau PDF (Maksimal 2 MB)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Preview jika gambar */}
                {filePreview && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-2 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Preview Bukti Pembayaran"
                      className="max-h-48 mx-auto rounded-lg object-contain shadow-2xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedFile || isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#843bab] hover:bg-[#723294] active:bg-[#612880] text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Mengunggah Berkas...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>{registration.bukti_bayar_path ? 'Ganti / Unggah Ulang Bukti' : 'Kirim Bukti Pembayaran'}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-xs text-center space-y-1">
                <div className="font-bold">Formulir Tidak Tersedia</div>
                <p className="text-[11px] text-slate-500">
                  {timeLeft.isExpired
                    ? 'Waktu pembayaran telah habis.'
                    : `Status pendaftaran saat ini adalah ${registration.status}.`}
                </p>
              </div>
            )}

            {/* Bantuan & Info Privasi */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Penyimpanan Aman & Privat</span>
              </div>
              <p>
                Berkas bukti bayar disimpan di bucket privat berenkripsi. Hanya Anda dan tim administrator yang dapat melihat bukti transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
