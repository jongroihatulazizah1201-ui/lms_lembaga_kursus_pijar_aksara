'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MyCourseCard, { EnrollmentItem } from './MyCourseCard';
import { batalkanPendaftaranAction } from '@/app/kursus/actions';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  GraduationCap,
  Target,
  Printer,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  initialCourses: EnrollmentItem[];
  userProfile: {
    nama_lengkap: string;
    email: string;
  };
}

type TabFilter = 'semua' | 'aktif' | 'menunggu_bayar' | 'selesai' | 'dibatalkan';

export default function MyCoursesClient({ initialCourses, userProfile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabFilter | null;

  const validTabs: TabFilter[] = ['semua', 'aktif', 'menunggu_bayar', 'selesai', 'dibatalkan'];
  const [activeTab, setActiveTab] = useState<TabFilter>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'semua'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // State untuk Modal Batal Pendaftaran
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{ id: string; title: string } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Hitung jumlah statistik
  const totalCount = initialCourses.length;
  const aktifCount = initialCourses.filter((c) => c.status === 'aktif').length;
  const menungguCount = initialCourses.filter((c) => c.status === 'menunggu_bayar').length;
  const selesaiCount = initialCourses.filter((c) => c.status === 'selesai').length;
  const batalCount = initialCourses.filter((c) => c.status === 'dibatalkan' || c.status === 'kedaluwarsa').length;

  // Filter kursus berdasarkan Tab dan Search
  const filteredCourses = initialCourses.filter((item) => {
    // 1. Filter Tab
    let matchesTab = true;
    if (activeTab === 'aktif') matchesTab = item.status === 'aktif';
    else if (activeTab === 'menunggu_bayar') matchesTab = item.status === 'menunggu_bayar';
    else if (activeTab === 'selesai') matchesTab = item.status === 'selesai';
    else if (activeTab === 'dibatalkan') matchesTab = item.status === 'dibatalkan' || item.status === 'kedaluwarsa';

    // 2. Filter Search Query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.kursus.judul.toLowerCase().includes(q) ||
      item.kursus.kategori.toLowerCase().includes(q) ||
      item.kursus.instruktur_nama.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const handleOpenCancelModal = (id: string, title: string) => {
    setSelectedEnrollment({ id, title });
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedEnrollment) return;

    startTransition(async () => {
      setCancelError(null);
      const res = await batalkanPendaftaranAction(selectedEnrollment.id);
      if (res?.error) {
        setCancelError(res.error);
      } else {
        setCancelSuccess(`Pendaftaran untuk "${selectedEnrollment.title}" berhasil dibatalkan.`);
        setCancelModalOpen(false);
        setSelectedEnrollment(null);
        router.refresh();

        // Hilangkan notifikasi sukses setelah 4 detik
        setTimeout(() => {
          setCancelSuccess(null);
        }, 4000);
      }
    });
  };

  // Filter kursus dengan batas bayar mendesak (< 6 jam)
  const urgentPayments = initialCourses.filter((item) => {
    if (item.status !== 'menunggu_bayar' || !item.batas_bayar) return false;
    const diff = new Date(item.batas_bayar).getTime() - Date.now();
    return diff > 0 && diff <= 6 * 60 * 60 * 1000;
  });

  // Cari kursus aktif yang memiliki modul/tugas berikutnya untuk notifikasi ajakan belajar
  const activeCourseWithNextTask = initialCourses.find(
    (c) => c.status === 'aktif' && c.next_modul
  );

  // Cari kursus selesai terbaru yang sertifikatnya siap
  const recentlyCompletedCourse = initialCourses.find(
    (c) => c.status === 'selesai' && c.sertifikat?.nomor_sertifikat
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* =========================================================
          STICKY SEARCH & FAST FILTER TOOLBAR (Berada di Atas & Stay Saat Di-scroll)
         ========================================================= */}
      <section
        aria-label="Pencarian dan Filter Kursus Saya"
        className="sticky top-[57px] lg:top-0 z-30 w-full bg-white/95 backdrop-blur-md pt-3.5 pb-3 border-b border-slate-200/90 shadow-xs transition-all"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Box: Cari kursus atau instruktur... */}
            <div className="relative flex-1 w-full max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kursus atau instruktur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] focus:bg-white transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tab Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'semua'
                    ? 'bg-[#843bab] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('aktif')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'aktif'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Aktif Belajar ({aktifCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('menunggu_bayar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'menunggu_bayar'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Menunggu Bayar ({menungguCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('selesai')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'selesai'
                    ? 'bg-[#843bab] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Selesai & Lulus ({selesaiCount})
              </button>
              {batalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dibatalkan')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'dibatalkan'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Dibatalkan ({batalCount})
                </button>
              )}

              {(searchQuery || activeTab !== 'semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('semua');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title="Reset Filter & Pencarian"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          1. HEADER BANNER: Profil & Ringkasan Statistik
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/80 via-white to-slate-50/50 border-b border-slate-200/80 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Sapaan Pengguna */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-bold border border-[#843bab]/20 mb-2.5">
                <GraduationCap size={13} />
                <span>Area Belajar Peserta</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight mb-2 leading-snug">
                Kursus Saya
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed">
                Halo, <span className="font-semibold text-slate-800">{userProfile.nama_lengkap}</span>! Pantau jadwal belajar, selesaikan modul kuis berstandar industri, dan dapatkan sertifikat kelulusan resmi.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/kursus"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#843bab]/30 bg-white hover:bg-purple-50 text-[#843bab] font-bold text-sm shadow-2xs hover:shadow-xs transition-all"
              >
                <BookOpen size={16} />
                <span>Jelajahi Katalog Kursus</span>
              </Link>
            </div>
          </div>

          {/* =========================================================
              NOTIFIKASI PINTAR & PENGINGAT PESERTA (In-App Smart Alerts)
             ========================================================= */}
          <div className="space-y-3 mt-6">
            {/* 1. Pengingat Batas Bayar Mendesak (< 6 Jam) */}
            {urgentPayments.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5">
                    <Clock size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>Batas Waktu Pembayaran Segera Berakhir</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                        Penting
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed mt-0.5">
                      Anda memiliki {urgentPayments.length} kursus (&quot;{urgentPayments.map((p) => p.kursus.judul).join(', ')}&quot;) dengan batas waktu pembayaran kurang dari 6 jam. Harap selesaikan pembayaran sebelum kuota kursi dibatalkan secara otomatis.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('menunggu_bayar');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <span>Bayar Sekarang</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* 2. Notifikasi Tugas Belajar (Resume Learning Nudge) */}
            {activeCourseWithNextTask && (
              <div className="p-4 rounded-2xl bg-white border border-[#843bab]/30 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 text-[#843bab] shrink-0 mt-0.5">
                    <Target size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">
                        Lanjutkan Penugasan Belajar
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#843bab] border border-purple-200">
                        Tugas Aktif
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                      Pada kursus <strong className="text-slate-900">{activeCourseWithNextTask.kursus.judul}</strong>: tugas Anda berikutnya adalah{' '}
                      <strong className="text-[#843bab]">
                        Modul {activeCourseWithNextTask.next_modul?.urutan}: {activeCourseWithNextTask.next_modul?.judul}
                      </strong>{' '}
                      ({activeCourseWithNextTask.next_modul?.is_read ? 'Kuis Evaluasi Menunggu Dikerjakan' : 'Pelajari Materi & Video'}).
                    </p>
                  </div>
                </div>
                <Link
                  href={`/belajar/${activeCourseWithNextTask.kursus.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs whitespace-nowrap shadow-xs hover:shadow-md transition-all shrink-0"
                >
                  <span>Kerjakan Tugas Sekarang</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* 3. Notifikasi Kelulusan & Sertifikat Siap Diunduh */}
            {!activeCourseWithNextTask && recentlyCompletedCourse && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">
                        Sertifikat Kompetensi Resmi Telah Terbit
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Lulus 100%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                      Selamat! Anda telah menuntaskan seluruh penugasan modul pada <strong className="text-slate-900">{recentlyCompletedCourse.kursus.judul}</strong>. Nomor Sertifikat: <strong className="font-mono text-[#843bab]">{recentlyCompletedCourse.sertifikat?.nomor_sertifikat}</strong>.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/sertifikat/${recentlyCompletedCourse.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs hover:shadow-md transition-all shrink-0"
                >
                  <span>Lihat & Cetak Sertifikat</span>
                  <Printer size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats Grid (Clickable to switch tab) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {/* Card 1: Total */}
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'semua'
                  ? 'bg-white border-[#843bab] ring-2 ring-[#843bab]/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kursus</span>
                <BookOpen size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Seluruh riwayat pendaftaran</div>
            </button>

            {/* Card 2: Aktif Belajar */}
            <button
              type="button"
              onClick={() => setActiveTab('aktif')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'aktif'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Aktif Belajar</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">{aktifCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Dapat diakses 24 jam</div>
            </button>

            {/* Card 3: Menunggu Bayar */}
            <button
              type="button"
              onClick={() => setActiveTab('menunggu_bayar')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'menunggu_bayar'
                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Bayar</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">{menungguCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Batas waktu 24 jam</div>
            </button>

            {/* Card 4: Selesai & Sertifikat */}
            <button
              type="button"
              onClick={() => setActiveTab('selesai')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'selesai'
                  ? 'bg-white border-[#843bab] ring-2 ring-[#843bab]/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#843bab] uppercase tracking-wider">Selesai & Lulus</span>
                <Award size={16} className="text-[#843bab]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#843bab]">{selesaiCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Sertifikat terbit</div>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. DAFTAR KURSUS PESERTA
         ========================================================= */}
      <section className="max-w-7xl mx-auto px-6 pt-6">
        {/* Success Alert */}
        {cancelSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{cancelSuccess}</span>
            </div>
            <button
              onClick={() => setCancelSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Info Pencarian / Filter Aktif */}
        {(searchQuery || activeTab !== 'semua') && (
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-2.5 border-b border-slate-200/60">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{filteredCourses.length}</span> kursus
              {searchQuery && (
                <> untuk pencarian "<span className="font-semibold text-slate-800">{searchQuery}</span>"</>
              )}
              {activeTab !== 'semua' && (
                <> pada filter <span className="font-semibold text-[#843bab] capitalize">{activeTab.replace('_', ' ')}</span></>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('semua');
                setSearchQuery('');
              }}
              className="text-[#843bab] hover:underline font-bold cursor-pointer"
            >
              Hapus Filter
            </button>
          </div>
        )}

        {/* =========================================================
            3. GRID KURSUS / EMPTY STATE
           ========================================================= */}
        {filteredCourses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#843bab]/10 text-[#843bab] flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchQuery
                ? 'Kursus Tidak Ditemukan'
                : activeTab === 'semua'
                ? 'Belum Ada Kursus yang Terdaftar'
                : 'Tidak Ada Kursus di Kategori Ini'}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Tidak ada kursus yang cocok dengan pencarian "${searchQuery}". Silakan coba kata kunci lain.`
                : activeTab === 'semua'
                ? 'Anda belum mendaftar kursus apapun. Temukan kurikulum vokasi praktis di katalog kursus kami.'
                : 'Tidak ada kursus yang sesuai dengan filter yang Anda pilih saat ini.'}
            </p>
            {activeTab !== 'semua' || searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('semua');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span>Reset Filter & Pencarian</span>
              </button>
            ) : (
              <Link
                href="/kursus"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs hover:shadow-md transition-all"
              >
                <span>Lihat Katalog Kursus</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          /* Grid of MyCourseCard */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((item) => (
              <MyCourseCard
                key={item.id}
                enrollment={item}
                onCancelRequest={handleOpenCancelModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================
          4. MODAL KONFIRMASI BATAL PENDAFTARAN (Unpaid Only)
         ========================================================= */}
      {cancelModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto sm:mx-0">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Batalkan Pendaftaran Kursus?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Anda akan membatalkan pendaftaran kursus{' '}
                <strong className="text-slate-900">"{selectedEnrollment.title}"</strong>.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
                Kursi Anda akan langsung dikembalikan ke kuota umum agar peserta lain dapat mendaftar.
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setCancelModalOpen(false);
                  setSelectedEnrollment(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size="xs" variant="white" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Ya, Batalkan Pendaftaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
