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
          HERO BANNER GAYA CAKAP:
          - Warna tone resmi Royal Purple (#6d2797 / #4a136b) dengan aksen Golden Yellow (#ffdf0f)
          - Jargon resmi: "Kurang Skill? Pijar Aksara, Bikin Auto Nyala."
          - Tanpa swipe up / slider dots (tampilan banner solid & langsung siap aksi)
          - Tombol Call-to-Action Pill bulat dengan panah lingkaran ala Cakap
          - Mockup Smartphone interaktif di sisi kanan menampilkan katalog kursus vokasi
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c146d] via-[#6d2797] to-[#390b54] text-white py-12 md:py-16 lg:py-20 border-b border-purple-950/40">
        {/* Ornamen Latar Belakang Geometris ala Cakap (Panah Pertumbuhan & Gelombang Cahaya) */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
          {/* Panah Pertumbuhan Kompetensi di Kanan Atas */}
          <div className="absolute -top-6 right-8 lg:right-24 text-white/[0.07] hidden sm:block">
            <TrendingUp size={280} strokeWidth={1.2} />
          </div>

          {/* Radial Glow Halus di Tengah & Sisi Kanan */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#ffdf0f]/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-14">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Utama ================= */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge Identitas Lembaga Resmi */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ffdf0f] text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-[#ffdf0f] animate-pulse" />
                <span>Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok</span>
              </div>

              {/* Headline Jargon Utama (Kurang Skill? Pijar Aksara, Bikin Auto Nyala.) */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.12] mb-6">
                Kurang Skill?<br />
                <span className="text-white">Pijar Aksara, </span>
                <span className="text-[#ffdf0f] italic drop-shadow-[0_2px_12px_rgba(255,223,15,0.35)]">
                  Bikin Auto Nyala.
                </span>
              </h1>

              {/* Deskripsi Manfaat Vokasi */}
              <p className="text-purple-100/90 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan komunikasi kerja dengan kurikulum bertahap serta sertifikasi resmi berstandar industri.
              </p>

              {/* Call to Action Tombol Pill ala Cakap */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-8 py-4 rounded-full text-base font-black text-slate-950 bg-[#ffdf0f] hover:bg-[#ffe733] shadow-lg shadow-black/25 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 group cursor-pointer"
                >
                  <span>Belajar di Pijar Aksara</span>
                  <span className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform shrink-0">
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

              {/* Indikator Kepercayaan (Trust Indicators) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs text-purple-100">
                <div className="flex items-center justify-center lg:justify-start gap-2.5">
                  <CheckCircle2 size={18} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Modul Praktis Aplikatif</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2.5">
                  <Award size={18} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2.5">
                  <BookOpen size={18} className="text-[#ffdf0f] shrink-0" />
                  <span className="font-semibold">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* ================= KOLOM KANAN: Mockup Smartphone Ala Cakap ================= */}
            <div className="flex-1 w-full flex items-center justify-center lg:justify-end relative">
              {/* Cincin Geometris Kuning (#ffdf0f) di Kanan Bawah Sesuai Aksen Banner Cakap */}
              <div className="absolute -bottom-12 -right-12 sm:-right-8 w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[26px] border-[#ffdf0f]/20 pointer-events-none select-none z-0" />

              {/* Container Smartphone Interaktif */}
              <div className="relative z-10 w-full max-w-[310px] sm:max-w-[340px]">
                {/* Floating Badge 1 (Kiri Atas) */}
                <div className="absolute -top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-100/90 flex items-center gap-2.5 z-20 text-slate-800 hidden sm:flex">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 font-bold">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Akses LMS 24 Jam</p>
                    <p className="text-[10px] text-slate-500">Belajar mandiri fleksibel</p>
                  </div>
                </div>

                {/* Floating Badge 2 (Kanan Bawah) */}
                <div className="absolute -bottom-4 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-100/90 flex items-center gap-2.5 z-20 text-slate-800 hidden sm:flex">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Server Kuis Otomatis</p>
                    <p className="text-[10px] text-slate-500">Evaluasi kelulusan instan</p>
                  </div>
                </div>

                {/* Phone Bezel */}
                <div className="relative mx-auto rounded-[38px] border-[8px] border-slate-900 bg-slate-900 shadow-2xl shadow-purple-950/70 overflow-hidden ring-1 ring-white/20">
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30" />

                  {/* Layar Aplikasi Pijar Aksara */}
                  <div className="bg-slate-50 text-slate-900 pt-8 pb-4 px-3.5 select-none">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 px-1 mb-2.5">
                      <span>09:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">5G</span>
                        <div className="w-4 h-2 rounded-xs border border-slate-600 p-[1px]">
                          <div className="h-full w-3/4 bg-slate-700 rounded-xs" />
                        </div>
                      </div>
                    </div>

                    {/* App Header Bar ala Cakap */}
                    <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/70 mb-2.5">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#843bab] flex items-center justify-center font-bold text-[10px]">
                            PA
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-tight">Pilih Kursus Vokasi</p>
                            <p className="text-[9px] text-slate-500">Pilih modul untuk tingkatkan skill</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#843bab] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                          Resmi
                        </span>
                      </div>

                      {/* Category Chips ala Cakap */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-2.5 py-1 rounded-full bg-[#843bab] text-white font-bold">
                          Kesiapan Kerja
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          Usaha UMKM
                        </span>
                      </div>
                    </div>

                    {/* Daftar Kursus ala Cakap (Course List inside Phone) */}
                    <div className="space-y-1.5 mb-2.5">
                      {/* Item 1: Excel & Administrasi Perkantoran */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet size={15} />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">
                              Administrasi &amp; Excel
                            </p>
                            <p className="text-[9px] text-slate-500">12 Modul • Formula Laporan</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">
                          Populer
                        </span>
                      </div>

                      {/* Item 2: Desain Grafis Canva */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                            <Palette size={15} />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">
                              Desain Konten Canva
                            </p>
                            <p className="text-[9px] text-slate-500">8 Modul • Feed &amp; Banner</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold text-[#843bab] bg-purple-50 px-1.5 py-0.5 rounded-xs">
                          Favorit
                        </span>
                      </div>

                      {/* Item 3: Pembukuan UMKM */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Calculator size={15} />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">
                              Dasar Pembukuan UMKM
                            </p>
                            <p className="text-[9px] text-slate-500">6 Modul • Laba Rugi Kas</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-xs">
                          Praktis
                        </span>
                      </div>

                      {/* Item 4: Public Speaking */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Mic size={15} />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">
                              Public Speaking Kantor
                            </p>
                            <p className="text-[9px] text-slate-500">6 Modul • Presentasi Kerja</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-xs">
                          Karir
                        </span>
                      </div>

                      {/* Item 5: Bahasa Inggris */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <Languages size={15} />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">
                              Bahasa Inggris Kerja
                            </p>
                            <p className="text-[9px] text-slate-500">10 Modul • Speaking Aktif</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-xs">
                          Bisnis
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi di Layar HP */}
                    <div className="pt-1">
                      <div className="w-full py-2 rounded-xl bg-[#ffdf0f] text-slate-950 font-black text-[11px] text-center shadow-xs">
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
