'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Printer,
  ShieldCheck,
  GraduationCap,
  Info,
  Clock,
  Layers,
  HelpCircle,
  BarChart3
} from 'lucide-react';

export interface AdminDashboardData {
  summary: {
    pendaftaran_bulan_ini: number;
    pendapatan_bulan_ini: number;
    peserta_aktif: number;
    sertifikat_terbit: number;
  };
  weekly_registrations: Array<{
    week_start: string;
    label: string;
    gratis_count: number;
    berbayar_count: number;
    total_count: number;
  }>;
  weekly_revenue: Array<{
    week_start: string;
    label: string;
    revenue: number;
  }>;
  course_completion_rates: Array<{
    id: string;
    judul: string;
    slug: string;
    aktif_count: number;
    selesai_count: number;
    total_belajar: number;
    completion_rate: number;
  }>;
  low_pass_modules: Array<{
    modul_id: string;
    modul_judul: string;
    kursus_judul: string;
    total_percobaan_1: number;
    lulus_percobaan_1: number;
    first_pass_rate: number;
  }>;
  nearly_full_courses: Array<{
    id: string;
    judul: string;
    slug: string;
    harga: number;
    kuota: number;
    kursi_terpakai: number;
    sisa_kursi: number;
  }>;
  generated_at?: string;
}

interface AdminDashboardViewProps {
  initialData: AdminDashboardData;
  currentRange: string;
  adminName: string;
  adminEmail: string;
}

