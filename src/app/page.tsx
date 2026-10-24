import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  BookOpen,
  Award,
  CheckCircle2,
  Laptop,
  TrendingUp,
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4a136b] via-[#6d2797] to-[#380a52] text-white lg:h-[calc(100vh-80px)] lg:min-h-[520px] lg:max-h-[640px] flex flex-col justify-end border-b border-purple-950/30 pt-8 lg:pt-6 pb-0">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
            {/* ================= KOLOM KIRI: Jargon & Tipografi Terstruktur Rapi ================= */}
            <div className="lg:col-span-6 text-center lg:text-left max-w-xl mx-auto lg:mx-0 pb-8 lg:pb-12 pt-4">
              {/* Sub-heading Institusional Bersih (Ukuran Selaras: 13px, Bernapas & Elegan) */}
              <p className="text-xs sm:text-[13px] font-semibold tracking-wider uppercase text-purple-200/90 mb-4 sm:mb-4.5">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Jargon Utama (Titik Fokus Utama, Huruf Cepat Ternotice, Tanpa Titik, Jargon Miring) */}
              <h1 className="text-3xl sm:text-[36px] lg:text-[40px] xl:text-[43px] font-black text-white tracking-normal sm:tracking-[0.012em] leading-[1.18] mb-4.5 sm:mb-5">
                Kurang Skill?<br />
                <span>Pijar Aksara, </span>
                <span className="text-[#ffdf0f] italic">Bikin Auto Nyala</span>
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

            {/* ================= KOLOM KANAN: Talent Asli Memegang Smartphone + Bubble Chat Badges Kiri & Kanan ================= */}
            <div className="lg:col-span-6 flex items-end justify-center relative pb-0 mb-0">
              {/* Cincin Geometris Kuning Lembut di Belakang Talent */}
              <div className="absolute -bottom-8 -right-4 w-72 h-72 rounded-full border-[22px] border-[#ffdf0f]/20 pointer-events-none select-none z-0 hidden sm:block" />

              {/* Wrapper Talent & Bubble Chat Badges */}
              <div className="relative inline-flex items-end z-10">
                {/* Bubble Chat Kiri: Akses LMS 24 Jam (Menunjuk ke arah smartphone di sebelah kiri) */}
                <div className="flex absolute -left-3 sm:-left-6 top-3 sm:top-6 lg:top-20 xl:top-24 lg:left-auto lg:right-[calc(100%+14px)] z-30 bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-xs p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)] border border-purple-100/90 items-center gap-2 sm:gap-3 w-auto whitespace-nowrap hover:scale-105 transition-transform duration-200 group">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-xs">
                    <Laptop size={14} className="sm:w-[15px] sm:h-[15px]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-0.5">
                      <p className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight">Akses LMS 24 Jam</p>
                      <span className="text-[8px] sm:text-[8.5px] text-slate-400 font-medium">09:41</span>
                    </div>
                    <p className="text-[9px] sm:text-[9.5px] text-slate-500 font-medium leading-snug">Belajar mandiri fleksibel</p>
                  </div>
                  {/* Ekor Bubble Chat Kiri mengarah ke smartphone */}
                  <div className="absolute -right-2 top-3.5 sm:top-4 w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/95 filter drop-shadow-[2px_0_1px_rgba(0,0,0,0.04)]" />
                </div>

                {/* Bubble Chat Kanan: Server Kuis Otomatis (Menunjuk ke arah talent di sebelah kanan) */}
                <div className="flex absolute -right-3 sm:-right-6 bottom-8 sm:bottom-12 lg:bottom-auto lg:top-28 xl:top-32 lg:right-auto lg:left-[calc(100%+14px)] z-30 bg-white/95 backdrop-blur-md rounded-2xl rounded-tl-xs p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)] border border-purple-100/90 items-center gap-2 sm:gap-3 w-auto whitespace-nowrap hover:scale-105 transition-transform duration-200 group">
                  {/* Ekor Bubble Chat Kanan mengarah ke talent */}
                  <div className="absolute -left-2 top-3.5 sm:top-4 w-0 h-0 border-y-[5px] border-y-transparent border-r-[8px] border-r-white/95 filter drop-shadow-[-2px_0_1px_rgba(0,0,0,0.04)]" />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-0.5">
                      <p className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight">Server Kuis Otomatis</p>
                      <span className="text-[7.5px] sm:text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Baru</span>
                    </div>
                    <p className="text-[9px] sm:text-[9.5px] text-slate-500 font-medium leading-snug">Evaluasi kelulusan instan</p>
                  </div>
                </div>

                {/* Foto Talent Asli Memegang Smartphone (Rata Pas Menempel di Batas Bawah Section Ungu, Proporsi Utuh) */}
                <div className="relative flex justify-center items-end pb-0 mb-0">
                  <Image
                    src="/hero-talent.png"
                    alt="Talent Lembaga Kursus Pijar Aksara Menunjukkan Aplikasi Kursus di Smartphone"
                    width={560}
                    height={694}
                    priority
                    className="w-auto h-[290px] sm:h-[360px] lg:h-[450px] xl:h-[480px] max-w-full object-contain object-bottom block align-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)] pointer-events-none select-none transition-transform duration-300 hover:scale-[1.02]"
                  />
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
