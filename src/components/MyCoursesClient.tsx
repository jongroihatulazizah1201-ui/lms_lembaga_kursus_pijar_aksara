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
  Compass,
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

  // Kalkulasi Skala Pengerjaan Penugasan Siswa (Modul & Kuis)
  const activeOrCompleted = initialCourses.filter((c) => c.status === 'aktif' || c.status === 'selesai');
  const totalTugasTerdaftar = activeOrCompleted.reduce((acc, c) => acc + (c.kursus.total_modul || 0), 0);
  const totalTugasLulus = activeOrCompleted.reduce((acc, c) => acc + (c.modul_lulus || 0), 0);
  const totalTugasPending = Math.max(0, totalTugasTerdaftar - totalTugasLulus);
  const totalDurasiSelesaiMenit = activeOrCompleted.reduce((acc, c) => acc + (c.durasi_selesai_menit || 0), 0);
  const totalDurasiSemuaMenit = activeOrCompleted.reduce((acc, c) => acc + (c.kursus.total_durasi_menit || 0), 0);
  const skalaPersen = totalTugasTerdaftar > 0 ? Math.min(100, Math.round((totalTugasLulus / totalTugasTerdaftar) * 100)) : 0;

  // Cari kursus aktif yang memiliki modul/tugas berikutnya untuk notifikasi ajakan belajar
  const activeCourseWithNextTask = initialCourses.find(
    (c) => c.status === 'aktif' && c.next_modul
  );

  // Cari kursus selesai terbaru yang sertifikatnya siap
  const recentlyCompletedCourse = initialCourses.find(
    (c) => c.status === 'selesai' && c.sertifikat?.nomor_sertifikat
  );

  // Inisial Peserta untuk Avatar
  const userInitials = (userProfile.nama_lengkap || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'P';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* =========================================================
          1. HEADER BANNER: Profil & Dashboard Siswa
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/80 via-white to-slate-50/50 border-b border-slate-200/80 pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-bold border border-[#843bab]/20 mb-2.5">
                <GraduationCap size={14} />
                <span>Dashboard &amp; Area Belajar Siswa</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Dashboard Belajar
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Halo, <span className="font-semibold text-slate-900">{userProfile.nama_lengkap}</span>! Pantau skala penyelesaian tugas kuis, pelajari kurikulum vokasi praktis, dan raih sertifikat kompetensi industri.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/kursus"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#843bab]/30 bg-white hover:bg-purple-50 text-[#843bab] font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all"
              >
                <BookOpen size={16} />
                <span>Jelajahi Katalog Kursus</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. WORKSPACE UTAMA: 2-KOLOM (SIDEBAR DASHBOARD + MAIN CONTENT)
         ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================
              KOLOM KIRI: SIDEBAR DASHBOARD SISWA (Sticky)
             ========================================================= */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            {/* CARD 1: PROFIL & SKALA PENUGASAN SISWA */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
              {/* Identitas Peserta */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#843bab] to-purple-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-extrabold text-slate-900 truncate">
                    {userProfile.nama_lengkap}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="truncate">{userProfile.email}</span>
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#843bab]/10 text-[#843bab] border border-[#843bab]/20">
                    Peserta Aktif
                  </span>
                </div>
              </div>

              {/* Garis Pemisah */}
              <div className="border-t border-slate-100" />

              {/* Skala Penugasan Belajar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <Compass size={15} className="text-[#843bab]" />
                    <span>Skala Penugasan Kursus</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-[#843bab]">
                    {skalaPersen}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 p-0.5 border border-slate-200/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#843bab] via-purple-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${skalaPersen}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  <strong className="text-slate-900 font-bold">{totalTugasLulus}</strong> dari{' '}
                  <strong className="text-slate-900 font-bold">{totalTugasTerdaftar}</strong> modul &amp; kuis telah diselesaikan.
                </div>

                {/* 4 Mini Cards Metrik Skala */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Lulus Kuis</div>
                    <div className="text-lg font-black text-emerald-600 mt-0.5">
                      {totalTugasLulus} <span className="text-xs font-normal text-emerald-800">Modul</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100/80">
                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Sisa Tugas</div>
                    <div className="text-lg font-black text-amber-600 mt-0.5">
                      {totalTugasPending} <span className="text-xs font-normal text-amber-800">Modul</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waktu Belajar</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      {totalDurasiSelesaiMenit} <span className="text-xs font-normal text-slate-500">mnt</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/80">
                    <div className="text-[10px] font-bold text-[#843bab] uppercase tracking-wider">Sertifikat</div>
                    <div className="text-lg font-black text-[#843bab] mt-0.5">
                      {selesaiCount} <span className="text-xs font-normal text-[#843bab]">Terbit</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  Ambang batas kelulusan kuis &ge; 80% (maks. 3 kali kesempatan). Sertifikat kompetensi terbit otomatis saat seluruh modul lulus.
                </p>
              </div>
            </div>

            {/* CARD 2: TUGAS SELANJUTNYA (UP NEXT ACTION NUDGE) */}
            {activeCourseWithNextTask && (
              <div className="bg-gradient-to-br from-purple-50/90 via-white to-purple-50/50 rounded-3xl border border-[#843bab]/30 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab]">
                    <Target size={14} className="text-[#843bab]" />
                    <span>Target Tugas Selanjutnya</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#843bab] text-white">
                    Siap Dikerjakan
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 truncate">
                    {activeCourseWithNextTask.kursus.judul}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                    Modul {activeCourseWithNextTask.next_modul?.urutan}: {activeCourseWithNextTask.next_modul?.judul}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white/80 border border-purple-100 rounded-xl px-3 py-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    activeCourseWithNextTask.next_modul?.is_read ? 'bg-amber-500' : 'bg-[#843bab]'
                  }`} />
                  <span>
                    {activeCourseWithNextTask.next_modul?.is_read
                      ? 'Kuis Evaluasi Menunggu Dikerjakan'
                      : 'Pelajari Materi & Video'}
                  </span>
                </div>

                <Link
                  href={`/belajar/${activeCourseWithNextTask.kursus.slug}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Kerjakan Tugas Sekarang</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* CARD 3: NAVIGASI FILTER STATUS KURSUS (Sidebar Filter List) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                Filter Kursus Saya
              </h3>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('semua')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'semua'
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} />
                    <span>Semua Kursus</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'semua' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {totalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('aktif')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'aktif'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={activeTab === 'aktif' ? 'text-white' : 'text-emerald-600'} />
                    <span>Aktif Belajar</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'aktif' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {aktifCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('menunggu_bayar')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'menunggu_bayar'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} className={activeTab === 'menunggu_bayar' ? 'text-slate-950' : 'text-amber-500'} />
                    <span>Menunggu Bayar</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'menunggu_bayar' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {menungguCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('selesai')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'selesai'
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Award size={14} className={activeTab === 'selesai' ? 'text-white' : 'text-[#843bab]'} />
                    <span>Selesai &amp; Lulus</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'selesai' ? 'bg-white/20 text-white' : 'bg-purple-50 text-[#843bab]'
                  }`}>
                    {selesaiCount}
                  </span>
                </button>

                {batalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('dibatalkan')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'dibatalkan'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <XCircle size={14} />
                      <span>Dibatalkan</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeTab === 'dibatalkan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {batalCount}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* =========================================================
              KOLOM KANAN: KONTEN KURSUS & FEED UTAMA
             ========================================================= */}
          <section className="lg:col-span-8 space-y-6">
            {/* NOTIFIKASI PINTAR (In-App Smart Alerts) */}
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

            {/* Notifikasi Kelulusan & Sertifikat Siap Diunduh */}
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
                  <span>Lihat &amp; Cetak Sertifikat</span>
                  <Printer size={14} />
                </Link>
              </div>
            )}

            {/* Alert Sukses Batal Pendaftaran */}
            {cancelSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{cancelSuccess}</span>
                </div>
                <button
                  onClick={() => setCancelSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* TOOLBAR PENCARIAN & STATUS FILTER */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari judul kursus atau instruktur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] focus:bg-white transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {(searchQuery || activeTab !== 'semua') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('semua');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <div>
                  Menampilkan <strong className="text-slate-800">{filteredCourses.length}</strong> kursus
                  {activeTab !== 'semua' && (
                    <> pada status <strong className="text-[#843bab] capitalize">{activeTab.replace('_', ' ')}</strong></>
                  )}
                  {searchQuery && (
                    <> untuk kata kunci &quot;<strong className="text-slate-800">{searchQuery}</strong>&quot;</>
                  )}
                </div>
              </div>
            </div>

            {/* GRID KURSUS / EMPTY STATE */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
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
                    <span>Reset Filter &amp; Pencarian</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </main>

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
