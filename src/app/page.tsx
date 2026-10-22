import Link from 'next/link';
import {
  ChevronRight,
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Palette,
  Calculator,
  Mic,
} from 'lucide-react';
import { getPublishedCourses } from '@/lib/courses';
import PopularCoursesCarousel from '@/components/PopularCoursesCarousel';

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-white min-h-screen">
      {/* =========================================================================
          HERO BANNER GAYA CAKAP (Disesuaikan Pas Layar Windows / Compact & Profesional):
          - Fit tampilan desktop tanpa terpotong
          - Sub-heading bersih tanpa kotak persegi panjang (ai-slop free)
          - Tipografi "Bikin Auto Nyala." tegas & profesional tanpa efek neon glow
          - Mockup smartphone rapi tanpa badge melayang yang menutupi layar
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c146d] via-[#6d2797] to-[#390b54] text-white py-8 sm:py-10 lg:py-12 border-b border-purple-950/30">
        {/* Ornamen Latar Belakang Geometris Halus */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-4 right-6 lg:right-16 text-white/[0.05] hidden sm:block">
            <TrendingUp size={220} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-80 h-80 rounded-full bg-purple-400/15 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Utama ================= */}
            <div className="flex-1 text-center lg:text-left">
              {/* Sub-heading Bersih Murni Tanpa Kotak / Tanpa Background Persegi Panjang */}
              <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#ffdf0f] mb-3">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama: Tegas, Solid, Profesional Tanpa Efek Neon */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-white tracking-tight leading-[1.15] mb-4">
                Kurang Skill?<br />
                <span className="text-white">Pijar Aksara, </span>
                <span className="text-[#ffdf0f]">
                  Bikin Auto Nyala.
                </span>
              </h1>

              {/* Deskripsi Manfaat Vokasi */}
              <p className="text-purple-100/90 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6 font-normal">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum bertahap serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap (Compact & Proporsional) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mb-6">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-3 px-7 py-3.5 rounded-full text-sm font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight size={15} className="stroke-[3]" />
                  </span>
                </a>

                <Link
                  href="/kursus"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                </Link>
              </div>

              {/* Indikator Kepercayaan (Trust Indicators Ringkas) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/15 text-xs text-purple-100">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle2 size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Award size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <BookOpen size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup Smartphone Ala Cakap (Rapi & Pas) ================= */}
            <div className="flex-1 w-full flex items-center justify-center lg:justify-end relative">
              {/* Cincin Geometris Kuning Halus di Sisi Kanan Bawah */}
              <div className="absolute -bottom-8 -right-8 w-56 h-56 rounded-full border-[18px] border-[#ffdf0f]/15 pointer-events-none select-none z-0" />

              {/* Container Smartphone (Tinggi Proporsional tanpa Badge Tumpuk) */}
              <div className="relative z-10 w-full max-w-[280px] sm:max-w-[300px]">
                {/* Phone Bezel */}
                <div className="relative mx-auto rounded-[34px] border-[6px] border-slate-900 bg-slate-900 shadow-xl shadow-purple-950/60 overflow-hidden ring-1 ring-white/15">
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-900 rounded-full z-30" />

                  {/* Layar Aplikasi Pijar Aksara */}
                  <div className="bg-slate-50 text-slate-900 pt-7 pb-3.5 px-3 select-none">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 px-1 mb-2">
                      <span>09:41</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px]">5G</span>
                        <div className="w-3.5 h-1.5 rounded-xs border border-slate-500 p-[1px]">
                          <div className="h-full w-3/4 bg-slate-600 rounded-xs" />
                        </div>
                      </div>
                    </div>

                    {/* App Header Bar */}
                    <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/70 mb-2">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-purple-100 text-[#843bab] flex items-center justify-center font-bold text-[9px]">
                            PA
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">Pilih Kursus Vokasi</p>
                            <p className="text-[8px] text-slate-500">Tingkatkan skill kerja Anda</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-[#843bab] bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">
                          Resmi
                        </span>
                      </div>

                      {/* Category Chips */}
                      <div className="flex items-center gap-1 text-[9px]">
                        <span className="px-2 py-0.5 rounded-full bg-[#843bab] text-white font-bold">
                          Kesiapan Kerja
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          Usaha UMKM
                        </span>
                      </div>
                    </div>

                    {/* Daftar Kursus Ringkas (4 Item Utama) */}
                    <div className="space-y-1.5 mb-2.5">
                      {/* Item 1: Excel & Administrasi Perkantoran */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet size={13} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                              Administrasi &amp; Excel
                            </p>
                            <p className="text-[8px] text-slate-500">12 Modul • Formula Kerja</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">
                          Populer
                        </span>
                      </div>

                      {/* Item 2: Desain Grafis Canva */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                            <Palette size={13} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                              Desain Konten Canva
                            </p>
                            <p className="text-[8px] text-slate-500">8 Modul • Feed &amp; Banner</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-[#843bab] bg-purple-50 px-1.5 py-0.5 rounded-xs">
                          Favorit
                        </span>
                      </div>

                      {/* Item 3: Pembukuan UMKM */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Calculator size={13} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                              Dasar Pembukuan UMKM
                            </p>
                            <p className="text-[8px] text-slate-500">6 Modul • Laba Rugi Kas</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-xs">
                          Praktis
                        </span>
                      </div>

                      {/* Item 4: Public Speaking */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Mic size={13} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                              Public Speaking Kantor
                            </p>
                            <p className="text-[8px] text-slate-500">6 Modul • Presentasi</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-xs">
                          Karir
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi di Layar HP */}
                    <div>
                      <div className="w-full py-2 rounded-lg bg-[#ffdf0f] text-slate-950 font-black text-[10px] text-center shadow-2xs">
                        Mulai Belajar Sekarang →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PAKET POPULER KURSUS (Model Carousel Horizontal)
          Semua program tampil berdampingan tanpa perlu klik pop up kategori terpisah
         ========================================================================= */}
      <section id="katalog" className="py-12 md:py-16 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          <PopularCoursesCarousel courses={courses} />
        </div>
      </section>
    </div>
  );
}
