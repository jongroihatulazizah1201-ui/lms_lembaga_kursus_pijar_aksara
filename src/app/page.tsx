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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4a136b] via-[#6d2797] to-[#380a52] text-white lg:h-[calc(100vh-80px)] lg:min-h-[560px] flex items-center border-b border-purple-950/30 py-12 lg:py-0">
        {/* Ornamen Latar Belakang Geometris ala Cakap (Panah Pertumbuhan & Gelombang Cahaya) */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-10 right-8 lg:right-24 text-white/[0.06] hidden sm:block">
            <TrendingUp size={340} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus di Sisi Kanan */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-400/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Utama ala Cakap ================= */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              {/* Sub-heading Institusional Bersih (Warna Lavender Lembut, Tanpa Kotak) */}
              <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-purple-200/90 mb-3">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama Presisi & Punchy ala Cakap */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-black text-white tracking-tight leading-[1.08] mb-5">
                Kurang Skill?<br />
                <span className="text-white">Pijar Aksara, </span>
                <span className="text-[#ffdf0f]">Bikin Auto Nyala.</span>
              </h1>

              {/* Deskripsi Singkat & Padat */}
              <p className="text-purple-100/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum vokasi teruji serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap (Besar, Jelas, & Kontras) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-8 py-4 rounded-full text-base font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0">
                    <ChevronRight size={18} className="stroke-[3]" />
                  </span>
                </a>

                <Link
                  href="/kursus"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 backdrop-blur-md transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                </Link>
              </div>

              {/* Indikator Kepercayaan (Trust Indicators Ringkas) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-5 border-t border-white/15 text-xs text-purple-100/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup Smartphone Ukuran Normal ala Cakap ================= */}
            <div className="flex-1 w-full flex items-center justify-center lg:justify-end relative">
              {/* Cincin Geometris Kuning Lembut ala Cakap di Kanan Bawah */}
              <div className="absolute -bottom-12 -right-12 sm:-right-8 w-72 h-72 sm:w-96 sm:h-96 rounded-full border-[28px] border-[#ffdf0f]/20 pointer-events-none select-none z-0" />

              {/* Container Phone & Floating Badges */}
              <div className="relative z-10 flex items-center justify-center">
                {/* Pop-up Card 1: Akses LMS 24 Jam (Melayang Rapi di Sisi Kiri Atas Tanpa Menutupi Layar HP) */}
                <div className="hidden xl:flex absolute right-[calc(100%+16px)] top-12 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-100/90 items-center gap-3 w-[185px] hover:scale-105 transition-transform duration-200">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 font-bold">
                    <Laptop size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 leading-tight">Akses LMS 24 Jam</p>
                    <p className="text-[10px] text-slate-500">Belajar mandiri fleksibel</p>
                  </div>
                </div>

                {/* Pop-up Card 2: Server Kuis Otomatis (Melayang Rapi di Sisi Kiri Bawah Tanpa Menutupi Layar HP) */}
                <div className="hidden xl:flex absolute right-[calc(100%+16px)] bottom-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-100/90 items-center gap-3 w-[190px] hover:scale-105 transition-transform duration-200">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 leading-tight">Server Kuis Otomatis</p>
                    <p className="text-[10px] text-slate-500">Evaluasi kelulusan instan</p>
                  </div>
                </div>

                {/* Smartphone Mockup Ukuran Normal ala Cakap (Lebar 320px, Tinggi Proporsional, Realistis) */}
                <div className="relative w-[290px] sm:w-[320px] lg:w-[330px] rounded-[48px] p-[6px] bg-gradient-to-b from-slate-500 via-slate-800 to-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.18)]">
                  {/* Tombol Fisik Volume Kiri */}
                  <div className="absolute -left-[5px] top-24 w-[3.5px] h-8 bg-slate-500 rounded-l" />
                  <div className="absolute -left-[5px] top-36 w-[3.5px] h-8 bg-slate-500 rounded-l" />
                  {/* Tombol Fisik Power Kanan */}
                  <div className="absolute -right-[5px] top-28 w-[3.5px] h-12 bg-slate-500 rounded-r" />

                  {/* Bezel Hitam & Layar Kaca */}
                  <div className="relative rounded-[42px] overflow-hidden bg-slate-950 border-[2.5px] border-slate-950 shadow-inner">
                    {/* Dynamic Island Notch Realistis */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-full z-30 flex items-center justify-end pr-2">
                      <div className="w-2 h-2 rounded-full bg-[#0e1726] border border-slate-700" />
                    </div>

                    {/* Pantulan Kaca Mengkilap (Glass Sheen) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-20" />

                    {/* Layar Aplikasi Pijar Aksara ala Cakap */}
                    <div className="bg-slate-50 text-slate-900 pt-8 pb-4 px-3.5 select-none text-left">
                      {/* Status Bar */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 px-1 mb-2.5">
                        <span>09:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold">5G</span>
                          <div className="w-4 h-2 rounded-xs border border-slate-500 p-[0.5px]">
                            <div className="h-full w-3/4 bg-slate-700 rounded-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Header Aplikasi ala Cakap ("Pilih kursus bahasa") */}
                      <div className="pb-2.5 mb-2.5 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-black text-slate-900 tracking-tight">
                            ✕ &nbsp; Pilih Kursus Vokasi
                          </p>
                          <span className="text-[9px] font-extrabold text-[#843bab] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            Resmi
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Kamu bisa memilih modul keahlian sekarang
                        </p>
                      </div>

                      {/* Section 1: Kursus Kesiapan Kerja (ala Cakap Dewasa) */}
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Kursus Kesiapan Kerja
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium">Vokasi Resmi</span>
                        </div>

                        <div className="space-y-1.5">
                          {/* Item 1: Highlighted Aktif ala Cakap English */}
                          <div className="bg-purple-50/80 p-2 rounded-xl border border-purple-200 shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                <FileSpreadsheet size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Administrasi &amp; Excel
                                </p>
                                <p className="text-[9px] text-slate-500">12 Modul • Formula Laporan</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Populer
                            </span>
                          </div>

                          {/* Item 2 */}
                          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                                <Palette size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Desain Konten Canva
                                </p>
                                <p className="text-[9px] text-slate-500">8 Modul • Feed &amp; Banner</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Favorit</span>
                          </div>

                          {/* Item 3 */}
                          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                                <Mic size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Public Speaking Kantor
                                </p>
                                <p className="text-[9px] text-slate-500">6 Modul • Presentasi Kerja</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Karir</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Wirausaha & Bisnis (ala Cakap Kids) */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Usaha Mandiri &amp; Bisnis
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium">Praktis</span>
                        </div>

                        <div className="space-y-1.5">
                          {/* Item 4 */}
                          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                <Calculator size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Dasar Pembukuan UMKM
                                </p>
                                <p className="text-[9px] text-slate-500">6 Modul • Laba Rugi Kas</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">UMKM</span>
                          </div>

                          {/* Item 5 */}
                          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                                <Languages size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Bahasa Inggris Kerja
                                </p>
                                <p className="text-[9px] text-slate-500">10 Modul • Speaking Aktif</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Bisnis</span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi di Layar HP */}
                      <div className="w-full py-2.5 rounded-xl bg-[#ffdf0f] text-slate-950 font-black text-xs text-center shadow-xs">
                        Mulai Belajar Sekarang →
                      </div>

                      {/* Home Bar Bawah HP ala iPhone */}
                      <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto mt-2.5" />
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
