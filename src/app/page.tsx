import Link from 'next/link';
import {
  ChevronRight,
  BookOpen,
  Award,
  CheckCircle2,
  Laptop,
  TrendingUp,
  FileSpreadsheet,
  Palette,
  Calculator,
} from 'lucide-react';
import { getPublishedCourses } from '@/lib/courses';
import PopularCoursesCarousel from '@/components/PopularCoursesCarousel';

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-white min-h-screen">
      {/* =========================================================================
          HERO BANNER GAYA CAKAP (Presisi, Fit Sempurna Layar Windows, Zero Overlap):
          - Tinggi kompak terkontrol (lg:max-h-[480px]) pas di layar laptop Windows
          - Tipografi 2 baris seimbang, rapi, bernapas, tidak bertumpuk
          - Mockup Smartphone ramping realistis (tombol samping, dynamic island rapi, home bar)
          - Pop-up badges (Akses LMS 24 Jam & Server Kuis Otomatis) diletakkan di luar HP (right-full)
            sehingga 100% tidak menutupi layar smartphone
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4a136b] via-[#6d2797] to-[#380a52] text-white py-4 sm:py-5 lg:py-6 lg:min-h-[440px] lg:max-h-[490px] flex items-center border-b border-purple-950/30">
        {/* Ornamen Latar Belakang Geometris Halus */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-6 right-6 lg:right-16 text-white/[0.04] hidden sm:block">
            <TrendingUp size={220} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Utama ================= */}
            <div className="flex-1 text-center lg:text-left">
              {/* Sub-heading Institusional Bersih (Warna Lavender Lembut, Tanpa Kotak) */}
              <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-purple-200/90 mb-1.5">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama Presisi: 2 Baris Seimbang Tanpa Kata Tergantung */}
              <h1 className="font-black text-white tracking-tight leading-[1.15] mb-2.5">
                <span className="block text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px]">
                  Kurang Skill?
                </span>
                <span className="block text-xl sm:text-2xl lg:text-[30px] xl:text-[32px] mt-0.5 text-white">
                  Pijar Aksara, <span className="text-[#ffdf0f]">Bikin Auto Nyala.</span>
                </span>
              </h1>

              {/* Deskripsi Manfaat Vokasi Ringkas & Bernapas */}
              <p className="text-purple-100/85 text-xs sm:text-[13px] leading-relaxed max-w-md mx-auto lg:mx-0 mb-4 font-normal">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum bertahap serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap (Compact & Proporsional) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 mb-4">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight size={13} className="stroke-[3]" />
                  </span>
                </a>

                <Link
                  href="/kursus"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                </Link>
              </div>

              {/* Indikator Kepercayaan (Trust Indicators Ringkas 1 Baris) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 pt-3 border-t border-white/15 text-[10.5px] sm:text-[11px] text-purple-100/85">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={14} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup Smartphone Realistis & Floating Pop-up Cards ================= */}
            <div className="flex-1 w-full flex items-center justify-center lg:justify-end relative">
              {/* Ornamen Cincin Geometris Kuning Lembut di Kanan Bawah */}
              <div className="absolute -bottom-6 -right-6 w-44 h-44 rounded-full border-[12px] border-[#ffdf0f]/15 pointer-events-none select-none z-0" />

              {/* Container Phone & Pop-up Badges */}
              <div className="relative z-10 flex items-center justify-center">
                {/* Pop-up Card 1: Akses LMS 24 Jam (Melayang di Sisi Kiri Tanpa Menutupi Layar HP) */}
                <div className="hidden sm:flex absolute right-[calc(100%+12px)] top-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-purple-100/90 items-center gap-2 w-[160px] hover:scale-105 transition-transform duration-200">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 font-bold">
                    <Laptop size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-900 leading-tight">Akses LMS 24 Jam</p>
                    <p className="text-[8.5px] text-slate-500">Belajar mandiri fleksibel</p>
                  </div>
                </div>

                {/* Pop-up Card 2: Server Kuis Otomatis (Melayang di Sisi Kiri Bawah Tanpa Menutupi Layar HP) */}
                <div className="hidden sm:flex absolute right-[calc(100%+12px)] bottom-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-purple-100/90 items-center gap-2 w-[165px] hover:scale-105 transition-transform duration-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-900 leading-tight">Server Kuis Otomatis</p>
                    <p className="text-[8.5px] text-slate-500">Evaluasi kelulusan instan</p>
                  </div>
                </div>

                {/* Phone Frame Realistis ala Smartphone Modern (Tombol Fisik, Dynamic Island, Kaca Sheen) */}
                <div className="relative w-[210px] sm:w-[220px] rounded-[38px] p-[4px] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.15)]">
                  {/* Tombol Fisik Volume Kiri */}
                  <div className="absolute -left-[4px] top-16 w-[3px] h-6 bg-slate-500 rounded-l" />
                  <div className="absolute -left-[4px] top-24 w-[3px] h-6 bg-slate-500 rounded-l" />
                  {/* Tombol Fisik Power Kanan */}
                  <div className="absolute -right-[4px] top-20 w-[3px] h-8 bg-slate-500 rounded-r" />

                  {/* Bezel Hitam & Layar Kaca */}
                  <div className="relative rounded-[34px] overflow-hidden bg-slate-950 border-[2px] border-slate-950">
                    {/* Dynamic Island Notch Realistis */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e1726] border border-slate-700" />
                    </div>

                    {/* Pantulan Kaca Mengkilap (Glass Sheen) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07] z-20" />

                    {/* Antarmuka Aplikasi Pijar Aksara */}
                    <div className="bg-slate-50 text-slate-900 pt-6 pb-2.5 px-2.5 select-none text-left">
                      {/* Status Bar */}
                      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 px-1 mb-1">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold">5G</span>
                          <div className="w-3.5 h-1.5 rounded-xs border border-slate-500 p-[0.5px]">
                            <div className="h-full w-3/4 bg-slate-700 rounded-xs" />
                          </div>
                        </div>
                      </div>

                      {/* App Header Bar */}
                      <div className="bg-white rounded-xl p-1.5 shadow-2xs border border-slate-200/70 mb-1.5">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-md bg-purple-100 text-[#843bab] flex items-center justify-center font-black text-[7.5px]">
                              PA
                            </div>
                            <div>
                              <p className="text-[9.5px] font-black text-slate-900 leading-tight">Pilih Kursus Vokasi</p>
                              <p className="text-[7px] text-slate-400">Modul praktek siap kerja</p>
                            </div>
                          </div>
                          <span className="text-[7px] font-extrabold text-[#843bab] bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">
                            Resmi
                          </span>
                        </div>

                        {/* Category Chips */}
                        <div className="flex items-center gap-1 text-[7.5px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#843bab] text-white font-bold">
                            Kesiapan Kerja
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            Usaha UMKM
                          </span>
                        </div>
                      </div>

                      {/* Daftar Kursus di Dalam HP (3 Program Utama) */}
                      <div className="space-y-1.5 mb-2">
                        {/* Item 1: Excel & Administrasi */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileSpreadsheet size={11} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-900 leading-tight">Administrasi &amp; Excel</p>
                              <p className="text-[7px] text-slate-400">12 Modul • Formula Laporan</p>
                            </div>
                          </div>
                          <span className="text-[7px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-xs">
                            Populer
                          </span>
                        </div>

                        {/* Item 2: Desain Grafis Canva */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                              <Palette size={11} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-900 leading-tight">Desain Konten Canva</p>
                              <p className="text-[7px] text-slate-400">8 Modul • Feed &amp; Banner</p>
                            </div>
                          </div>
                          <span className="text-[7px] font-extrabold text-[#843bab] bg-purple-50 px-1 py-0.5 rounded-xs">
                            Favorit
                          </span>
                        </div>

                        {/* Item 3: Pembukuan UMKM */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                              <Calculator size={11} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-900 leading-tight">Dasar Pembukuan UMKM</p>
                              <p className="text-[7px] text-slate-400">6 Modul • Laba Rugi Kas</p>
                            </div>
                          </div>
                          <span className="text-[7px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.5 rounded-xs">
                            Praktis
                          </span>
                        </div>
                      </div>

                      {/* Tombol Aksi di Layar HP */}
                      <div className="w-full py-1.5 rounded-lg bg-[#ffdf0f] text-slate-950 font-black text-[8.5px] text-center shadow-2xs">
                        Mulai Belajar Sekarang →
                      </div>

                      {/* Home Bar Bawah HP ala iPhone */}
                      <div className="w-14 h-1 bg-slate-300 rounded-full mx-auto mt-1.5" />
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
