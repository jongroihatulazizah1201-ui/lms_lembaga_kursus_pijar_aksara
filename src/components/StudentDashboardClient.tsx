'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  BookCheck,
  TrendingUp,
} from 'lucide-react';
import { EnrollmentItem } from '@/components/MyCourseCard';

interface Props {
  initialCourses: EnrollmentItem[];
  userProfile: {
    nama_lengkap: string;
    email: string;
  };
}

export default function StudentDashboardClient({
  initialCourses,
  userProfile,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter status kursus
  const activeCourses = initialCourses.filter((c) => c.status === 'aktif');
  const completedCourses = initialCourses.filter((c) => c.status === 'selesai');
  const pendingCourses = initialCourses.filter((c) => c.status === 'menunggu_bayar');

  // 2. Akumulasi data agregat
  const totalCourses = initialCourses.length;

  const totalModulSemua = useMemo(() => {
    return initialCourses.reduce((acc, c) => acc + (c.kursus.total_modul || 0), 0);
  }, [initialCourses]);

  const totalModulLulus = useMemo(() => {
    return initialCourses.reduce((acc, c) => acc + (c.modul_lulus || 0), 0);
  }, [initialCourses]);

  const totalModulBelum = Math.max(0, totalModulSemua - totalModulLulus);

  const overallProgress = useMemo(() => {
    if (totalModulSemua === 0) return 0;
    return Math.min(100, Math.round((totalModulLulus / totalModulSemua) * 100));
  }, [totalModulSemua, totalModulLulus]);

  // Kursus yang difilter oleh input pencarian
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return initialCourses;
    const q = searchQuery.toLowerCase();
    return initialCourses.filter(
      (c) =>
        c.kursus.judul.toLowerCase().includes(q) ||
        c.kursus.kategori.toLowerCase().includes(q) ||
        c.kursus.instruktur_nama.toLowerCase().includes(q)
    );
  }, [initialCourses, searchQuery]);

  // Visual Donut Chart SVG calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-20 select-text">
      {/* =========================================================
          1. TOP APP BAR: PENGUMUMAN PANDUAN & QUICK NAV
         ========================================================= */}
      <nav className="sticky top-[57px] lg:top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#843bab] font-bold border border-purple-200/80 shrink-0">
              <GraduationCap size={14} className="text-[#843bab]" />
              <span>Pusat Belajar Vokasi</span>
            </span>
            <span className="text-slate-500 hidden md:inline truncate">
              Pedoman kelulusan kuis, alur sekuensial, dan sertifikat resmi tersedia di halaman aturan.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
            <Link
              href="/aturan-belajar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/90 hover:bg-purple-100 text-[#843bab] border border-purple-200 transition-colors"
            >
              <BookCheck size={14} />
              <span>Aturan &amp; Pedoman Kursus</span>
            </Link>
            <Link
              href="/kursus-saya"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
            >
              <GraduationCap size={14} />
              <span>Kursus Saya</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================
          2. HERO GREETING & SEARCH (MIRRORING DRIBBLE REFERENCE)
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/80 via-white to-slate-50/50 border-b border-slate-200/80 pt-7 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Halo, {userProfile.nama_lengkap || 'Peserta'}! 👋
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
                Pantau ringkasan aktivitas belajar, progres penugasan modul vokasi, dan pencapaian kompetensi Anda secara real-time.
              </p>
            </div>

            {/* Pencarian & Tombol Aksi Cepat */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative min-w-[240px] sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari program belajar..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all shadow-2xs"
                />
              </div>

              <Link
                href="/kursus"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
              >
                <BookOpen size={14} />
                <span>Katalog Kursus</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. MAIN COCKPIT DASHBOARD (INSPIRED BY REFERENCE)
         ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 space-y-6">
        {/* =========================================================
            BARIS 1: ACTIVE LEARNING PROGRAMS (KIRI) & GROW STATUS (KANAN)
           ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KARTU KIRI: PROGRAM BELAJAR AKTIF (7 COLS) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Program Belajar Aktif
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-400">
                  ({filteredCourses.length})
                </span>
              </div>

              <Link
                href="/kursus-saya"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#843bab] hover:underline"
              >
                <span>Kelola Kursus</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* List Program Belajar */}
            {filteredCourses.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Kursus</th>
                      <th className="pb-3 font-semibold text-center hidden sm:table-cell">Modul</th>
                      <th className="pb-3 font-semibold">Progres</th>
                      <th className="pb-3 font-semibold hidden md:table-cell">Status / Target</th>
                      <th className="pb-3 font-semibold text-right">Skor Kuis</th>
                      <th className="pb-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {filteredCourses.map((c) => {
                      const courseProgress =
                        c.kursus.total_modul > 0
                          ? Math.round((c.modul_lulus / c.kursus.total_modul) * 100)
                          : 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Nama Kursus */}
                          <td className="py-3.5 pr-3 max-w-[180px] sm:max-w-[200px]">
                            <div className="font-bold text-slate-900 truncate">
                              {c.kursus.judul}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                {c.kursus.kategori}
                              </span>
                              <span>&bull;</span>
                              <span className="truncate">{c.kursus.instruktur_nama}</span>
                            </div>
                          </td>

                          {/* Modul Tuntas */}
                          <td className="py-3.5 px-2 text-center hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                              {c.modul_lulus}/{c.kursus.total_modul}
                            </span>
                          </td>

                          {/* Progres Bar */}
                          <td className="py-3.5 px-2 min-w-[110px]">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                <span>{courseProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    courseProgress === 100
                                      ? 'bg-emerald-500'
                                      : 'bg-[#843bab]'
                                  }`}
                                  style={{ width: `${courseProgress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status / Target */}
                          <td className="py-3.5 px-2 hidden md:table-cell">
                            {c.status === 'aktif' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aktif Belajar
                              </span>
                            ) : c.status === 'selesai' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#843bab] border border-purple-200">
                                <Award size={11} />
                                Lulus 100%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={11} />
                                Menunggu Bayar
                              </span>
                            )}
                          </td>

                          {/* Skor Kuis */}
                          <td className="py-3.5 px-2 text-right">
                            {c.nilai_kuis_terbaik !== null && c.nilai_kuis_terbaik !== undefined ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                  c.nilai_kuis_terbaik >= 85
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : c.nilai_kuis_terbaik >= 70
                                    ? 'bg-purple-50 text-[#843bab]'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                <span>⭐ {c.nilai_kuis_terbaik}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium">-</span>
                            )}
                          </td>

                          {/* Tombol Aksi */}
                          <td className="py-3.5 pl-2 text-right">
                            {c.status === 'aktif' ? (
                              <Link
                                href={`/belajar/${c.kursus.slug}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-[11px] transition-colors"
                              >
                                <span>Lanjut</span>
                                <ArrowRight size={11} />
                              </Link>
                            ) : c.status === 'selesai' ? (
                              <Link
                                href={`/sertifikat/${c.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                              >
                                <span>Sertifikat</span>
                                <ExternalLink size={10} />
                              </Link>
                            ) : (
                              <Link
                                href={`/kursus-saya/${c.id}/bayar`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                              >
                                <span>Bayar</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty state jika belum ada kursus */
              <div className="py-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen size={28} className="mx-auto text-slate-400" />
                <div className="font-bold text-slate-800 text-sm">
                  Belum Ada Program Belajar yang Aktif
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Daftarkan diri Anda pada kursus bersertifikasi resmi Lembaga Kursus Pijar Aksara untuk memulai penugasan modul.
                </p>
                <Link
                  href="/kursus"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs transition-all"
                >
                  <span>Jelajahi Katalog Kursus</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* KARTU KANAN: IKHTISAR STATUS BELAJAR / GROW STATUS OVERVIEW (5 COLS) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                Ikhtisar Status Belajar
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {totalCourses} Kursus Terdaftar
              </span>
            </div>

            {/* Donut Chart & Legend Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              {/* Donut Visual SVG */}
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-100"
                    fill="transparent"
                  />
                  {/* Progress Fill */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-[#843bab] transition-all duration-700 ease-out"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900">
                    {overallProgress}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ketuntasan
                  </span>
                </div>
              </div>

              {/* Legend List Status */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#843bab]" />
                    <span className="font-semibold text-slate-700">Modul Kompeten</span>
                  </div>
                  <span className="font-bold text-[#843bab]">{totalModulLulus}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="font-semibold text-slate-700">Sisa Modul</span>
                  </div>
                  <span className="font-bold text-slate-800">{totalModulBelum}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">Kursus Aktif</span>
                  </div>
                  <span className="font-bold text-emerald-800">{activeCourses.length}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700">Sertifikat Resmi</span>
                  </div>
                  <span className="font-bold text-amber-800">{completedCourses.length}</span>
                </div>
              </div>
            </div>

            {/* Slider / Range Indicator */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Total Modul Terdaftar:</span>
                <span className="text-slate-900">{totalModulSemua} Modul</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#843bab] to-emerald-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            BARIS 2: 2 KARTU SEJAJAR (PERFORMA KUIS & SKALA KELULUSAN)
           ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KARTU 1: PERFORMA BELAJAR PER KURSUS */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#843bab]" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Performa Kuis &amp; Modul
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                KKM &ge; 70
              </span>
            </div>

            {/* Bar Performa per Kursus */}
            {initialCourses.length > 0 ? (
              <div className="space-y-4 flex-1">
                {initialCourses.slice(0, 5).map((c) => {
                  const score = c.nilai_kuis_terbaik ?? (c.modul_lulus > 0 ? 75 : 0);
                  const isPassed = score >= 70;

                  return (
                    <div key={c.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 truncate max-w-[220px] sm:max-w-[280px]">
                          {c.kursus.judul}
                        </span>
                        <span className="font-black text-slate-900">
                          {c.nilai_kuis_terbaik !== null
                            ? `${c.nilai_kuis_terbaik}/100`
                            : `${c.modul_lulus}/${c.kursus.total_modul} Modul`}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPassed ? 'bg-amber-400' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada data penilaian kuis
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
              Kuis evaluasi dirancang berstandar industri vokasi dengan batas maksimal 3 kali percobaan untuk mencapai KKM kelulusan.
            </div>
          </div>

          {/* KARTU 2: SKALA KELULUSAN MODUL (PRIMARY GRADIENT CARD) */}
          <div className="bg-gradient-to-br from-[#843bab] via-[#722f96] to-purple-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between text-xs text-purple-200 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-white" />
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  Skala Kelulusan Modul
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white font-bold text-[10px]">
                Kurikulum Vokasi
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="text-4xl sm:text-5xl font-black">{overallProgress}%</div>
                <div className="text-xs sm:text-sm text-purple-100 font-semibold">
                  {totalModulLulus} dari {totalModulSemua} Modul Selesai
                </div>
              </div>

              {/* Progress Slider */}
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Grid Ringkasan Metrik */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
                <div className="text-[10px] uppercase font-bold text-purple-200">
                  Modul Kompeten
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {totalModulLulus} Modul
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
                <div className="text-[10px] uppercase font-bold text-purple-200">
                  Sertifikat Resmi
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {completedCourses.length} Terbit
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-200 pt-1 border-t border-white/10">
              <span>Sisa modul yang belum tuntas:</span>
              <span className="font-bold text-white">{totalModulBelum} Modul</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            CALLOUT BANNER: RUJUKAN ATURAN & PEDOMAN BELAJAR
           ========================================================= */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border border-purple-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#843bab] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <BookCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Butuh Informasi Aturan Kuis, Alur Modul, atau Sertifikat?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pelajari standar KKM kelulusan kuis, alur sekuensial, masa pembayaran 24 jam, dan tanya jawab di halaman panduan.
              </p>
            </div>
          </div>

          <Link
            href="/aturan-belajar"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <span>Buka Aturan &amp; Pedoman</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