export default function AdminDashboardView({
  initialData,
  currentRange,
  adminName,
  adminEmail,
}: AdminDashboardViewProps) {
  const router = useRouter();
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);
  const [hoveredRevenueIdx, setHoveredRevenueIdx] = useState<number | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortRupiah = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}jt`;
    }
    if (val >= 1_000) {
      return `${Math.round(val / 1_000)}k`;
    }
    return String(val);
  };

  const {
    summary,
    weekly_registrations = [],
    weekly_revenue = [],
    course_completion_rates = [],
    low_pass_modules = [],
    nearly_full_courses = [],
  } = initialData;

  // Range options
  const rangePresets = [
    { id: '4w', label: '4 Minggu', description: 'Sebulan terakhir' },
    { id: '8w', label: '8 Minggu (Bawaan)', description: '2 bulan terakhir (PRD)' },
    { id: '12w', label: '12 Minggu', description: 'Satu triwulan' },
    { id: 'all', label: 'Semua (1 Tahun)', description: 'Data historis lengkap' },
  ];

  // Aggregates for Weekly Registrations
  const totalWeeklyRegs = weekly_registrations.reduce((acc, curr) => acc + curr.total_count, 0);
  const totalWeeklyPaid = weekly_registrations.reduce((acc, curr) => acc + curr.berbayar_count, 0);
  const totalWeeklyFree = weekly_registrations.reduce((acc, curr) => acc + curr.gratis_count, 0);
  const maxWeeklyRegCount = Math.max(...weekly_registrations.map((w) => w.total_count), 4);

  // Aggregates for Weekly Revenue
  const totalWeeklyRevenue = weekly_revenue.reduce((acc, curr) => acc + curr.revenue, 0);
  const maxWeeklyRevenue = Math.max(...weekly_revenue.map((w) => w.revenue), 500_000);
  const avgWeeklyRevenue = weekly_revenue.length > 0 ? Math.round(totalWeeklyRevenue / weekly_revenue.length) : 0;
  const peakRevenueWeek = weekly_revenue.reduce(
    (max, cur) => (cur.revenue > (max?.revenue || 0) ? cur : max),
    weekly_revenue[0] || null
  );

  // SVG Chart Geometry calculations for Weekly Revenue Line Chart
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const points = weekly_revenue.map((item, idx) => {
    const x = padLeft + (weekly_revenue.length > 1 ? (idx / (weekly_revenue.length - 1)) * chartW : chartW / 2);
    const y = padTop + chartH - (maxWeeklyRevenue > 0 ? (item.revenue / maxWeeklyRevenue) * chartH : 0);
    return { x, y, item, idx };
  });

  const linePathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
    : '';

  // Revenue Y-Axis Tick steps (4 steps: 0, 33%, 66%, 100%)
  const yTicks = [
    { val: 0, y: padTop + chartH },
    { val: maxWeeklyRevenue * 0.33, y: padTop + chartH * 0.67 },
    { val: maxWeeklyRevenue * 0.67, y: padTop + chartH * 0.33 },
    { val: maxWeeklyRevenue, y: padTop },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-28">
      {/* =========================================================================
          1. HEADER & BREADCRUMB SECTION
         ========================================================================= */}
      <section className="bg-gradient-to-b from-purple-50/80 via-white to-slate-50/50 border-b border-slate-200 pt-8 pb-10 print:bg-white print:border-none print:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Admin identity */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-[#843bab] transition-colors">
                Beranda
              </Link>
              <span>/</span>
              <Link href="/admin" className="hover:text-[#843bab] transition-colors">
                Panel Administrator
              </Link>
              <span>/</span>
              <span className="text-[#843bab] font-bold">Dashboard Statistik (Bagian 9)</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200 shadow-2xs">
              <ShieldCheck size={13} className="text-[#843bab]" />
              Administrator: {adminName} ({adminEmail})
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#843bab] uppercase tracking-wider border border-purple-200">
                  Laporan & Analitik Lembaga
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Dashboard Statistik & Laporan
                </h1>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pantau metrik pendaftaran mingguan, pendapatan terverifikasi, rasio kelulusan kursus, modul evaluasi, dan ketersediaan kursi secara real-time (PRD Bagian 9).
              </p>
            </div>

            {/* Quick Actions & Print */}
            <div className="flex flex-wrap items-center gap-2.5 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#843bab] hover:text-[#843bab] text-slate-700 font-bold text-xs shadow-2xs hover:shadow transition-all"
                title="Cetak Laporan / Simpan PDF"
              >
                <Printer size={15} />
                <span>Cetak Ringkasan</span>
              </button>

              <Link
                href="/instruktur/nilai"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#843bab] hover:text-[#843bab] text-slate-700 font-bold text-xs shadow-2xs hover:shadow transition-all"
                title="Buka Buku Nilai Peserta & Kuis"
              >
                <GraduationCap size={15} className="text-[#843bab]" />
                <span>Peserta & Nilai</span>
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs hover:shadow transition-all"
                title="Kembali ke Panel Pengelola Utama"
              >
                <ArrowLeft size={15} />
                <span>Panel Pengelola</span>
              </Link>
            </div>
          </div>

          {/* =========================================================================
              DATE RANGE FILTER (PRD Bagian 9: Bawaan 8 minggu terakhir)
             ========================================================================= */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#843bab]/10 flex items-center justify-center text-[#843bab]">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Rentang Analitik:</span>
                <span className="text-[11px] text-slate-500">
                  {currentRange === '4w'
                    ? '4 Minggu Terakhir (1 Bulan)'
                    : currentRange === '8w'
                    ? '8 Minggu Terakhir (Bawaan PRD Bagian 9)'
                    : currentRange === '12w'
                    ? '12 Minggu Terakhir (1 Triwulan)'
                    : 'Semua Data Historis (1 Tahun)'}
                </span>
              </div>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 shadow-inner gap-1">
              {rangePresets.map((preset) => {
                const isActive = currentRange === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => router.push(`/admin/dashboard?range=${preset.id}`)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#843bab] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN CONTENT CONTAINER
         ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* =========================================================================
            ITEM 1: 4 KARTU RINGKASAN KPI UTAMA (PRD Bagian 9 Poin 1)
           ========================================================================= */}
        <section aria-labelledby="kpi-summary-title">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="kpi-summary-title" className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Ringkasan Kinerja Lembaga</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-[#843bab]">
                  KPI Utama
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ringkasan komprehensif pendaftaran, omzet, aktivitas belajar, dan sertifikat resmi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Pendaftaran Bulan Ini */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wide block uppercase">
                    Pendaftaran Bulan Ini
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                    {summary.pendaftaran_bulan_ini}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                  <CreditCard size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Bulan berjalan (seluruh kursus)</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Registrasi Baru
                </span>
              </div>
            </div>

            {/* Card 2: Pendapatan Bulan Ini */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wide block uppercase">
                    Pendapatan Bulan Ini
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 tracking-tight">
                    {formatRupiah(summary.pendapatan_bulan_ini)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Kursus aktif &amp; selesai terbayar</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Lunas
                </span>
              </div>
            </div>

            {/* Card 3: Peserta Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wide block uppercase">
                    Peserta Aktif
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                    {summary.peserta_aktif}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Siswa unik sedang aktif belajar</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Sedang Belajar
                </span>
              </div>
            </div>

            {/* Card 4: Sertifikat Terbit */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wide block uppercase">
                    Sertifikat Terbit
                  </span>
                  <div className="text-3xl font-black text-[#843bab] mt-2 tracking-tight">
                    {summary.sertifikat_terbit}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-[#843bab] flex items-center justify-center shadow-2xs">
                  <Award size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Nomor unik terverifikasi (BR-11)</span>
                <span className="font-bold text-[#843bab] bg-purple-50 px-2 py-0.5 rounded-full">
                  Resmi Terbit
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: DUA GRAFIK UTAMA (PRD Bagian 9 Poin 2 & Poin 3)
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* =====================================================================
              GRAFIK 1: Grafik Batang Pendaftaran per Minggu (Gratis vs Berbayar)
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header Grafik */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#843bab]" />
                    <span>Pendaftaran per Minggu</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perbandingan pendaftaran kursus gratis vs berbayar
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-3 rounded bg-[#843bab]" />
                    <span>Berbayar</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Gratis</span>
                  </span>
                </div>
              </div>

              {/* Total Summary Mini Bar */}
              <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Total Periode: <strong className="text-slate-900">{totalWeeklyRegs} Pendaftaran</strong>
                </span>
                <span className="text-slate-500">
                  <strong className="text-[#843bab]">{totalWeeklyPaid}</strong> Berbayar &middot;{' '}
                  <strong className="text-emerald-600">{totalWeeklyFree}</strong> Gratis
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="w-full h-60 relative flex flex-col justify-end pt-4">
              {weekly_registrations.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data pendaftaran pada rentang waktu ini
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-44 pb-7 border-b border-slate-200 relative">
                  {/* Background horizontal guide lines */}
                  <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 pointer-events-none" />

                  {weekly_registrations.map((w, idx) => {
                    const paidHeight = (w.berbayar_count / maxWeeklyRegCount) * 120;
                    const freeHeight = (w.gratis_count / maxWeeklyRegCount) * 120;
                    const isHovered = hoveredWeekIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                        onMouseEnter={() => setHoveredWeekIdx(idx)}
                        onMouseLeave={() => setHoveredWeekIdx(null)}
                      >
                        {/* Floating Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-16 z-20 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-lg pointer-events-none whitespace-nowrap text-center animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold text-[#ffdf0f]">Minggu {w.label}</div>
                            <div className="text-slate-200 text-[10px]">
                              Total: {w.total_count} ({w.berbayar_count} Bayar &middot; {w.gratis_count} Gratis)
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>
                        )}

                        {/* Total Count Badge above bar */}
                        <span className={`text-[11px] font-bold mb-1 transition-colors ${
                          isHovered ? 'text-[#843bab]' : 'text-slate-700'
                        }`}>
                          {w.total_count > 0 ? w.total_count : ''}
                        </span>

                        {/* Stacked Bar */}
                        <div className="w-full max-w-[32px] flex flex-col-reverse rounded-t-md overflow-hidden bg-slate-100 transition-all duration-200 group-hover:opacity-90">
                          {/* Free portion (top of stack) */}
                          {w.gratis_count > 0 && (
                            <div
                              style={{ height: `${Math.max(freeHeight, 4)}px` }}
                              className="bg-emerald-500 w-full"
                              title={`Gratis: ${w.gratis_count}`}
                            />
                          )}
                          {/* Paid portion (bottom of stack) */}
                          {w.berbayar_count > 0 && (
                            <div
                              style={{ height: `${Math.max(paidHeight, 4)}px` }}
                              className="bg-[#843bab] w-full"
                              title={`Berbayar: ${w.berbayar_count}`}
                            />
                          )}
                          {w.total_count === 0 && (
                            <div className="h-1 bg-slate-200 w-full" />
                          )}
                        </div>

                        {/* X-Axis Label */}
                        <span className="absolute -bottom-6 text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                          {w.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              GRAFIK 2: Grafik Garis Pendapatan per Minggu (Omzet Berbayar)
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header Grafik */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-600" />
                    <span>Pendapatan per Minggu</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grafik garis omzet pendaftaran aktif &amp; selesai terbayar (PRD Poin 3)
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wide">
                    Total Omzet Periode Ini
                  </span>
                  <span className="text-base font-black text-emerald-600">
                    {formatRupiah(totalWeeklyRevenue)}
                  </span>
                </div>
              </div>

              {/* Rata-rata & Puncak */}
              <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Rata-rata: <strong className="text-slate-900">{formatRupiah(avgWeeklyRevenue)}/minggu</strong>
                </span>
                {peakRevenueWeek && peakRevenueWeek.revenue > 0 && (
                  <span className="text-slate-500">
                    Puncak:{' '}
                    <strong className="text-[#843bab]">{peakRevenueWeek.label}</strong> (
                    {formatRupiah(peakRevenueWeek.revenue)})
                  </span>
                )}
              </div>
            </div>

            {/* SVG Line & Area Chart */}
            <div className="w-full h-60 relative flex flex-col justify-end">
              {weekly_revenue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data pendapatan pada rentang waktu ini
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#843bab" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#843bab" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Horizontal Grid Lines & Ticks */}
                    {yTicks.map((tick, i) => (
                      <g key={i}>
                        <line
                          x1={padLeft}
                          y1={tick.y}
                          x2={svgWidth - padRight}
                          y2={tick.y}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={tick.y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          fontWeight="500"
                        >
                          {formatShortRupiah(tick.val)}
                        </text>
                      </g>
                    ))}

                    {/* Area under the line */}
                    {areaPathD && (
                      <path d={areaPathD} fill="url(#revenueGradient)" />
                    )}

                    {/* The Line */}
                    {linePathD && (
                      <path
                        d={linePathD}
                        fill="none"
                        stroke="#843bab"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Points and X labels */}
                    {points.map((p, idx) => {
                      const isHovered = hoveredRevenueIdx === idx;
                      return (
                        <g key={idx} className="cursor-pointer">
                          {/* Circle point */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke="#843bab"
                            strokeWidth={isHovered ? 3 : 2}
                            onMouseEnter={() => setHoveredRevenueIdx(idx)}
                            onMouseLeave={() => setHoveredRevenueIdx(null)}
                            className="transition-all duration-150"
                          />

                          {/* X-axis week label */}
                          <text
                            x={p.x}
                            y={padTop + chartH + 20}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                            fontWeight="500"
                          >
                            {p.item.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* HTML Hover Tooltip for precise tooltip display */}
                  {hoveredRevenueIdx !== null && points[hoveredRevenueIdx] && (
                    <div
                      className="absolute z-20 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-lg pointer-events-none whitespace-nowrap text-center -translate-x-1/2 -translate-y-full"
                      style={{
                        left: `${(points[hoveredRevenueIdx].x / svgWidth) * 100}%`,
                        top: `${(points[hoveredRevenueIdx].y / svgHeight) * 100}%`,
                        marginTop: '-10px',
                      }}
                    >
                      <div className="font-bold text-[#ffdf0f]">
                        Minggu {points[hoveredRevenueIdx].item.label}
                      </div>
                      <div className="text-emerald-400 font-bold text-xs">
                        {formatRupiah(points[hoveredRevenueIdx].item.revenue)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            ITEM 4: GRAFIK BATANG TINGKAT PENYELESAIAN PER KURSUS (PRD Poin 4)
           ========================================================================= */}
        <section aria-labelledby="completion-rate-title" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 id="completion-rate-title" className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen size={18} className="text-[#843bab]" />
                <span>Tingkat Penyelesaian per Kursus</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rasio kelulusan peserta: <strong>Selesai &divide; (Aktif + Selesai) &times; 100%</strong> (PRD Bagian 9 Poin 4)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>&ge; 70% Optimal</span>
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>40-69% Sedang</span>
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>&lt; 40% Perhatian</span>
              </span>
            </div>
          </div>

          {course_completion_rates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada kursus terbit atau peserta terdaftar
            </div>
          ) : (
            <div className="space-y-4">
              {course_completion_rates.map((course) => {
                const rate = course.completion_rate;
                const barColor =
                  rate >= 70
                    ? 'bg-emerald-500'
                    : rate >= 40
                    ? 'bg-amber-500'
                    : 'bg-rose-500';

                const badgeBg =
                  rate >= 70
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : rate >= 40
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/kursus/${course.slug}`}
                          className="font-bold text-sm text-slate-900 hover:text-[#843bab] transition-colors flex items-center gap-1.5"
                          title="Lihat Detail Halaman Kursus"
                        >
                          <span>{course.judul}</span>
                          <ExternalLink size={12} className="text-slate-400" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          <strong className="text-slate-800">{course.selesai_count}</strong> lulus dari{' '}
                          <strong className="text-slate-800">{course.total_belajar}</strong> peserta belajar{' '}
                          <span className="text-[11px] text-slate-400">({course.aktif_count} aktif)</span>
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${badgeBg}`}>
                          {rate}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 3: DUA TABEL MASUKAN EVALUASI & KURSI (PRD Poin 5 & Poin 6)
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* =====================================================================
              TABEL 1: Modul dengan Tingkat Lulus Percobaan Pertama Terendah (Poin 5)
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Evaluasi Modul &amp; Kuis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modul dengan tingkat lulus percobaan pertama terendah (PRD Bagian 9 Poin 5)
                  </p>
                </div>
              </div>

              {/* Informative Alert for Instructor Feedback */}
              <div className="mb-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
                <Info size={15} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Masukan ke Instruktur:</strong> Modul dalam daftar ini memiliki tingkat kelulusan kuis percobaan ke-1 paling rendah. Instruktur disarankan menyederhanakan penjelasan materi atau mengevaluasi ketepatan soal kuis.
                </div>
              </div>

              {low_pass_modules.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada data pengerjaan kuis percobaan pertama
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Modul &amp; Kursus</th>
                        <th className="py-2.5 px-2 text-center">Peserta Ke-1</th>
                        <th className="py-2.5 px-3 text-right">Lulus Ke-1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {low_pass_modules.map((m) => {
                        const passRate = m.first_pass_rate;
                        const badgeColor =
                          passRate < 55
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200';

                        return (
                          <tr key={m.modul_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 text-xs">{m.modul_judul}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{m.kursus_judul}</div>
                            </td>
                            <td className="py-3 px-2 text-center text-slate-600 font-medium">
                              {m.lulus_percobaan_1} / {m.total_percobaan_1}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full font-black text-xs border ${badgeColor}`}>
                                {passRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Maksimal 6 modul terendah</span>
              <Link
                href="/instruktur/nilai"
                className="font-bold text-[#843bab] hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua di Buku Nilai</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* =====================================================================
              TABEL 2: Kursus Hampir Penuh (Sisa Kursi <= 2) (Poin 6, BR-06)
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2.5 mb-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Kursus Hampir Penuh
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kursus terbit dengan sisa kursi &le; 2 (BR-06 &amp; PRD Bagian 9 Poin 6)
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin?tab=kursus"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Buka Tab Tinjauan Kursus untuk ubah kuota"
                >
                  <span>Kelola Kuota</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              {nearly_full_courses.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2" />
                  <div className="font-bold text-sm">Kapasitas Kursus Aman</div>
                  <p className="text-emerald-700 text-xs mt-1 max-w-sm mx-auto">
                    Seluruh kursus terbit memiliki ketersediaan kursi yang cukup (&gt; 2 kursi tersisa).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Judul Kursus</th>
                        <th className="py-2.5 px-2 text-center">Kuota</th>
                        <th className="py-2.5 px-2 text-center">Terpakai</th>
                        <th className="py-2.5 px-3 text-right">Sisa Kursi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nearly_full_courses.map((course) => {
                        const isFull = course.sisa_kursi <= 0;
                        return (
                          <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 text-xs">{course.judul}</div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {course.harga === 0 ? 'Gratis' : formatRupiah(course.harga)}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center text-slate-600 font-medium">
                              {course.kuota}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-600 font-medium">
                              {course.kursi_terpakai}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs border ${
                                  isFull
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {!isFull && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                )}
                                <span>{isFull ? 'PENUH' : `Sisa ${course.sisa_kursi}`}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Sesuai aturan BR-06 ketersediaan kursi</span>
              <Link
                href="/admin?tab=kursus"
                className="font-bold text-[#843bab] hover:underline flex items-center gap-1"
              >
                <span>Sesuaikan Kuota Kursus</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
