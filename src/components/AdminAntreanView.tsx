'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Users,
  CreditCard,
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  Calendar,
  Check,
  X,
  FileText,
  CreditCardCheck
} from 'lucide-react';
import {
  AntreanData,
  PendingPaymentItem,
  ReviewCourseItem,
  AlmostFullCourseItem,
  ExpiredRegistrationItem,
} from '@/lib/antrean';
import {
  konfirmasiPembayaranAction,
  cekStatusMayarAction,
  batalkanPendaftaranAction,
  ubahStatusKursusAction,
  ubahKuotaKursusAction,
} from '@/app/admin/actions';
import { getSignedBuktiBayarUrlAction } from '@/app/kursus-saya/actions';

interface Props {
  initialData: AntreanData;
}

export default function AdminAntreanView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<AntreanData>(initialData);
  const [activeTab, setActiveTab] = useState<'semua' | 'pembayaran' | 'tinjauan' | 'kursi' | 'kedaluwarsa'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  // 1. Batalkan Pembayaran Modal
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    item: PendingPaymentItem | null;
    alasan: string;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    item: null,
    alasan: '',
    loading: false,
    error: null,
  });

  // 2. Kembalikan Kursus ke Draf Modal
  const [returnDraftModal, setReturnDraftModal] = useState<{
    isOpen: boolean;
    item: ReviewCourseItem | null;
    catatan: string;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    item: null,
    catatan: '',
    loading: false,
    error: null,
  });

  // 3. Ubah Kuota Kursus Modal
  const [quotaModal, setQuotaModal] = useState<{
    isOpen: boolean;
    item: AlmostFullCourseItem | null;
    kuotaBaru: number;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    item: null,
    kuotaBaru: 20,
    loading: false,
    error: null,
  });

  // 4. Modal Lihat Bukti Pembayaran (Signed URL)
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<{
    isOpen: boolean;
    url: string | null;
    studentName?: string;
    courseTitle?: string;
  }>({
    isOpen: false,
    url: null,
  });

  const handleLihatBukti = async (item: PendingPaymentItem) => {
    setLoadingProofId(item.id);
    try {
      const res = await getSignedBuktiBayarUrlAction(item.id);
      if (res.signedUrl) {
        setProofModal({
          isOpen: true,
          url: res.signedUrl,
          studentName: item.peserta.nama_lengkap,
          courseTitle: item.kursus.judul,
        });
      } else {
        alert(res.error || 'Gagal memuat bukti pembayaran.');
      }
    } catch {
      alert('Terjadi kesalahan saat memuat bukti pembayaran.');
    } finally {
      setLoadingProofId(null);
    }
  };

  // 5. Modal Peringatan Khusus Mayar
  const [checkingMayarId, setCheckingMayarId] = useState<string | null>(null);
  const [mayarWarningModal, setMayarWarningModal] = useState<{
    isOpen: boolean;
    item: PendingPaymentItem | null;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    loading: false,
  });

  // Action: Cek Status Mayar Otomatis via API Gateway Mayar
  const handleCekStatusMayar = async (item: PendingPaymentItem) => {
    setCheckingMayarId(item.id);
    setFeedback(null);
    try {
      const res = await cekStatusMayarAction(item.id);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else if (res.isPaid) {
        setFeedback({
          type: 'success',
          message: res.message || 'Pembayaran terverifikasi lunas di Mayar dan pendaftaran telah diaktifkan.',
        });
        setMayarWarningModal({ isOpen: false, item: null, loading: false });
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Tagihan Mayar masih berstatus BELUM DIBAYAR (UNPAID).',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Gagal memeriksa status gateway Mayar.' });
    } finally {
      setCheckingMayarId(null);
    }
  };

  // Action: Eksekusi Konfirmasi Pembayaran
  const executeKonfirmasi = (pendaftaranId: string, studentName: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await konfirmasiPembayaranAction(pendaftaranId);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({
          type: 'success',
          message: `Pembayaran ${studentName} berhasil dikonfirmasi dan pendaftaran diaktifkan.`,
        });
        setMayarWarningModal({ isOpen: false, item: null, loading: false });
        router.refresh();
      }
    });
  };

  // Action: Trigger Konfirmasi Pembayaran (Dengan proteksi khusus Mayar)
  const handleKonfirmasiPembayaran = async (item: PendingPaymentItem) => {
    // Jika metode pembayaran adalah Mayar, buka modal peringatan khusus agar tidak kecolongan
    if (item.metode_bayar === 'mayar') {
      setMayarWarningModal({
        isOpen: true,
        item,
        loading: false,
      });
      return;
    }

    // Untuk transfer manual
    if (!confirm(`Konfirmasi pembayaran peserta "${item.peserta.nama_lengkap}" untuk kursus "${item.kursus.judul}"?`)) {
      return;
    }

    executeKonfirmasi(item.id, item.peserta.nama_lengkap);
  };

  // Action: Submit Pembatalan Pendaftaran
  const submitBatalkanPendaftaran = async () => {
    if (!cancelModal.item) return;
    if (cancelModal.alasan.trim().length < 10) {
      setCancelModal((prev) => ({
        ...prev,
        error: 'Alasan pembatalan wajib diisi minimal 10 karakter.',
      }));
      return;
    }

    setCancelModal((prev) => ({ ...prev, loading: true, error: null }));
    const res = await batalkanPendaftaranAction(cancelModal.item.id, cancelModal.alasan.trim());

    if (res.error) {
      setCancelModal((prev) => ({ ...prev, loading: false, error: res.error }));
    } else {
      setCancelModal({ isOpen: false, item: null, alasan: '', loading: false, error: null });
      setFeedback({
        type: 'success',
        message: 'Pendaftaran berhasil dibatalkan dan dicatat dalam audit log.',
      });
      router.refresh();
    }
  };

  // Action: Terbitkan Kursus Langsung
  const handleTerbitkanKursus = async (item: ReviewCourseItem) => {
    if (!confirm(`Terbitkan kursus "${item.judul}" ke katalog publik sekarang?`)) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await ubahStatusKursusAction(item.id, 'terbit');
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({
          type: 'success',
          message: `Kursus "${item.judul}" resmi diterbitkan ke katalog publik.`,
        });
        router.refresh();
      }
    });
  };

  // Action: Submit Pengembalian Kursus ke Draf
  const submitKembalikanKeDraf = async () => {
    if (!returnDraftModal.item) return;
    if (returnDraftModal.catatan.trim().length < 10) {
      setReturnDraftModal((prev) => ({
        ...prev,
        error: 'Catatan tinjauan wajib diisi minimal 10 karakter.',
      }));
      return;
    }

    setReturnDraftModal((prev) => ({ ...prev, loading: true, error: null }));
    const res = await ubahStatusKursusAction(
      returnDraftModal.item.id,
      'draf',
      returnDraftModal.catatan.trim()
    );

    if (res.error) {
      setReturnDraftModal((prev) => ({ ...prev, loading: false, error: res.error }));
    } else {
      setReturnDraftModal({ isOpen: false, item: null, catatan: '', loading: false, error: null });
      setFeedback({
        type: 'success',
        message: 'Kursus berhasil dikembalikan ke draf dengan catatan untuk instruktur.',
      });
      router.refresh();
    }
  };

  // Action: Submit Ubah Kuota
  const submitUbahKuota = async () => {
    if (!quotaModal.item) return;
    if (quotaModal.kuotaBaru < quotaModal.item.kursi_terpakai) {
      setQuotaModal((prev) => ({
        ...prev,
        error: `Kuota tidak boleh lebih kecil dari kursi yang sudah terpakai (${quotaModal.item?.kursi_terpakai} kursi).`,
      }));
      return;
    }

    setQuotaModal((prev) => ({ ...prev, loading: true, error: null }));
    const res = await ubahKuotaKursusAction(quotaModal.item.id, quotaModal.kuotaBaru);

    if (res.error) {
      setQuotaModal((prev) => ({ ...prev, loading: false, error: res.error }));
    } else {
      setQuotaModal({ isOpen: false, item: null, kuotaBaru: 20, loading: false, error: null });
      setFeedback({
        type: 'success',
        message: `Kuota kursus berhasil diperbarui menjadi ${quotaModal.kuotaBaru} kursi.`,
      });
      router.refresh();
    }
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
    if (!dateStr) return 'Tanpa Batas';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  // Format Remaining Time Badge
  const formatRemainingTime = (minutes: number | null) => {
    if (minutes === null) return 'Tanpa Batas';
    if (minutes <= 0) return 'Lewat Batas Waktu';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `Sisa ${mins} menit`;
    return `Sisa ${hours}j ${mins}m`;
  };

  // Filtered lists based on search
  const query = searchQuery.toLowerCase().trim();

  const filteredPending = data.pendingPayments.filter((p) => {
    if (!query) return true;
    return (
      p.peserta.nama_lengkap.toLowerCase().includes(query) ||
      p.peserta.email.toLowerCase().includes(query) ||
      p.kursus.judul.toLowerCase().includes(query) ||
      p.metode_bayar.toLowerCase().includes(query)
    );
  });

  const filteredReview = data.reviewCourses.filter((c) => {
    if (!query) return true;
    return (
      c.judul.toLowerCase().includes(query) ||
      c.instruktur.nama_lengkap.toLowerCase().includes(query) ||
      c.kategori.toLowerCase().includes(query)
    );
  });

  const filteredAlmostFull = data.almostFullCourses.filter((c) => {
    if (!query) return true;
    return (
      c.judul.toLowerCase().includes(query) ||
      c.instruktur.nama_lengkap.toLowerCase().includes(query) ||
      c.kategori.toLowerCase().includes(query)
    );
  });

  const filteredExpired = data.expiredRegistrations.filter((e) => {
    if (!query) return true;
    return (
      e.peserta.nama_lengkap.toLowerCase().includes(query) ||
      e.peserta.email.toLowerCase().includes(query) ||
      e.kursus.judul.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      {/* =========================================================================
          1. STICKY TOP ACTION & FILTER BAR (TETAP STAY DI PALING ATAS TANPA CELAH)
         ========================================================================= */}
      <header className="sticky top-[57px] lg:top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Sisi Kiri: Search Box & Tab Filter Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari peserta, kursus, metode..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 focus:border-[#843bab] focus:bg-white transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Tab Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('semua')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'semua'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Semua Bagian
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pembayaran')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'pembayaran'
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-[#843bab] border border-slate-200'
                  }`}
                >
                  <span>Pembayaran Menunggu</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'pembayaran'
                        ? 'bg-[#ffdf0f] text-slate-900'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {data.summary.totalPendingPayments}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tinjauan')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'tinjauan'
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-900 border border-slate-200'
                  }`}
                >
                  <span>Tinjauan Kursus</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'tinjauan'
                        ? 'bg-[#ffdf0f] text-slate-900'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {data.summary.reviewCoursesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('kursi')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'kursi'
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                  }`}
                >
                  <span>Kursus Hampir Penuh</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'kursi'
                        ? 'bg-[#ffdf0f] text-slate-900'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {data.summary.almostFullCoursesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('kedaluwarsa')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'kedaluwarsa'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>Kedaluwarsa (7 Hari)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'kedaluwarsa'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {data.summary.expiredCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Sisi Kanan: Tombol Aksi Cepat (Segarkan & Panel Utama) */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    router.refresh();
                  });
                }}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Segarkan data antrean terbaru"
              >
                <RefreshCw size={13} className={isPending ? 'animate-spin text-[#843bab]' : 'text-slate-500'} />
                <span>Segarkan Antrean</span>
              </button>

              <Link
                href="/admin?tab=pendaftaran"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>Panel Utama Admin</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HEADER BANNER: Judul Antrean & Status Ringkasan (Bisa Di-scroll, Tidak Stay)
         ========================================================================= */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50/50 border-b border-slate-200/80 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-2xs border border-purple-200/60">
                  <Clock size={19} />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Antrean Operasional Admin
                  </h1>
                  {data.summary.totalPendingPayments > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                      {data.summary.totalPendingPayments} Menunggu Bayar
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                      Operasional Terkendali
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                Pusat tindak lanjut berkala transaksi peserta, verifikasi pendaftaran transfer manual, dan pemantauan ketersediaan kuota kursi kelas secara real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KONTEN UTAMA HALAMAN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 2. METRICS SUMMARY STATS (4 KARTU KPI TERANG) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Pembayaran Menunggu */}
          <div
            onClick={() => setActiveTab('pembayaran')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'pembayaran'
                ? 'bg-purple-50/50 border-[#843bab] ring-2 ring-[#843bab]/30 shadow-xs'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Menunggu Bayar
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {data.summary.totalPendingPayments}
              </span>
              {data.summary.urgentPaymentsCount > 0 && (
                <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                  {data.summary.urgentPaymentsCount} mendesak
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">
              {data.summary.urgentPaymentsCount > 0
                ? 'Sisa waktu < 3 jam'
                : 'Diurutkan batas bayar terdekat'}
            </p>
          </div>

          {/* Card 2: Kursus Ditinjau */}
          <div
            onClick={() => setActiveTab('tinjauan')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'tinjauan'
                ? 'bg-purple-50/50 border-[#843bab] ring-2 ring-[#843bab]/30 shadow-xs'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Menunggu Tinjauan
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {data.summary.reviewCoursesCount}
              </span>
              {data.summary.reviewCoursesCount > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Perlu Persetujuan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">
              Kursus diajukan instruktur
            </p>
          </div>

          {/* Card 3: Kursus Hampir Penuh */}
          <div
            onClick={() => setActiveTab('kursi')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'kursi'
                ? 'bg-purple-50/50 border-[#843bab] ring-2 ring-[#843bab]/30 shadow-xs'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kursus Hampir Penuh
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 border border-orange-200/60 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {data.summary.almostFullCoursesCount}
              </span>
              {data.summary.almostFullCoursesCount > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Sisa &le; 2 Kursi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">
              Perlu penambahan kuota
            </p>
          </div>

          {/* Card 4: Kedaluwarsa 7 Hari */}
          <div
            onClick={() => setActiveTab('kedaluwarsa')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'kedaluwarsa'
                ? 'bg-purple-50/50 border-[#843bab] ring-2 ring-[#843bab]/30 shadow-xs'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kedaluwarsa (7 Hari)
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                <ShieldAlert size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {data.summary.expiredCount}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Hanya Baca
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">
              Audit log otomatis sistem
            </p>
          </div>
        </div>

      {/* 3. FOUR SECTIONS */}

      {/* =========================================================================
          BAGIAN 1: PEMBAYARAN MENUNGGU KONFIRMASI
          Diurutkan batas_bayar terdekat. Sisa waktu < 3 jam diberi tanda merah.
          Tombol Konfirmasi dan Batalkan memakai aksi admin yang sudah ada.
         ========================================================================= */}
      {(activeTab === 'semua' || activeTab === 'pembayaran') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Pembayaran Menunggu Konfirmasi</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {filteredPending.length} antrean
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Diurutkan berdasarkan batas waktu pembayaran terdekat. Sisa waktu di bawah 3 jam ditandai merah mencolok.
                </p>
              </div>
            </div>
          </div>

          {filteredPending.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">
                Tidak ada pembayaran yang menunggu konfirmasi saat ini
              </p>
              <p className="text-xs text-slate-400">
                Semua pendaftaran telah diproses atau belum ada transaksi baru yang masuk.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredPending.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                      item.isUrgent
                        ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info Peserta & Kursus */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.isUrgent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-xs">
                              <AlertTriangle size={12} className="animate-pulse" />
                              <span>Mendesak: &lt; 3 Jam</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock size={12} />
                              <span>Menunggu Bayar</span>
                            </span>
                          )}

                          <span
                            className={`text-xs font-black ${
                              item.isUrgent ? 'text-rose-700' : 'text-slate-600'
                            }`}
                          >
                            {formatRemainingTime(item.remainingMinutes)}
                          </span>

                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-medium">
                            Batas: {formatDateTime(item.batas_bayar)}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {item.kursus.judul}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-800">Peserta:</span>{' '}
                              <span>{item.peserta.nama_lengkap}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">Email:</span>{' '}
                              <span>{item.peserta.email}</span>
                            </div>
                            {item.peserta.no_hp && (
                              <div>
                                <span className="font-semibold text-slate-800">No. HP:</span>{' '}
                                <span>{item.peserta.no_hp}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            Nominal: {formatRupiah(item.nominal)}
                          </span>

                          {item.metode_bayar === 'mayar' ? (
                            <>
                              <span className="inline-flex items-center gap-1 uppercase text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                                <CreditCardCheck size={12} className="text-[#843bab]" />
                                <span>Metode: Mayar</span>
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Otomatis via Webhook</span>
                              </span>
                            </>
                          ) : (
                            <span className="uppercase text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Metode: {item.metode_bayar.replace('_', ' ')}
                            </span>
                          )}

                          {item.bukti_bayar_path ? (
                            <button
                              type="button"
                              onClick={() => handleLihatBukti(item)}
                              disabled={loadingProofId === item.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#843bab] border border-purple-200 transition-colors cursor-pointer"
                              title="Buka bukti pembayaran (Signed URL 60 menit)"
                            >
                              <FileText size={11} />
                              <span>{loadingProofId === item.id ? 'Memuat...' : 'Lihat Bukti'}</span>
                            </button>
                          ) : item.metode_bayar === 'transfer_manual' ? (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Belum Unggah Bukti
                            </span>
                          ) : null}

                          <span className="text-[11px] text-slate-400">
                            Daftar: {formatDateTime(item.didaftarkan_pada)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Tombol Aksi Admin */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 w-full lg:w-auto justify-end">
                        {item.metode_bayar === 'mayar' && (
                          <button
                            type="button"
                            onClick={() => handleCekStatusMayar(item)}
                            disabled={checkingMayarId === item.id || isPending}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#843bab] border border-purple-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                            title="Periksa apakah invoice di gateway Mayar sudah lunas"
                          >
                            <RefreshCw size={13} className={checkingMayarId === item.id ? 'animate-spin' : ''} />
                            <span>{checkingMayarId === item.id ? 'Memeriksa...' : 'Cek Status Mayar'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleKonfirmasiPembayaran(item)}
                          disabled={isPending || checkingMayarId === item.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Konfirmasi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCancelModal({
                              isOpen: true,
                              item,
                              alasan: '',
                              loading: false,
                              error: null,
                            });
                          }}
                          disabled={isPending || checkingMayarId === item.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <X size={14} />
                          <span>Batalkan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          BAGIAN 2: KURSUS MENUNGGU TINJAUAN (Status Ditinjau)
         ========================================================================= */}
      {(activeTab === 'semua' || activeTab === 'tinjauan') && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Kursus Menunggu Tinjauan</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {filteredReview.length} kursus
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kursus berstatus ditinjau yang diajukan instruktur untuk dipublikasikan ke katalog publik.
                </p>
              </div>
            </div>
          </div>

          {filteredReview.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">
                Tidak ada kursus yang menunggu tinjauan saat ini
              </p>
              <p className="text-xs text-slate-400">
                Semua kursus telah diterbitkan atau masih berada dalam draf instruktur.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReview.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                        {course.kategori}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Diajukan: {formatDateTime(course.diajukan_pada)}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">
                      {course.judul}
                    </h3>

                    {course.ringkasan && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {course.ringkasan}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400">Instruktur:</span>{' '}
                        <span className="font-semibold text-slate-800">{course.instruktur.nama_lengkap}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Harga:</span>{' '}
                        <span className="font-bold text-slate-900">{formatRupiah(course.harga)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Kuota:</span>{' '}
                        <span className="font-bold text-slate-900">{course.kuota} kursi</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href="/admin?tab=kursus"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:text-[#723294]"
                    >
                      <span>Tinjau Silabus Lengkap</span>
                      <ChevronRight size={14} />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReturnDraftModal({
                            isOpen: true,
                            item: course,
                            catatan: '',
                            loading: false,
                            error: null,
                          });
                        }}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Kembalikan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTerbitkanKursus(course)}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg bg-[#843bab] hover:bg-[#723294] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Terbitkan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          BAGIAN 3: KURSUS HAMPIR PENUH (Sisa Kursi 2 atau Kurang)
         ========================================================================= */}
      {(activeTab === 'semua' || activeTab === 'kursi') && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Kursus Hampir Penuh</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    {filteredAlmostFull.length} kursus
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kursus terbit yang memiliki sisa kuota 2 kursi atau kurang (termasuk yang sudah penuh).
                </p>
              </div>
            </div>
          </div>

          {filteredAlmostFull.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">
                Semua kursus saat ini memiliki kapasitas yang cukup
              </p>
              <p className="text-xs text-slate-400">
                Tidak ada kursus terbit yang tersisa 2 kursi atau kurang.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlmostFull.map((course) => {
                const isFull = course.sisa_kursi === 0;
                return (
                  <div
                    key={course.id}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isFull
                        ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200'
                        : 'bg-white border-orange-200 hover:border-orange-300 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {course.kategori}
                        </span>

                        {isFull ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">
                            Penuh (0 Kursi)
                          </span>
                        ) : course.sisa_kursi === 1 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                            Kritis: Sisa 1 Kursi
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Perhatian: Sisa 2 Kursi
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                        {course.judul}
                      </h3>

                      <div className="text-xs text-slate-500">
                        Instruktur: <span className="font-semibold text-slate-700">{course.instruktur.nama_lengkap}</span>
                      </div>

                      {/* Visual Capacity Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">
                            Terisi: {course.kursi_terpakai} / {course.kuota}
                          </span>
                          <span className={isFull ? 'text-rose-700' : 'text-orange-700'}>
                            {course.persentase_terisi}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? 'bg-rose-600' : 'bg-orange-500'
                            }`}
                            style={{ width: `${course.persentase_terisi}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {formatRupiah(course.harga)}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setQuotaModal({
                            isOpen: true,
                            item: course,
                            kuotaBaru: Math.max(course.kuota + 5, course.kursi_terpakai + 5),
                            loading: false,
                            error: null,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Tambah Kuota</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          BAGIAN 4: PENDAFTARAN KEDALUWARSA (7 Hari Terakhir - Hanya Baca)
         ========================================================================= */}
      {(activeTab === 'semua' || activeTab === 'kedaluwarsa') && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Pendaftaran Kedaluwarsa (7 Hari Terakhir)</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {filteredExpired.length} arsip
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Data pendaftaran yang kedaluwarsa oleh sistem (hanya baca, tidak dapat diubah).
                </p>
              </div>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <ShieldAlert size={13} />
              <span>Arsip Audit Sistem</span>
            </div>
          </div>

          {filteredExpired.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">
                Tidak ada pendaftaran kedaluwarsa dalam 7 hari terakhir
              </p>
              <p className="text-xs text-slate-400">
                Semua pendaftaran telah diselesaikan tepat waktu atau telah melewati rentang 7 hari.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Peserta</th>
                      <th className="px-4 py-3">Kursus</th>
                      <th className="px-4 py-3">Nominal & Metode</th>
                      <th className="px-4 py-3">Kedaluwarsa Pada</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpired.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{exp.peserta.nama_lengkap}</div>
                          <div className="text-[11px] text-slate-400">{exp.peserta.email}</div>
                          {exp.peserta.no_hp && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{exp.peserta.no_hp}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {exp.kursus.judul}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{formatRupiah(exp.nominal)}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">{exp.metode_bayar}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div>{formatDateTime(exp.batas_bayar)}</div>
                          <div className="text-[10px] text-slate-400">
                            Daftar: {formatDateTime(exp.didaftarkan_pada)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Kedaluwarsa
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. MODALS */}

      {/* Modal 1: Batalkan Pendaftaran */}
      {cancelModal.isOpen && cancelModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle size={20} />
                <h3 className="text-base font-extrabold text-slate-900">Batalkan Pendaftaran</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModal({ isOpen: false, item: null, alasan: '', loading: false, error: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Anda akan membatalkan pendaftaran peserta <strong className="text-slate-900">{cancelModal.item.peserta.nama_lengkap}</strong> untuk kursus <strong className="text-slate-900">{cancelModal.item.kursus.judul}</strong>.
              </p>
              <p className="text-rose-600 font-semibold">
                Tindakan ini permanen dan akan langsung dicatat ke dalam audit log sistem.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Pembatalan (minimal 10 karakter):
              </label>
              <textarea
                rows={3}
                value={cancelModal.alasan}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, alasan: e.target.value, error: null }))}
                placeholder="Misal: Peserta meminta pembatalan karena salah memilih kursus / bukti transfer tidak valid."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{cancelModal.alasan.length} / 10 karakter minimum</span>
              </div>
            </div>

            {cancelModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {cancelModal.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModal({ isOpen: false, item: null, alasan: '', loading: false, error: null })}
                disabled={cancelModal.loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitBatalkanPendaftaran}
                disabled={cancelModal.loading || cancelModal.alasan.trim().length < 10}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {cancelModal.loading && <RefreshCw size={13} className="animate-spin" />}
                <span>Konfirmasi Pembatalan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Kembalikan Kursus ke Draf */}
      {returnDraftModal.isOpen && returnDraftModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <FileText size={20} />
                <h3 className="text-base font-extrabold text-slate-900">Kembalikan ke Draf</h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnDraftModal({ isOpen: false, item: null, catatan: '', loading: false, error: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Kursus <strong className="text-slate-900">{returnDraftModal.item.judul}</strong> oleh <strong className="text-slate-900">{returnDraftModal.item.instruktur.nama_lengkap}</strong> akan dikembalikan ke status draf untuk diperbaiki instruktur.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Catatan Tinjauan untuk Instruktur (minimal 10 karakter):
              </label>
              <textarea
                rows={3}
                value={returnDraftModal.catatan}
                onChange={(e) => setReturnDraftModal((prev) => ({ ...prev, catatan: e.target.value, error: null }))}
                placeholder="Jelaskan hal-hal yang perlu disempurnakan (misal: materi modul 2 perlu dilengkapi video demo)."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#843bab] focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{returnDraftModal.catatan.length} / 10 karakter minimum</span>
              </div>
            </div>

            {returnDraftModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {returnDraftModal.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnDraftModal({ isOpen: false, item: null, catatan: '', loading: false, error: null })}
                disabled={returnDraftModal.loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitKembalikanKeDraf}
                disabled={returnDraftModal.loading || returnDraftModal.catatan.trim().length < 10}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {returnDraftModal.loading && <RefreshCw size={13} className="animate-spin" />}
                <span>Kembalikan ke Draf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Ubah Kuota Kursus */}
      {quotaModal.isOpen && quotaModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-orange-600">
                <SlidersHorizontal size={20} />
                <h3 className="text-base font-extrabold text-slate-900">Ubah Kuota Kursus</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuotaModal({ isOpen: false, item: null, kuotaBaru: 20, loading: false, error: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Perbarui kuota untuk kursus <strong className="text-slate-900">{quotaModal.item.judul}</strong>.
              </p>
              <p className="text-slate-500">
                Kursi terpakai saat ini: <strong className="text-slate-900">{quotaModal.item.kursi_terpakai} kursi</strong> (kuota lama: {quotaModal.item.kuota} kursi).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kuota Baru (1 - 100):
              </label>
              <input
                type="number"
                min={quotaModal.item.kursi_terpakai}
                max={100}
                value={quotaModal.kuotaBaru}
                onChange={(e) => setQuotaModal((prev) => ({ ...prev, kuotaBaru: parseInt(e.target.value) || 0, error: null }))}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-[#843bab] focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Kuota minimal adalah {quotaModal.item.kursi_terpakai} kursi (tidak boleh di bawah kursi yang telah terpakai).
              </p>
            </div>

            {quotaModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {quotaModal.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuotaModal({ isOpen: false, item: null, kuotaBaru: 20, loading: false, error: null })}
                disabled={quotaModal.loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitUbahKuota}
                disabled={quotaModal.loading || quotaModal.kuotaBaru < quotaModal.item.kursi_terpakai}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#843bab] hover:bg-[#723294] text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {quotaModal.loading && <RefreshCw size={13} className="animate-spin" />}
                <span>Simpan Perubahan Kuota</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Lihat Bukti Pembayaran (Signed URL Maksimal 60 Menit) */}
      {proofModal.isOpen && proofModal.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bukti Pembayaran Transfer Manual
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {proofModal.studentName} &bull; {proofModal.courseTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofModal({ isOpen: false, url: null })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-purple-50/60 rounded-2xl p-3 border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#843bab] shrink-0" />
              <span>
                Tautan unduh aman (signed URL) ini hanya berlaku maksimal 60 menit dari Supabase Storage privat.
              </span>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              {proofModal.url.toLowerCase().includes('.pdf') ? (
                <div className="w-full text-center py-10 space-y-3">
                  <FileText size={48} className="mx-auto text-purple-600" />
                  <p className="text-sm font-bold text-slate-800">Dokumen PDF Bukti Transfer</p>
                  <a
                    href={proofModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#703291] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Buka PDF di Tab Baru</span>
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={proofModal.url}
                  alt="Bukti Transfer Pembayaran"
                  className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <a
                href={proofModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#843bab] font-bold text-xs transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Buka di Tab Baru</span>
              </a>
              <button
                type="button"
                onClick={() => setProofModal({ isOpen: false, url: null })}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Peringatan Konfirmasi Manual Transaksi Mayar (Otomasi BR-07, BR-12) */}
      {mayarWarningModal.isOpen && mayarWarningModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Konfirmasi Manual Transaksi Mayar
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Peringatan keamanan aktivasi pendaftaran peserta gateway otomatis.
                </p>
              </div>
            </div>

            {/* Detail Transaksi */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Peserta:</span>
                <strong className="text-slate-900">{mayarWarningModal.item.peserta.nama_lengkap}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kursus:</span>
                <strong className="text-slate-900 line-clamp-1">{mayarWarningModal.item.kursus.judul}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tagihan:</span>
                <strong className="text-purple-700 text-sm">{formatRupiah(mayarWarningModal.item.nominal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  <CreditCardCheck size={11} />
                  <span>MAYAR (QRIS / VA)</span>
                </span>
              </div>
              {mayarWarningModal.item.mayar_invoice_id && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Invoice ID:</span>
                  <code className="font-mono text-[11px] text-slate-700">{mayarWarningModal.item.mayar_invoice_id}</code>
                </div>
              )}
            </div>

            {/* Kotak Peringatan Kritis */}
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-extrabold text-amber-800 flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                <span>Peringatan Kebocoran Pembayaran</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Pendaftaran Mayar <strong>otomatis aktif begitu peserta membayar</strong> via Webhook. Jika Anda mengonfirmasi manual sekarang padahal peserta <strong>belum membayar di Mayar</strong>, peserta akan mendapatkan akses gratis tanpa terverifikasi.
              </p>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Silakan klik tombol <strong>&ldquo;Cek Status di Mayar&rdquo;</strong> terlebih dahulu untuk memastikan apakah uang sudah masuk ke sistem Mayar.
              </p>
            </div>

            {/* Aksi Tombol */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMayarWarningModal({ isOpen: false, item: null, loading: false })}
                className="order-3 sm:order-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleCekStatusMayar(mayarWarningModal.item!)}
                disabled={checkingMayarId === mayarWarningModal.item.id}
                className="order-1 sm:order-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#843bab] border border-purple-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} className={checkingMayarId === mayarWarningModal.item.id ? 'animate-spin' : ''} />
                <span>{checkingMayarId === mayarWarningModal.item.id ? 'Memeriksa ke Mayar...' : 'Cek Status di Mayar'}</span>
              </button>

              <button
                type="button"
                onClick={() => executeKonfirmasi(mayarWarningModal.item!.id, mayarWarningModal.item!.peserta.nama_lengkap)}
                disabled={isPending || checkingMayarId === mayarWarningModal.item.id}
                className="order-2 sm:order-3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center"
              >
                Tetap Konfirmasi Lunas (Manual)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
