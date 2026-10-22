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
  Loader2,
  GraduationCap,
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* =========================================================
          1. HEADER BANNER: Profil & Ringkasan Statistik
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/80 via-white to-slate-50/50 border-b border-slate-200/80 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Sapaan Pengguna */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-bold border border-[#843bab]/20 mb-3">
                <GraduationCap size={14} />
                <span>Area Belajar Peserta</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Kursus Saya
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed">
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
          2. FILTER & DAFTAR KURSUS
         ========================================================= */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
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

        {/* Tab Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Tab Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'semua'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('aktif')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'aktif'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Aktif Belajar ({aktifCount})
            </button>
            <button
              onClick={() => setActiveTab('menunggu_bayar')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'menunggu_bayar'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Menunggu Bayar ({menungguCount})
            </button>
            <button
              onClick={() => setActiveTab('selesai')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'selesai'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Selesai & Lulus ({selesaiCount})
            </button>
            {batalCount > 0 && (
              <button
                onClick={() => setActiveTab('dibatalkan')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'dibatalkan'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Dibatalkan ({batalCount})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kursus atau instruktur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#843bab] focus:ring-1 focus:ring-[#843bab] shadow-2xs"
            />
          </div>
        </div>

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
                    <Loader2 size={14} className="animate-spin" />
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
