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
  Mic,
  Languages,
} from 'lucide-react';
import { getPublishedCourses } from '@/lib/courses';
import PopularCoursesCarousel from '@/components/PopularCoursesCarousel';

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-white min-h-screen">
      {/* =========================================================================
          HERO BANNER GAYA CAKAP (Fit 1 Layar Penuh Windows, HP Ukuran Normal, UI/UX Premium):
          - Fit 1 layar penuh browser (lg:h-[calc(100vh-80px)]) persis seperti di Cakap
          - Smartphone ukuran normal (w-[310px] sm:w-[330px] lg:w-[340px]) proporsional & jelas
          - Tipografi display tegas & punchy: "Kurang Skill? Pijar Aksara, Bikin Auto Nyala."
          - Floating badges (Akses LMS 24 Jam & Server Kuis Otomatis) melayang rapi di samping HP
          - Call to Action Pill kuning ala Cakap dengan panah melingkar
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4a136b] via-[#6d2797] to-[#380a52] text-white lg:h-[calc(100vh-80px)] lg:max-h-[580px] lg:min-h-[480px] flex items-center border-b border-purple-950/30 py-8 lg:py-0">
        {/* Ornamen Latar Belakang Geometris ala Cakap (Panah Pertumbuhan & Glow Halus) */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-10 right-8 lg:right-24 text-white/[0.05] hidden sm:block">
            <TrendingUp size={320} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus di Sisi Kanan */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-[420px] h-[420px] rounded-full bg-purple-400/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Terstruktur Rapi ================= */}
            <div className="lg:col-span-7 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              {/* Sub-heading Institusional Bersih (Ukuran Selaras: 13px, Bernapas & Elegan) */}
              <p className="text-xs sm:text-[13px] font-semibold tracking-wider uppercase text-purple-200/90 mb-4 sm:mb-4.5">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama (Titik Fokus Utama, Proporsional & Presisi 2 Baris) */}
              <h1 className="text-3xl sm:text-[38px] lg:text-[40px] xl:text-[44px] font-black text-white tracking-tight leading-[1.16] mb-4.5 sm:mb-5">
                Kurang Skill?<br />
                <span>Pijar Aksara, </span>
                <span className="text-[#ffdf0f] inline-block sm:inline sm:whitespace-nowrap">Bikin Auto Nyala.</span>
              </h1>

              {/* Deskripsi Singkat (Ukuran Disamakan: 13px, Ringan, Tidak Berat di Mata, Jarak Sewajarnya) */}
              <p className="text-xs sm:text-[13px] font-normal text-purple-100/85 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-6.5">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum vokasi teruji serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap (Kontras Tinggi & Menarik Fokus) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-5.5">
                <a
                  href="#katalog"
                  className="inline-flex items-center justify-center gap-3.5 px-7 py-3 rounded-full text-sm sm:text-base font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight size={16} className="stroke-[3]" />
                  </span>
                </a>

                <Link
                  href="/kursus"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-purple-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Indikator Kepercayaan (Trust Indicators Ringkas 1 Baris) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 pt-3.5 border-t border-white/15 text-xs text-purple-200/90 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#ffdf0f] shrink-0" />
                  <span>Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={15} className="text-[#ffdf0f] shrink-0" />
                  <span>Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={15} className="text-[#ffdf0f] shrink-0" />
                  <span>Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup iPhone 16 + Bubble Chat iPhone ================= */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              {/* Cincin Geometris Kuning Lembut di Belakang Smartphone */}
              <div className="absolute -bottom-8 -right-8 w-60 h-60 rounded-full border-[20px] border-[#ffdf0f]/20 pointer-events-none select-none z-0 hidden sm:block" />

              {/* Wrapper Smartphone & Bubble Chat Badges */}
              <div className="relative inline-block z-10">
                {/* Bubble Chat iPhone 1: Akses LMS 24 Jam (Menyenggol Sisi Kiri iPhone 16 dengan Ekor Pesan iMessage) */}
                <div className="hidden xl:flex absolute right-[calc(100%-14px)] top-9 z-30 bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-xs p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] border border-purple-100/90 items-center gap-2.5 sm:gap-3 w-[185px] hover:scale-105 transition-transform duration-200 group">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-xs">
                    <Laptop size={15} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-black text-slate-900 leading-tight truncate">Akses LMS 24 Jam</p>
                      <span className="text-[8px] text-slate-400 font-medium">09:41</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-medium leading-snug">Belajar mandiri fleksibel</p>
                  </div>
                  {/* Ekor Bubble Chat iMessage mengarah ke bodi iPhone 16 */}
                  <div className="absolute -right-2 top-3 w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/95 filter drop-shadow-[2px_0_1px_rgba(0,0,0,0.04)]" />
                </div>

                {/* Bubble Chat iPhone 2: Server Kuis Otomatis (Menyenggol Sisi Kiri iPhone 16 dengan Ekor Pesan iMessage) */}
                <div className="hidden xl:flex absolute right-[calc(100%-10px)] bottom-12 z-30 bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-xs p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] border border-purple-100/90 items-center gap-2.5 sm:gap-3 w-[190px] hover:scale-105 transition-transform duration-200 group">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-black text-slate-900 leading-tight truncate">Server Kuis Otomatis</p>
                      <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded">Baru</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-medium leading-snug">Evaluasi kelulusan instan</p>
                  </div>
                  {/* Ekor Bubble Chat iMessage mengarah ke bodi iPhone 16 */}
                  <div className="absolute -right-2 top-3 w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/95 filter drop-shadow-[2px_0_1px_rgba(0,0,0,0.04)]" />
                </div>

                {/* Mockup iPhone 16 Asli (Action Button, Camera Control, Dynamic Island, Bezel Super Tipis) */}
                <div className="relative w-[240px] sm:w-[250px] lg:w-[260px] rounded-[42px] p-[5px] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[0_22px_55px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.22)]">
                  {/* Sisi Kiri iPhone 16: Action Button + Volume Up + Volume Down */}
                  <div className="absolute -left-[4px] top-14 w-[3.5px] h-4 bg-slate-500 rounded-l" title="Action Button" />
                  <div className="absolute -left-[4px] top-21 w-[3.5px] h-7 bg-slate-500 rounded-l" title="Volume Up" />
                  <div className="absolute -left-[4px] top-31 w-[3.5px] h-7 bg-slate-500 rounded-l" title="Volume Down" />

                  {/* Sisi Kanan iPhone 16: Power Button + Camera Control Baru khas iPhone 16 */}
                  <div className="absolute -right-[4px] top-20 w-[3.5px] h-10 bg-slate-500 rounded-r" title="Side Button" />
                  <div className="absolute -right-[3.5px] bottom-20 w-[3px] h-9 bg-slate-600 rounded-r border-r border-slate-400/80" title="Camera Control iPhone 16" />

                  {/* Bezel Hitam & Layar Kaca iPhone 16 */}
                  <div className="relative rounded-[37px] overflow-hidden bg-slate-950 border-[2px] border-slate-950 shadow-inner">
                    {/* Dynamic Island Khas iPhone 16 */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-19 h-3.5 bg-black rounded-full z-30 flex items-center justify-between px-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e1726] border border-slate-700" />
                      <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
                    </div>

                    {/* Pantulan Kaca Mengkilap (Glass Sheen iOS) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07] z-20" />

                    {/* Layar Aplikasi Pijar Aksara */}
                    <div className="bg-slate-50 text-slate-900 pt-6 pb-3 px-3 select-none text-left">
                      {/* iOS Status Bar */}
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 px-1 mb-1.5">
                        <span>09:41</span>
                        <div className="flex items-center gap-1.5">
                          {/* Sinyal Bar iOS */}
                          <div className="flex items-end gap-[1px] h-2">
                            <span className="w-[1.5px] h-1 bg-slate-700 rounded-xs" />
                            <span className="w-[1.5px] h-1.5 bg-slate-700 rounded-xs" />
                            <span className="w-[1.5px] h-2 bg-slate-700 rounded-xs" />
                            <span className="w-[1.5px] h-2.5 bg-slate-700 rounded-xs" />
                          </div>
                          <span className="text-[9px] font-bold">5G</span>
                          {/* Indikator Baterai iOS */}
                          <div className="w-4 h-2 rounded-[3px] border border-slate-600 p-[0.5px] flex items-center">
                            <div className="h-full w-4/5 bg-emerald-500 rounded-[1.5px]" />
                          </div>
                        </div>
                      </div>

                      {/* Header Aplikasi Kursus */}
                      <div className="pb-1.5 mb-1.5 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-black text-slate-900 tracking-tight">
                            ✕ &nbsp; Pilih Kursus Vokasi
                          </p>
                          <span className="text-[8.5px] font-extrabold text-[#843bab] bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                            Resmi
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500">
                          Pilihan modul keahlian siap kerja
                        </p>
                      </div>

                      {/* Section 1: Kursus Kesiapan Kerja */}
                      <div className="mb-1.5">
                        <div className="flex items-center justify-between mb-1 px-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Kesiapan Kerja
                          </p>
                          <span className="text-[8px] text-slate-400 font-medium">Vokasi</span>
                        </div>

                        <div className="space-y-1">
                          {/* Item 1 */}
                          <div className="bg-purple-50/80 p-1.5 rounded-lg border border-purple-200 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5.5 h-5.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                <FileSpreadsheet size={13} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                  Administrasi &amp; Excel
                                </p>
                                <p className="text-[8px] text-slate-500">12 Modul • Formula Laporan</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                              Populer
                            </span>
                          </div>

                          {/* Item 2 */}
                          <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5.5 h-5.5 rounded-md bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                                <Palette size={13} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                  Desain Konten Canva
                                </p>
                                <p className="text-[8px] text-slate-500">8 Modul • Feed &amp; Banner</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">Favorit</span>
                          </div>

                          {/* Item 3 */}
                          <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5.5 h-5.5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                                <Mic size={13} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                  Public Speaking Kerja
                                </p>
                                <p className="text-[8px] text-slate-500">6 Modul • Presentasi</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">Karir</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Usaha Mandiri */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1 px-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Usaha Mandiri
                          </p>
                          <span className="text-[8px] text-slate-400 font-medium">Praktis</span>
                        </div>

                        {/* Item 4 */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <Calculator size={13} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                Pembukuan UMKM
                              </p>
                              <p className="text-[8px] text-slate-500">6 Modul • Laba Rugi Kas</p>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400">UMKM</span>
                        </div>
                      </div>

                      {/* Tombol Aksi di Layar HP */}
                      <div className="w-full py-2 rounded-lg bg-[#ffdf0f] text-slate-950 font-black text-[10px] text-center shadow-xs">
                        Mulai Belajar Sekarang →
                      </div>

                      {/* Home Bar Bawah iPhone 16 */}
                      <div className="w-18 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
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
