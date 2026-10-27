'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Phone,
  Mail,
  Download,
  Printer,
  Eye,
  X,
  ExternalLink,
  BookOpen,
  TrendingUp,
  Copy,
  Check,
  RotateCcw,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

export interface ModuleItem {
  id: string;
  urutan: number;
  judul: string;
}

export interface ParticipantModuleScore {
  modul_id: string;
  urutan: number;
  lulus: boolean;
  nilai_terbaik: number | null;
  jumlah_percobaan: number;
}

export interface ParticipantData {
  pendaftaran_id: string;
  peserta_id: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  status_pendaftaran: string;
  didaftarkan_pada: string;
  modul_lulus_count: number;
  nilai_per_modul: ParticipantModuleScore[];
}

export interface GradebookData {
  kursus_id: string;
  judul_kursus: string;
  slug: string;
  kategori: string;
  modul: ModuleItem[];
  peserta: ParticipantData[];
}

export interface CourseSummary {
  id: string;
  judul: string;
  slug?: string;
  status: string;
  kategori?: string;
  instruktur_nama?: string | null;
}

interface Props {
  initialData: GradebookData;
  instructorCourses: CourseSummary[];
  currentUser: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: 'instruktur' | 'admin';
  };
}

export default function InstructorGradebook({
  initialData,
  instructorCourses,
  currentUser,
}: Props) {
  const router = useRouter();

  // State pencarian, filter, dan sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [progresFilter, setProgresFilter] = useState('semua');
  const [sortBy, setSortBy] = useState<'terbaru' | 'nama' | 'progres-tinggi' | 'progres-rendah'>('terbaru');
  
  // State modal detail peserta
  const [selectedStudent, setSelectedStudent] = useState<ParticipantData | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const { modul, peserta, judul_kursus, kursus_id, slug, kategori } = initialData;
  const totalModul = modul?.length || 0;

  // Handler ganti kursus
  const handleSelectCourse = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/instruktur/nilai?kursus=${e.target.value}`);
  };

  // Salin email ke clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Statistik Ringkasan Kursus
  const totalPeserta = peserta.length;
  const pesertaAktif = peserta.filter((p) => p.status_pendaftaran === 'aktif').length;
  const pesertaSelesai = peserta.filter((p) => p.status_pendaftaran === 'selesai').length;
  const pesertaMenunggu = peserta.filter((p) => p.status_pendaftaran === 'menunggu_bayar').length;

  const totalModulTuntasCount = peserta.reduce((acc, curr) => acc + (curr.modul_lulus_count || 0), 0);
  const rataRataProgres = totalPeserta > 0 && totalModul > 0
    ? Math.round((totalModulTuntasCount / (totalPeserta * totalModul)) * 100)
    : 0;

  // Filter & Sort Peserta
  const filteredParticipants = useMemo(() => {
    return peserta
      .filter((p) => {
        // 1. Search Query (nama, email, no_hp)
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.nama_lengkap.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.no_hp && p.no_hp.toLowerCase().includes(q));

        // 2. Status Filter
        const matchesStatus =
          statusFilter === 'semua' || p.status_pendaftaran === statusFilter;

        // 3. Progres Filter
        let matchesProgres = true;
        const percent = totalModul > 0 ? (p.modul_lulus_count / totalModul) * 100 : 0;
        if (progresFilter === 'tuntas') matchesProgres = percent >= 100;
        else if (progresFilter === 'berjalan') matchesProgres = percent > 0 && percent < 100;
        else if (progresFilter === 'belum_mulai') matchesProgres = percent === 0;

        return matchesSearch && matchesStatus && matchesProgres;
      })
      .sort((a, b) => {
        if (sortBy === 'nama') {
          return a.nama_lengkap.localeCompare(b.nama_lengkap);
        }
        if (sortBy === 'progres-tinggi') {
          return b.modul_lulus_count - a.modul_lulus_count;
        }
        if (sortBy === 'progres-rendah') {
          return a.modul_lulus_count - b.modul_lulus_count;
        }
        // default 'terbaru': berdasarkan tanggal pendaftaran descending
        return new Date(b.didaftarkan_pada).getTime() - new Date(a.didaftarkan_pada).getTime();
      });
  }, [peserta, searchQuery, statusFilter, progresFilter, sortBy, totalModul]);

  // Ekspor ke format CSV untuk pelaporan / akreditasi
  const handleExportCSV = () => {
    if (peserta.length === 0) {
      alert('Tidak ada data peserta untuk diekspor.');
      return;
    }

    // Header CSV
    const headers = [
      'No',
      'Nama Peserta',
      'Email',
      'Nomor HP',
      'Status Pendaftaran',
      'Tanggal Daftar',
      'Modul Lulus',
      'Total Modul',
      'Progres (%)',
      ...modul.map((m) => `Modul ${m.urutan} (${m.judul.replace(/,/g, '')}) - Nilai Terbaik`),
      ...modul.map((m) => `Modul ${m.urutan} (${m.judul.replace(/,/g, '')}) - Percobaan`),
    ];

    // Baris Data CSV
    const rows = filteredParticipants.map((p, idx) => {
      const progresPct = totalModul > 0 ? Math.round((p.modul_lulus_count / totalModul) * 100) : 0;
      
      const moduleScores = modul.map((m) => {
        const sc = p.nilai_per_modul?.find((score) => score.modul_id === m.id);
        return sc && sc.nilai_terbaik !== null ? sc.nilai_terbaik : '-';
      });

      const moduleAttempts = modul.map((m) => {
        const sc = p.nilai_per_modul?.find((score) => score.modul_id === m.id);
        return sc ? `${sc.jumlah_percobaan}x` : '0x';
      });

      return [
        idx + 1,
        `"${p.nama_lengkap.replace(/"/g, '""')}"`,
        `"${p.email}"`,
        `"${p.no_hp || '-'}"`,
        p.status_pendaftaran,
        new Date(p.didaftarkan_pada).toLocaleDateString('id-ID'),
        p.modul_lulus_count,
        totalModul,
        `${progresPct}%`,
        ...moduleScores,
        ...moduleAttempts,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Rekap_Nilai_${judul_kursus.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cetak dokumen rekap
  const handlePrint = () => {
    window.print();
  };

  // Badge Status Pendaftaran
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif Belajar
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
            <Award size={12} className="text-[#843bab]" />
            Selesai / Lulus
          </span>
        );
      case 'menunggu_bayar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Menunggu Bayar
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} />
            Dibatalkan
          </span>
        );
      case 'kedaluwarsa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28 text-slate-900 print:bg-white print:p-0">
      {/* =========================================================================
          1. PRINT ONLY HEADER (Muncul saat dicetak ke PDF / Printer)
         ========================================================================= */}
      <div className="hidden print:block max-w-7xl mx-auto p-8 border-b-2 border-slate-800 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Lembaga Kursus Pijar Aksara
            </h1>
            <p className="text-sm text-slate-600">
              Laporan Rekapitulasi Peserta & Nilai Kuis Vokasi
            </p>
            <div className="mt-3 text-xs text-slate-700 space-y-1">
              <div><strong>Kursus:</strong> {judul_kursus} ({kategori})</div>
              <div><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Dicetak oleh: {currentUser.nama_lengkap}</div>
            <div>Peran: {currentUser.peran.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. STICKY TOP TOOLBAR: Search, Filter, Pemilih Kursus, & Aksi Ekspor (Stay di Atas Tanpa Celah)
         ========================================================================= */}
      <header className="sticky top-[56px] lg:top-0 z-30 w-full bg-white border-b border-slate-200 shadow-xs transition-all print:hidden before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search & Filter Controls: Cari, Status, Progres, Urutkan */}
            <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama peserta, email, atau no HP..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 focus:border-[#843bab] focus:bg-white transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {/* Filter Status */}
                <div className="relative shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 cursor-pointer shadow-2xs"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="aktif">Aktif Belajar</option>
                    <option value="selesai">Selesai / Lulus</option>
                    <option value="menunggu_bayar">Menunggu Bayar</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Filter Progres */}
                <div className="relative shrink-0">
                  <select
                    value={progresFilter}
                    onChange={(e) => setProgresFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 cursor-pointer shadow-2xs"
                  >
                    <option value="semua">Semua Progres</option>
                    <option value="tuntas">Tuntas (100%)</option>
                    <option value="berjalan">Sedang Belajar (1-99%)</option>
                    <option value="belum_mulai">Belum Mulai (0%)</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Sorting */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 cursor-pointer shadow-2xs"
                  >
                    <option value="terbaru">Terbaru Terdaftar</option>
                    <option value="nama">Nama (A-Z)</option>
                    <option value="progres-tinggi">Progres Tertinggi</option>
                    <option value="progres-rendah">Progres Terendah</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Reset Filter Button */}
                {(searchQuery || statusFilter !== 'semua' || progresFilter !== 'semua' || sortBy !== 'terbaru') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('semua');
                      setProgresFilter('semua');
                      setSortBy('terbaru');
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 transition-colors cursor-pointer shrink-0"
                    title="Reset Filter & Pencarian"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Pemilih Kursus Aktif, Unduh CSV, & Cetak (Sejajar di Atas) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <BookOpen size={15} className="text-[#843bab] shrink-0" />
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap hidden sm:inline">
                  Pilih Kursus Aktif:
                </span>
              </div>

              {/* Dropdown Pemilih Kursus */}
              <div className="relative min-w-[200px] sm:min-w-[240px] lg:min-w-[270px] max-w-xs">
                <select
                  value={kursus_id}
                  onChange={handleSelectCourse}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-300 text-slate-900 font-bold text-xs shadow-2xs hover:border-[#843bab] focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 focus:border-[#843bab] focus:bg-white transition-all cursor-pointer truncate"
                  title="Pilih Kursus Aktif"
                >
                  {instructorCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.judul} {c.instruktur_nama && currentUser.peran === 'admin' ? `(Instruktur: ${c.instruktur_nama})` : ''} [{c.status}]
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Tombol Unduh CSV & Cetak */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
                  title="Unduh format spreadsheet CSV"
                >
                  <FileSpreadsheet size={15} />
                  <span>Unduh CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
                  title="Cetak lembar rekapitulasi"
                >
                  <Printer size={15} />
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN WORKSPACE CONTENT
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* =======================================================================
            1. BANNER INFORMASI HALAMAN (Bisa di-scroll, tidak stay)
           ======================================================================= */}
        <section aria-label="Informasi Buku Nilai" className="space-y-1.5 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ffdf0f]/30 text-amber-900 uppercase tracking-wider border border-amber-300/40">
              Buku Nilai &amp; Peserta
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Peserta dan Nilai Kuis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Tabel rekapitulasi peserta aktif per kursus: memantau progres belajar, nilai kuis terbaik, dan jumlah percobaan per modul kuis vokasi.
          </p>
        </section>

        {/* =======================================================================
            2. KARTU RINGKASAN METRIK (KPI CARDS)
           ======================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:grid-cols-4 print:gap-2">
          {/* Total Peserta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Pendaftar
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalPeserta}</div>
            <div className="text-xs text-slate-500 mt-1">
              {pesertaMenunggu > 0 ? `${pesertaMenunggu} menunggu bayar` : 'Semua pendaftar'}
            </div>
          </div>

          {/* Peserta Aktif Belajar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aktif Belajar
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600">{pesertaAktif}</div>
            <div className="text-xs text-slate-500 mt-1">
              Sedang menempuh modul kuis
            </div>
          </div>

          {/* Peserta Selesai / Lulus */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Telah Lulus
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843bab] flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-[#843bab]">{pesertaSelesai}</div>
            <div className="text-xs text-slate-500 mt-1">
              Sertifikat kompetensi terbit
            </div>
          </div>

          {/* Rata-Rata Progres Belajar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rata-rata Progres
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{rataRataProgres}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#843bab] to-purple-500 rounded-full"
                style={{ width: `${rataRataProgres}%` }}
              />
            </div>
          </div>
        </div>


        {/* =======================================================================
            5. TABEL UTAMA: PESERTA & NILAI KUIS PER MODUL (The Core Table)
           ======================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                Daftar Peserta Kursus
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#843bab]/10 text-[#843bab]">
                {filteredParticipants.length} Peserta
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Lulus (≥ 70)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Belum Lulus (&lt; 70)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Belum Kuis
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Peserta</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Email & Kontak</th>
                  <th className="py-3.5 px-4 text-center min-w-[140px]">Status</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Progres Belajar</th>

                  {/* Dynamic Headers: Nilai Terbaik & Percobaan per Modul */}
                  {modul.map((m) => (
                    <th
                      key={m.id}
                      className="py-3.5 px-3 text-center min-w-[130px] border-l border-slate-200/60"
                      title={`Modul ${m.urutan}: ${m.judul}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[#843bab] font-black">
                          Modul {m.urutan}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal max-w-[110px] truncate">
                          {m.judul}
                        </span>
                      </div>
                    </th>
                  ))}

                  <th className="py-3.5 px-4 text-center min-w-[90px] print:hidden">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6 + totalModul}
                      className="py-16 text-center text-slate-500"
                    >
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Users size={24} />
                        </div>
                        <div className="font-bold text-slate-800 text-base">
                          Tidak Ada Peserta Ditemukan
                        </div>
                        <p className="text-xs text-slate-500">
                          {searchQuery || statusFilter !== 'semua' || progresFilter !== 'semua'
                            ? 'Tidak ada peserta yang cocok dengan filter saat ini. Silakan reset filter pencarian Anda.'
                            : 'Belum ada peserta yang mendaftar pada kursus ini.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => {
                    const progresPct =
                      totalModul > 0
                        ? Math.round((p.modul_lulus_count / totalModul) * 100)
                        : 0;

                    const avatarLetter = p.nama_lengkap.charAt(0).toUpperCase();

                    return (
                      <tr
                        key={p.pendaftaran_id}
                        className="hover:bg-purple-50/20 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-4 px-4 text-center text-xs text-slate-400 font-semibold">
                          {idx + 1}
                        </td>

                        {/* Nama Peserta */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#843bab] to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                              {avatarLetter}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-[#843bab] transition-colors">
                                {p.nama_lengkap}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Terdaftar: {new Date(p.didaftarkan_pada).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Kontak */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{p.email}</span>
                              <button
                                onClick={() => handleCopyEmail(p.email)}
                                className="p-1 text-slate-400 hover:text-[#843bab] rounded transition-colors"
                                title="Salin email"
                              >
                                {copiedEmail === p.email ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            {p.no_hp && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Phone size={12} className="text-slate-400 shrink-0" />
                                <span>{p.no_hp}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Pendaftaran */}
                        <td className="py-4 px-4 text-center">
                          {renderStatusBadge(p.status_pendaftaran)}
                        </td>

                        {/* Progres Belajar */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">
                                {p.modul_lulus_count}/{totalModul} Modul
                              </span>
                              <span
                                className={`font-bold ${
                                  progresPct === 100
                                    ? 'text-emerald-600'
                                    : progresPct > 0
                                    ? 'text-[#843bab]'
                                    : 'text-slate-400'
                                }`}
                              >
                                {progresPct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  progresPct === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-[#843bab] to-purple-500'
                                }`}
                                style={{ width: `${progresPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Nilai Terbaik & Jumlah Percobaan per Modul */}
                        {modul.map((m) => {
                          const scoreInfo = p.nilai_per_modul?.find(
                            (score) => score.modul_id === m.id
                          );

                          // Belum ada percobaan kuis
                          if (!scoreInfo || scoreInfo.jumlah_percobaan === 0) {
                            return (
                              <td
                                key={m.id}
                                className="py-4 px-3 text-center border-l border-slate-200/60"
                              >
                                <span
                                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400"
                                  title="Belum mengerjakan kuis"
                                >
                                  -
                                </span>
                              </td>
                            );
                          }

                          const isPassed = scoreInfo.lulus;
                          const bestScore = scoreInfo.nilai_terbaik ?? 0;
                          const attempts = scoreInfo.jumlah_percobaan;

                          return (
                            <td
                              key={m.id}
                              className="py-4 px-3 text-center border-l border-slate-200/60"
                            >
                              <div className="inline-flex flex-col items-center">
                                {/* Nilai Terbaik */}
                                <div
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs shadow-2xs border ${
                                    isPassed
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                  title={`Nilai Terbaik: ${bestScore} (${isPassed ? 'Lulus' : 'Belum Lulus'})`}
                                >
                                  {isPassed ? (
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                  ) : (
                                    <AlertCircle size={12} className="text-red-600" />
                                  )}
                                  <span>{bestScore}</span>
                                </div>

                                {/* Jumlah Percobaan */}
                                <span className="text-[11px] font-semibold text-slate-500 mt-1">
                                  {attempts}x coba
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Tombol Aksi Detail */}
                        <td className="py-4 px-4 text-center print:hidden">
                          <button
                            onClick={() => setSelectedStudent(p)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-[#843bab] text-[#843bab] hover:text-white font-bold text-xs border border-purple-200/60 transition-all cursor-pointer shadow-2xs"
                            title="Lihat Evaluasi Lengkap Peserta"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. MODAL DRAWER: DETAIL LENGKAP EVALUASI PESERTA
         ========================================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-purple-50 via-white to-amber-50/30 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#843bab] text-white flex items-center justify-center font-black text-xl shadow-md">
                  {selectedStudent.nama_lengkap.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#843bab]/10 text-[#843bab]">
                      Peserta Kursus
                    </span>
                    {renderStatusBadge(selectedStudent.status_pendaftaran)}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedStudent.nama_lengkap}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span>{selectedStudent.email}</span>
                    {selectedStudent.no_hp && (
                      <>
                        <span>•</span>
                        <span>{selectedStudent.no_hp}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal: Detail Modul & Nilai */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Kursus & Progres Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Kursus yang diikuti:</div>
                  <div className="text-sm font-bold text-slate-900">{judul_kursus}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Kelulusan Modul:</div>
                  <div className="text-base font-black text-[#843bab]">
                    {selectedStudent.modul_lulus_count} / {totalModul} Modul Lulus
                  </div>
                </div>
              </div>

              {/* Tabel Detail per Modul */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                  Rincian Nilai & Percobaan Tiap Modul
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                  {modul.map((m) => {
                    const score = selectedStudent.nilai_per_modul?.find(
                      (s) => s.modul_id === m.id
                    );
                    const attempted = score && score.jumlah_percobaan > 0;
                    const passed = score?.lulus;
                    const best = score?.nilai_terbaik;
                    const count = score?.jumlah_percobaan || 0;
                    const remainingAttempts = Math.max(0, 3 - count);

                    return (
                      <div
                        key={m.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Info Modul */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#843bab] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {m.urutan}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900">
                              {m.judul}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {attempted ? (
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  Percobaan ke-{count} (Sisa {remainingAttempts}x kesempatan)
                                </span>
                              ) : (
                                <span className="text-slate-400">Belum mengerjakan kuis modul</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Nilai & Status Kelulusan */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {attempted ? (
                            <>
                              <div className="text-right">
                                <div className="text-xs text-slate-400">Nilai Terbaik</div>
                                <div
                                  className={`text-lg font-black ${
                                    passed ? 'text-emerald-600' : 'text-red-600'
                                  }`}
                                >
                                  {best ?? 0}
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {passed ? 'Lulus' : 'Belum Lulus'}
                              </span>
                            </>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                              Belum Kuis
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Standar Kelulusan */}
              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200/50 flex items-start gap-3">
                <HelpCircle size={18} className="text-[#843bab] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Ketentuan Kelulusan Kursus:</strong> Peserta dinyatakan berhak memperoleh Sertifikat Digital resmi setelah berhasil menyelesaikan seluruh materi bacaan/video serta mencapai nilai kuis minimal 70 pada tiap modul (maksimal 3 kali percobaan per kuis).
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
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
