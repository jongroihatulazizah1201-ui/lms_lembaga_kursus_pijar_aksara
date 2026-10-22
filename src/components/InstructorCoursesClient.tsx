'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatRupiah } from './CourseCard';
import CourseStatusBadge from './CourseStatusBadge';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  ArrowRight,
  Send,
  Lock,
  RotateCcw,
  Search,
  HelpCircle,
  Layers,
} from 'lucide-react';

export interface InstructorCourseItem {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  harga: number;
  kuota: number;
  nilai_lulus: number;
  status: string;
  catatan_tinjauan: string | null;
  diajukan_pada: string | null;
  diterbitkan_pada: string | null;
  dibuat_pada: string;
  total_modul: number;
  total_soal: number;
  peserta_count: number;
}

interface Props {
  initialCourses: InstructorCourseItem[];
  profile: {
    nama_lengkap: string;
    email?: string;
  };
}

type FilterTab = 'semua' | 'draf' | 'diajukan' | 'terbit' | 'revisi';

export default function InstructorCoursesClient({ initialCourses, profile }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Hitung jumlah statistik
  const totalCount = initialCourses.length;
  const drafCount = initialCourses.filter((c) => c.status === 'draf').length;
  const diajukanCount = initialCourses.filter((c) => c.status === 'diajukan' || c.status === 'ditinjau').length;
  const terbitCount = initialCourses.filter((c) => c.status === 'terbit').length;
  const revisiCount = initialCourses.filter(
    (c) => !!c.catatan_tinjauan && (c.status === 'draf' || c.status === 'ditolak')
  ).length;

  // Filter kursus berdasarkan Tab dan Search
  const filteredCourses = initialCourses.filter((course) => {
    // 1. Filter Tab
    let matchesTab = true;
    if (activeTab === 'draf') matchesTab = course.status === 'draf';
    else if (activeTab === 'diajukan') matchesTab = course.status === 'diajukan' || course.status === 'ditinjau';
    else if (activeTab === 'terbit') matchesTab = course.status === 'terbit';
    else if (activeTab === 'revisi')
      matchesTab = !!course.catatan_tinjauan && (course.status === 'draf' || course.status === 'ditolak');

    // 2. Filter Search Query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      course.judul.toLowerCase().includes(q) ||
      course.kategori.toLowerCase().includes(q) ||
      course.slug.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 text-slate-900">
      {/* =========================================================
          STICKY SEARCH & FAST FILTER TOOLBAR (Berada di Atas & Stay Saat Di-scroll)
         ========================================================= */}
      <section
        aria-label="Pencarian dan Filter Kursus Instruktur"
        className="sticky top-[57px] lg:top-0 z-20 bg-white/95 backdrop-blur-md pt-3.5 pb-3 border-b border-slate-200/80 shadow-xs transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Box: Cari judul atau kategori... */}
            <div className="relative flex-1 w-full max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari judul atau kategori..."
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

            {/* Quick Status Tabs */}
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
                onClick={() => setActiveTab('draf')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'draf'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Draf ({drafCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diajukan')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'diajukan'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Sedang Ditinjau ({diajukanCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terbit')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'terbit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Terbit ({terbitCount})
              </button>
              {revisiCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('revisi')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'revisi'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-red-700 hover:text-red-900 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Catatan Revisi ({revisiCount})
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
          1. HEADER BANNER: Profil Instruktur & Quick Stats
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50/50 border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] uppercase tracking-wider border border-[#843bab]/20">
                  <BookOpen size={13} />
                  <span>Panel Instruktur</span>
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Selamat Datang, <strong className="font-bold text-slate-900">{profile.nama_lengkap || 'Instruktur'}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Kelola Kursus &amp; Silabus
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Kelola kursus milik sendiri, susun kurikulum modul bertahap, materi bacaan &amp; video, bank soal kuis, serta pantau catatan tinjauan dari admin lembaga.
              </p>
            </div>

            {/* Tombol Buat Kursus Baru */}
            <Link
              href="/instruktur/kursus/baru"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-950 font-bold text-sm shadow-xs hover:shadow-md transition-all shrink-0 min-h-[48px] active:scale-[0.99]"
            >
              <Plus size={18} />
              <span>Buat Kursus Baru</span>
            </Link>
          </div>

          {/* Quick Stats Grid (Clickable to switch tab) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {/* Card 1: Total Kursus */}
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
              <div className="text-[11px] text-slate-500 mt-1">Seluruh kursus Anda</div>
            </button>

            {/* Card 2: Terbit & Publik */}
            <button
              type="button"
              onClick={() => setActiveTab('terbit')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'terbit'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Terbit / Publik</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">{terbitCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Tersedia di katalog</div>
            </button>

            {/* Card 3: Menunggu Review */}
            <button
              type="button"
              onClick={() => setActiveTab('diajukan')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'diajukan'
                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Sedang Ditinjau</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">{diajukanCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Menunggu evaluasi admin</div>
            </button>

            {/* Card 4: Draf & Perlu Perbaikan */}
            <button
              type="button"
              onClick={() => setActiveTab('revisi')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'revisi'
                  ? 'bg-white border-red-500 ring-2 ring-red-500/20 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Perlu Perbaikan</span>
                <RotateCcw size={16} className="text-red-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-red-600">{revisiCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Ada catatan revisi admin</div>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. DAFTAR KURSUS INSTRUKTUR
         ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Info Filter Aktif */}
        {(searchQuery || activeTab !== 'semua') && (
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-2.5 border-b border-slate-200/60">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{filteredCourses.length}</span> kursus
              {searchQuery && (
                <> untuk pencarian "<span className="font-semibold text-slate-800">{searchQuery}</span>"</>
              )}
              {activeTab !== 'semua' && (
                <> pada filter <span className="font-semibold text-[#843bab] capitalize">{activeTab}</span></>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs my-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#843bab]/10 text-[#843bab] flex items-center justify-center mx-auto">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {searchQuery
                ? 'Kursus Tidak Ditemukan'
                : activeTab === 'semua'
                ? 'Belum Ada Kursus yang Dibuat'
                : 'Tidak Ada Kursus di Tab Ini'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `Tidak ada kursus yang cocok dengan pencarian "${searchQuery}". Coba kata kunci lain.`
                : activeTab === 'semua'
                ? 'Mulai bagikan keahlian Anda dengan menyusun materi kursus berkualitas berstandar industri.'
                : 'Tidak ada kursus yang sesuai dengan kategori filter yang sedang aktif.'}
            </p>
            {activeTab !== 'semua' || searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('semua');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Reset Filter
              </button>
            ) : (
              <Link
                href="/instruktur/kursus/baru"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 font-bold text-xs shadow-xs transition-all min-h-[44px]"
              >
                <Plus size={16} />
                <span>Buat Kursus Pertama Anda</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isLocked = course.status !== 'draf';
              const hasMinModules = course.total_modul >= 2 && course.total_modul <= 10;
              const hasMinQuestions = course.total_soal >= course.total_modul * 3 && course.total_modul >= 2;
              const isReadyToSubmit = course.status === 'draf' && hasMinModules && hasMinQuestions;

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-5 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="space-y-4">
                    {/* Badge Status & Kategori */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold text-[#843bab] uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#843bab]/10 border border-[#843bab]/20">
                        {course.kategori}
                      </span>
                      <CourseStatusBadge status={course.status} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                      {course.judul}
                    </h3>

                    {/* Harga & Kuota */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span>
                        Harga:{' '}
                        <strong className="text-slate-900">
                          {course.harga === 0 ? 'Gratis' : formatRupiah(course.harga)}
                        </strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span>
                        Kuota:{' '}
                        <strong className="text-slate-900">{course.kuota} Kursi</strong>
                      </span>
                    </div>

                    {/* Modul & Soal Counter (BR-03 Checklist Summary) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-3 text-center divide-x divide-slate-200">
                      <div className="px-1">
                        <div
                          className={`text-base font-extrabold ${
                            hasMinModules ? 'text-emerald-700' : 'text-amber-600'
                          }`}
                        >
                          {course.total_modul}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Modul (2-10)</div>
                      </div>
                      <div className="px-1">
                        <div
                          className={`text-base font-extrabold ${
                            hasMinQuestions ? 'text-[#843bab]' : 'text-slate-700'
                          }`}
                        >
                          {course.total_soal}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Total Soal</div>
                      </div>
                      <div className="px-1">
                        <div className="text-base font-extrabold text-slate-800">
                          {course.peserta_count}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Peserta Aktif</div>
                      </div>
                    </div>

                    {/* =========================================================
                        CATATAN PENGEMBALIAN DARI ADMIN
                       ========================================================= */}
                    {course.catatan_tinjauan && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                          <RotateCcw size={15} className="text-amber-700 shrink-0" />
                          <span>Catatan Perbaikan dari Admin:</span>
                        </div>
                        <p className="italic text-slate-800 leading-relaxed pl-5 font-normal">
                          &ldquo;{course.catatan_tinjauan}&rdquo;
                        </p>
                        <div className="text-[11px] text-amber-800 pl-5 font-medium">
                          Silakan perbaiki modul / butir soal, kemudian ajukan kembali kursus ini.
                        </div>
                      </div>
                    )}

                    {/* Konten Terkunci Info (BR-04) */}
                    {isLocked && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                        <Lock size={13} className="text-slate-400 shrink-0" />
                        <span>Materi terkunci selama masa peninjauan / terbit</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    {/* Tombol Ajukan Cepat Jika Siap */}
                    {isReadyToSubmit && (
                      <Link
                        href={`/instruktur/kursus/${course.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <Send size={13} />
                        <span>Siap Diajukan ke Admin</span>
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/instruktur/kursus/${course.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors min-h-[42px]"
                      >
                        <Layers size={14} />
                        <span>{isLocked ? 'Lihat Silabus' : 'Edit Kursus & Soal'}</span>
                      </Link>

                      <Link
                        href={`/instruktur/nilai?kursus=${course.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-xs font-bold text-[#843bab] transition-colors min-h-[42px]"
                      >
                        <Users size={14} />
                        <span>Peserta &amp; Nilai</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
