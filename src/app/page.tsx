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
} from 'lucide-react';
import { getPublishedCourses } from '@/lib/courses';
import PopularCoursesCarousel from '@/components/PopularCoursesCarousel';

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-white min-h-screen">
      {/* =========================================================================
          HERO BANNER GAYA CAKAP (Presisi, Rapi, & Fit Sempurna Layar Windows):
          - Tipografi 2 baris seimbang, proporsional, tanpa kata "Nyala." tergantung
          - Sub-heading bersih elegan tanpa kotak background
          - Mockup Smartphone realistis (tombol fisik, dynamic island kamera, home bar)
          - Pop-up melayang (Akses LMS 24 Jam & Server Kuis Otomatis) dihadirkan kembali
            dengan posisi rapi di samping HP tanpa menutupi layar atau terpotong
          - Tinggi kompak (py-6 lg:py-8) agar pas di layar laptop/desktop Windows
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4a136b] via-[#6d2797] to-[#380a52] text-white py-6 sm:py-7 lg:py-8 border-b border-purple-950/30">
        {/* Ornamen Latar Belakang Geometris Halus */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-6 right-6 lg:right-16 text-white/[0.04] hidden sm:block">
            <TrendingUp size={240} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-80 h-80 rounded-full bg-purple-400/15 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Utama ================= */}
            <div className="flex-1 text-center lg:text-left">
              {/* Sub-heading Institusional Bersih (Warna Lavender Lembut, Tanpa Kotak) */}
              <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-purple-200/90 mb-2">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama Presisi: 2 Baris Seimbang Tanpa Kata Tergantung */}
              <h1 className="font-black text-white tracking-tight leading-[1.15] mb-3">
                <span className="block text-3xl sm:text-4xl lg:text-[40px]">
                  Kurang Skill?
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] mt-1 text-white">
                  Pijar Aksara, <span className="text-[#ffdf0f]">Bikin Auto Nyala.</span>
                </span>
              </h1>

              {/* Deskripsi Manfaat Vokasi Ringkas & Bernapas */}
              <p className="text-purple-100/85 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto lg:mx-0 mb-5 font-normal">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum bertahap serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap (Compact & Proporsional) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-5">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-3 px-6 py-3 rounded-full text-sm font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight size={14} className="stroke-[3]" />
                  </span>
                </a>

                <Link
                  href="/kursus"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                </Link>
              </div>

              {/* Indikator Kepercayaan (Trust Indicators Ringkas 1 Baris) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 text-[11px] text-purple-100/90">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle2 size={15} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Award size={15} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <BookOpen size={15} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup Smartphone Realistis & Floating Pop-up Cards ================= */}
            <div className="flex-1 w-full flex items-center justify-center lg:justify-end relative">
              {/* Ornamen Cincin Geometris Kuning Lembut */}
              <div className="absolute -bottom-6 -right-6 w-52 h-52 rounded-full border-[14px] border-[#ffdf0f]/15 pointer-events-none select-none z-0" />

              {/* Container Phone & Pop-up Badges */}
              <div className="relative z-10 flex items-center justify-center">
                {/* Pop-up Card 1: Akses LMS 24 Jam (Melayang Rapi di Sisi Kiri Atas Tanpa Menutupi Layar HP) */}
                <div className="hidden sm:flex absolute -left-12 lg:-left-20 top-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-purple-100/90 items-center gap-2.5 min-w-[170px] hover:scale-105 transition-transform duration-200">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 font-bold">
                    <Laptop size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-extrabold text-slate-900 leading-tight">Akses LMS 24 Jam</p>
                    <p className="text-[9px] text-slate-500">Belajar mandiri fleksibel</p>
                  </div>
                </div>

                {/* Pop-up Card 2: Server Kuis Otomatis (Melayang Rapi di Sisi Kiri Bawah) */}
                <div className="hidden sm:flex absolute -left-8 lg:-left-16 bottom-8 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-purple-100/90 items-center gap-2.5 min-w-[175px] hover:scale-105 transition-transform duration-200">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-extrabold text-slate-900 leading-tight">Server Kuis Otomatis</p>
                    <p className="text-[9px] text-slate-500">Evaluasi kelulusan instan</p>
                  </div>
                </div>

                {/* Phone Frame Realistis ala Smartphone Modern (Tombol Fisik, Dynamic Island, Kaca Sheen) */}
                <div className="relative w-[235px] sm:w-[250px] rounded-[42px] p-[5px] bg-gradient-to-b from-[#3a3a42] via-[#202026] to-[#121216] shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)]">
                  {/* Tombol Fisik Volume Kiri */}
                  <div className="absolute -left-[5px] top-20 w-[3px] h-7 bg-slate-600 rounded-l-xs" />
                  <div className="absolute -left-[5px] top-30 w-[3px] h-7 bg-slate-600 rounded-l-xs" />
                  {/* Tombol Fisik Power Kanan */}
                  <div className="absolute -right-[5px] top-24 w-[3px] h-10 bg-slate-600 rounded-r-xs" />

                  {/* Bezel Hitam & Layar Kaca */}
                  <div className="relative rounded-[37px] overflow-hidden bg-slate-900 border-[3px] border-slate-950">
                    {/* Dynamic Island Notch Realistis */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-18 h-4 bg-black rounded-full z-30 flex items-center justify-end pr-1.5 shadow-xs">
                      <div className="w-2 h-2 rounded-full bg-[#0a1128] border border-slate-800" />
                    </div>

                    {/* Pantulan Kaca Mengkilap (Glass Sheen) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] z-20" />

                    {/* Antarmuka Aplikasi Pijar Aksara */}
                    <div className="bg-slate-50 text-slate-900 pt-7 pb-3 px-2.5 select-none text-left">
                      {/* Status Bar */}
                      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 px-1 mb-1.5">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold">5G</span>
                          <div className="w-3.5 h-1.5 rounded-xs border border-slate-500 p-[0.5px]">
                            <div className="h-full w-3/4 bg-slate-700 rounded-xs" />
                          </div>
                        </div>
                      </div>

                      {/* App Header Bar */}
                      <div className="bg-white rounded-xl p-2 shadow-2xs border border-slate-200/70 mb-1.5">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4.5 h-4.5 rounded-md bg-purple-100 text-[#843bab] flex items-center justify-center font-black text-[8px]">
                              PA
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 leading-tight">Pilih Kursus Vokasi</p>
                              <p className="text-[7.5px] text-slate-400">Modul praktek siap kerja</p>
                            </div>
                          </div>
                          <span className="text-[7.5px] font-extrabold text-[#843bab] bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">
                            Resmi
                          </span>
                        </div>

                        {/* Category Chips */}
                        <div className="flex items-center gap-1 text-[8px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#843bab] text-white font-bold">
                            Kesiapan Kerja
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            Usaha UMKM
                          </span>
                        </div>
                      </div>

                      {/* Daftar Kursus di Dalam HP */}
                      <div className="space-y-1.5 mb-2">
                        {/* Item 1: Excel & Administrasi */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileSpreadsheet size={12} />
                            </div>
                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-tight">Administrasi &amp; Excel</p>
                              <p className="text-[7.5px] text-slate-400">12 Modul • Formula Laporan</p>
                            </div>
                          </div>
                          <span className="text-[7.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-xs">
                            Populer
                          </span>
                        </div>

                        {/* Item 2: Desain Grafis Canva */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-md bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                              <Palette size={12} />
                            </div>
                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-tight">Desain Konten Canva</p>
                              <p className="text-[7.5px] text-slate-400">8 Modul • Feed &amp; Banner</p>
                            </div>
                          </div>
                          <span className="text-[7.5px] font-extrabold text-[#843bab] bg-purple-50 px-1 py-0.5 rounded-xs">
                            Favorit
                          </span>
                        </div>

                        {/* Item 3: Pembukuan UMKM */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                              <Calculator size={12} />
                            </div>
                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-tight">Dasar Pembukuan UMKM</p>
                              <p className="text-[7.5px] text-slate-400">6 Modul • Laba Rugi Kas</p>
                            </div>
                          </div>
                          <span className="text-[7.5px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.5 rounded-xs">
                            Praktis
                          </span>
                        </div>

                        {/* Item 4: Public Speaking */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5.5 h-5.5 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                              <Mic size={12} />
                            </div>
                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-tight">Public Speaking Kantor</p>
                              <p className="text-[7.5px] text-slate-400">6 Modul • Presentasi Kerja</p>
                            </div>
                          </div>
                          <span className="text-[7.5px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.5 rounded-xs">
                            Karir
                          </span>
                        </div>
                      </div>

                      {/* Tombol Aksi di Layar HP */}
                      <div className="w-full py-1.5 rounded-lg bg-[#ffdf0f] text-slate-950 font-black text-[9px] text-center shadow-2xs">
                        Mulai Belajar Sekarang →
                      </div>

                      {/* Home Bar Bawah HP ala iPhone */}
                      <div className="w-16 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
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
