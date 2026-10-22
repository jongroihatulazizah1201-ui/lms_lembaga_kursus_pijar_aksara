import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedCourses } from '@/lib/courses';
import CourseCard from '@/components/CourseCard';
import { Search, BookOpen, Filter, CheckCircle2, Users, Tag, ArrowUpDown } from 'lucide-react';

interface Props {
  searchParams: Promise<{
    kategori?: string;
    q?: string;
    harga?: 'gratis' | 'berbayar' | 'semua';
  }>;
}

// 1. Konfigurasi SEO Terindeks Google (Akses Publik Penuh)
export const metadata: Metadata = {
  title: 'Kelas Kursus Vokasi & Pelatihan Terakreditasi | Pijar Aksara',
  description: 'Jelajahi daftar kursus terbit di Lembaga Kursus Pijar Aksara Depok. Pelatihan vokasi berkualitas dengan opsi gratis dan berbayar: Teknologi Komputer, Desain Grafis, Pembukuan Bisnis UMKM, dan Bahasa Asing.',
  keywords: [
    'katalog kursus depok',
    'kursus vokasi depok',
    'kursus gratis depok',
    'pelatihan komputer kerja',
    'pijar aksara',
    'kursus excel depok',
    'kursus canva umkm',
    'kursus akuntansi pemula'
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/kursus',
  },
  openGraph: {
    title: 'Katalog Kursus Vokasi & Pelatihan Terakreditasi | Pijar Aksara',
    description: 'Daftar kursus terbit di Lembaga Kursus Pijar Aksara Depok. Belajar bertahap dengan bimbingan instruktur profesional dan sertifikat resmi.',
    url: 'https://pijaraksara.id/kursus',
    siteName: 'Lembaga Kursus Pijar Aksara',
    locale: 'id_ID',
    type: 'website',
  },
};

export default async function KatalogPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams?.kategori || 'Semua';
  const searchQuery = resolvedParams?.q || '';
  const activePrice = resolvedParams?.harga || 'semua';

  // Ambil daftar kursus terbit dari database
  const courses = await getPublishedCourses(
    activeCategory === 'Semua' ? undefined : activeCategory,
    searchQuery || undefined,
    activePrice === 'semua' ? undefined : activePrice
  );

  // Kategori resmi kursus tersinkronisasi 100% dengan database Supabase
  const categories = ['Semua', 'Perkantoran', 'Desain', 'Bahasa', 'Keuangan', 'Pengembangan Diri'];

  // Total stat counter
  const freeCoursesCount = courses.filter((c) => c.harga === 0).length;
  const paidCoursesCount = courses.filter((c) => c.harga > 0).length;

  // Schema.org Structured Data (JSON-LD) untuk Google Search Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Katalog Kursus Lembaga Kursus Pijar Aksara',
    description: 'Daftar program kursus vokasi dan pelatihan keterampilan kerja di Pijar Aksara Depok.',
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.judul,
        description: course.ringkasan,
        provider: {
          '@type': 'Organization',
          name: 'Lembaga Kursus Pijar Aksara',
          sameAs: 'https://pijaraksara.id',
        },
        offers: {
          '@type': 'Offer',
          price: course.harga,
          priceCurrency: 'IDR',
          category: course.harga === 0 ? 'Free' : 'Paid',
          availability:
            course.sisa_kursi > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Blended',
          instructor: {
            '@type': 'Person',
            name: course.instruktur_nama,
          },
        },
      },
    })),
  };

  const buildQueryUrl = (newCategory?: string, newPrice?: string) => {
    const params = new URLSearchParams();
    const cat = newCategory !== undefined ? newCategory : activeCategory;
    const prc = newPrice !== undefined ? newPrice : activePrice;

    if (cat && cat !== 'Semua') params.set('kategori', cat);
    if (searchQuery) params.set('q', searchQuery);
    if (prc && prc !== 'semua') params.set('harga', prc);

    const qs = params.toString();
    return qs ? `/kursus?${qs}` : '/kursus';
  };

  return (
    <>
      {/* Injeksi Schema.org JSON-LD untuk Search Engine Indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white min-h-screen py-8 md:py-12 text-slate-900">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Header Title & Subtitle */}
          <header className="space-y-2 max-w-3xl pt-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Kelas Kursus Vokasi & Pelatihan
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Tingkatkan keahlian kerja praktis Anda dengan kurikulum bertahap berstandar industri. Seluruh kursus yang tampil di halaman ini berstatus terbit dan siap menerima peserta.
            </p>
          </header>

          {/* Search Bar & Fast Filters Toolbar */}
          <section
            aria-label="Pencarian dan Filter Kursus"
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
          >
            {/* Search Input Row */}
            <form method="GET" action="/kursus" className="flex flex-col sm:flex-row items-center gap-3">
              {activeCategory !== 'Semua' && (
                <input type="hidden" name="kategori" value={activeCategory} />
              )}
              {activePrice !== 'semua' && (
                <input type="hidden" name="harga" value={activePrice} />
              )}

              <div className="relative flex-1 w-full">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Cari judul materi, nama instruktur, atau kata kunci kursus..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-xs transition-colors min-h-[46px] cursor-pointer"
                >
                  <Search size={15} />
                  <span>Cari Kursus</span>
                </button>

                {(searchQuery || activeCategory !== 'Semua' || activePrice !== 'semua') && (
                  <Link
                    href="/kursus"
                    className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shrink-0 min-h-[46px] flex items-center"
                    title="Reset Semua Filter"
                  >
                    Reset
                  </Link>
                )}
              </div>
            </form>

            {/* Filter Tabs: Kategori & Harga */}
            <div className="pt-3 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Kategori */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter Kategori:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((kat) => {
                    const isActive = activeCategory === kat;
                    return (
                      <Link
                        key={kat}
                        href={buildQueryUrl(kat, undefined)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all min-h-[34px] inline-flex items-center ${
                          isActive
                            ? 'bg-[#843bab] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {kat}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Filter Biaya: Gratis vs Berbayar */}
              <div className="space-y-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter Biaya:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'gratis', label: 'Gratis (Rp0)' },
                    { id: 'berbayar', label: 'Berbayar' },
                  ].map((p) => {
                    const isActive = activePrice === p.id;
                    return (
                      <Link
                        key={p.id}
                        href={buildQueryUrl(undefined, p.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[34px] inline-flex items-center ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {p.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong>{courses.length}</strong> kursus terbit
              {activeCategory !== 'Semua' && ` pada kategori "${activeCategory}"`}
              {searchQuery && ` dengan kata kunci "${searchQuery}"`}
              {activePrice !== 'semua' && ` (${activePrice === 'gratis' ? 'Gratis' : 'Berbayar'})`}
            </span>
          </div>

          {/* Course Cards Grid */}
          <main id="katalog-grid" className="space-y-8">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <BookOpen size={48} className="mx-auto text-slate-300" />
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Tidak Ada Kursus Terbit Ditemukan
                </h3>
                <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                  Tidak ditemukan kursus yang cocok dengan kombinasi kategori &ldquo;{activeCategory}&rdquo;, filter harga &ldquo;{activePrice}&rdquo;, atau kata kunci yang dimasukkan.
                </p>
                <div>
                  <Link
                    href="/kursus"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-colors min-h-[44px]"
                  >
                    <span>Tampilkan Seluruh Kursus Terbit</span>
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
