import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Award, CheckCircle } from 'lucide-react';
import { getPublishedCourses } from '@/lib/courses';
import PopularCoursesCarousel from '@/components/PopularCoursesCarousel';

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-white min-h-screen">
      {/* =========================================================================
          HERO SECTION: 2 Kolom Desktop, Stack Vertikal Mobile (flex-col md:flex-row)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Kolom 1: Konten Utama Hero */}
            <div className="flex-1 text-center md:text-left">
              {/* Sub-heading Institusional Murni Tanpa Kotak / Background */}
              <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-[#843bab] mb-4">
                Lembaga Kursus &amp; Pelatihan Vokasi Resmi di Kota Depok
              </p>

              {/* Headline Tipografi Tegas & Bersih */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14] mb-6">
                Tingkatkan Keterampilan Praktis &{' '}
                <span className="text-[#843bab]">
                  Kompetensi Kerja
                </span>
              </h1>

              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 mb-8">
                Kuasai keahlian administrasi perkantoran, desain konten media sosial, pembukuan UMKM, dan bahasa asing percakapan dengan kurikulum bertahap serta sertifikasi resmi berstandar industri.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <a
                  href="#katalog"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Jelajahi Paket Populer</span>
                  <ArrowRight size={16} />
                </a>
                <Link
                  href="/kursus"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  <span>Buka Semua Kursus</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 mt-10 border-t border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Modul Bertahap Terstruktur</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Award size={16} className="text-[#843bab] shrink-0" />
                  <span className="font-semibold text-slate-700">Sertifikat Nomor Registrasi</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <BookOpen size={16} className="text-slate-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Evaluasi Standar Kelulusan</span>
                </div>
              </div>
            </div>

            {/* Kolom 2: Kartu Informasi Institusi Desktop */}
            <div className="flex-1 w-full max-w-md hidden md:block">
              <div className="p-8 rounded-3xl bg-white border border-[#843bab]/30 shadow-lg">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <Image
                        src="/logo-pijar-aksara.png"
                        alt="Logo Lembaga Kursus Pijar Aksara"
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        LMS Pijar Aksara
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Pelatihan Kompetensi Kerja Vokasi
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#843bab] bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-md">
                    Program Resmi
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Akses Belajar Mandiri</span>
                    <span className="text-xs font-bold text-slate-900">Aktif 24 Jam</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Evaluasi Kuis Modul</span>
                    <span className="text-xs font-bold text-[#843bab]">Server Otomatis</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Format Sertifikat Kelulusan</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">PA-TAHUN-NOMOR</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 text-center">
                  <p className="text-xs font-semibold text-slate-700">
                    Kurikulum teruji untuk kesiapan kerja dan usaha mandiri.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PAKET POPULER KURSUS (Model Carousel Horizontal Sesuai Contoh Gambar 2)
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
