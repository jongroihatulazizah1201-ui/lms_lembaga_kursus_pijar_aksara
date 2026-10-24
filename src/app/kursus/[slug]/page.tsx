import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/courses';
import { formatRupiah } from '@/components/CourseCard';
import { createClient } from '@/lib/supabase/server';
import EnrollButton from '@/components/EnrollButton';
import CourseIllustration from '@/components/CourseIllustration';
import {
  BookOpen,
  Clock,
  Users,
  Award,
  Lock,
  CheckCircle2,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  CalendarCheck,
  FileCheck2
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. Konfigurasi SEO Terindeks Google (Akses Publik Penuh)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Kursus Tidak Ditemukan | Pijar Aksara',
      robots: { index: false, follow: false },
    };
  }

  const hargaFormatted = course.harga === 0 ? 'Gratis' : formatRupiah(course.harga);
  const pageTitle = `${course.judul} | Kursus Vokasi & Pelatihan Pijar Aksara`;
  const pageDesc = `${course.ringkasan} Pelatihan vokasi terakreditasi berstandar industri di Lembaga Kursus Pijar Aksara Depok. Bimbingan instruktur profesional, sertifikat resmi, biaya ${hargaFormatted}.`;

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: [
      course.judul,
      course.kategori,
      'kursus vokasi depok',
      'pelatihan kerja depok',
      'kursus bersertifikat resmi',
      'lembaga kursus pijar aksara',
      'pijar aksara depok',
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
      canonical: `/kursus/${course.slug}`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://pijaraksara.id/kursus/${course.slug}`,
      siteName: 'Lembaga Kursus Pijar Aksara',
      locale: 'id_ID',
      type: 'article',
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  // BR-01: Kursus non-terbit (draf, ditinjau, ditutup) otomatis menghasilkan 404 bagi pengunjung publik
  if (!course) {
    notFound();
  }

  // Cek sesi autentikasi dan status pendaftaran user saat ini
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let myEnrollment: any = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('peran')
      .eq('id', user.id)
      .single();
    userRole = profile?.peran || null;

    const { data: enrollList } = await supabase.rpc('get_pendaftaran_saya', {
      p_kursus_id: course.id,
    });
    if (enrollList && enrollList.length > 0) {
      myEnrollment = enrollList[0];
    }
  }

  const isFree = course.harga === 0;
  const isFull = course.sisa_kursi <= 0;
  const isLastSeat = course.sisa_kursi === 1;

  // Total durasi seluruh modul (menit)
  const totalDurasi = course.modul.reduce((acc, m) => acc + (m.durasi_menit || 0), 0);

  // Schema.org Structured Data (JSON-LD) untuk Google Search Rich Snippet Course
  const courseJsonLd = {
    '@context': 'https://schema.org',
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
      category: isFree ? 'Free' : 'Paid',
      availability: isFull
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Blended',
      instructor: {
        '@type': 'Person',
        name: course.instruktur_nama,
      },
    },
  };

  // Persentase keterisian kursi untuk progress bar
  const percentFilled = Math.min(
    100,
    Math.round(((course.kuota - course.sisa_kursi) / course.kuota) * 100)
  );

  return (
    <>
      {/* Injeksi Schema.org JSON-LD untuk Indeks Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      <div className="bg-white min-h-screen text-slate-900 pb-20">
        {/* Breadcrumb Header Bar */}
        <nav aria-label="Navigasi Jejak" className="bg-slate-50 border-b border-slate-200 py-3.5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Beranda
              </Link>
              <ChevronRight size={13} className="text-slate-400" />
              <Link href="/kursus" className="hover:text-slate-900 transition-colors">
                Kelas Kursus
              </Link>
              <ChevronRight size={13} className="text-slate-400" />
              <span className="font-bold text-[#843bab] truncate max-w-[280px] sm:max-w-none">
                {course.judul}
              </span>
            </div>
          </div>
        </nav>

        {/* Hero Section: Info Utama & Ilustrasi Tematik */}
        <header className="bg-slate-50/70 border-b border-slate-200 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Kolom Kiri: Meta, Judul, Ringkasan, Metrics */}
              <div className="lg:col-span-7 space-y-4">
                {/* Badges: Kategori & Status Terbit */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] border border-[#843bab]/20">
                    {course.kategori}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Kursus Aktif & Terbit</span>
                  </span>
                  {isFree ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-[#843bab] border border-purple-200">
                      Gratis
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      Berbayar
                    </span>
                  )}
                </div>

                {/* Judul Utama Kursus */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {course.judul}
                </h1>

                {/* Ringkasan Kursus */}
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {course.ringkasan}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Standar Kelulusan
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Award size={16} className="text-[#843bab]" />
                      <span>Nilai &ge; {course.nilai_lulus}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Jumlah Modul
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <BookOpen size={16} className="text-[#843bab]" />
                      <span>{course.modul.length} Modul</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estimasi Durasi
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Clock size={16} className="text-emerald-600" />
                      <span>{totalDurasi} Menit</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kapasitas Kursi
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Users size={16} className="text-slate-700" />
                      <span>{course.kuota} Peserta</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Ilustrasi Tematik Kursus yang Memukau */}
              <div className="lg:col-span-5">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <CourseIllustration
                    slug={course.slug}
                    title={course.judul}
                    imageUrl={course.gambar_url}
                    className="h-52 sm:h-64 shadow-xs"
                  />
                  <div className="px-3 py-2 text-center text-xs font-semibold text-slate-500 border-t border-slate-100 mt-2">
                    Pelatihan Vokasi Resmi &bull; LKP Pijar Aksara Depok
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area: Detail Kursus & Sticky Checkout */}
        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Kolom Kiri: Deskripsi, Profil Instruktur, Silabus */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Deskripsi Program Kursus */}
              <section aria-labelledby="heading-deskripsi" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-[#843bab]/10 text-[#843bab] flex items-center justify-center shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <h2 id="heading-deskripsi" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Deskripsi Program Kursus
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {course.deskripsi}
                </div>
              </section>

              {/* 2. Profil Instruktur Pengajar */}
              <section aria-labelledby="heading-instruktur" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-[#843bab]/10 text-[#843bab] flex items-center justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <h2 id="heading-instruktur" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Instruktur Pengajar
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#843bab] to-[#591d7b] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User size={26} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {course.instruktur_nama}
                    </h3>
                    <p className="text-xs text-[#843bab] font-semibold mt-0.5">
                      Tenaga Pendidik Terverifikasi Lembaga Kursus Pijar Aksara
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Berpengalaman dalam kurikulum vokasi praktis, pendampingan belajar, dan standar kompetensi kerja industri.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Silabus & Kurikulum (BR-01 & BR-08: Judul dan Durasi Modul Saja) */}
              <section aria-labelledby="heading-silabus" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 id="heading-silabus" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Silabus & Kurikulum Modul
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Materi disusun berurutan. Peserta menyelesaikan modul secara bertahap untuk membuka materi selanjutnya.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-extrabold px-3 py-1 rounded-full bg-purple-50 text-[#843bab] border border-purple-100">
                    {course.modul.length} Modul Pembelajaran
                  </span>
                </div>

                {/* Daftar Modul (HANYA Judul dan Durasi) */}
                <div className="space-y-3">
                  {course.modul.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-[#843bab]/30 bg-slate-50/60 hover:bg-slate-50 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Nomor Urut Modul */}
                        <div className="w-8 h-8 rounded-lg bg-[#843bab]/10 text-[#843bab] flex items-center justify-center font-black text-xs shrink-0 border border-[#843bab]/20">
                          {m.urutan}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {m.judul}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                              <Clock size={12} className="text-emerald-600" />
                              <span>{m.durasi_menit} Menit</span>
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-500 text-[11px]">
                              Dilengkapi Kuis Evaluasi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Indikator Terkunci Publik (BR-08) */}
                      <div className="shrink-0 flex items-center gap-1.5 text-slate-400 text-xs">
                        <Lock size={15} />
                        <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                          Terkunci
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Catatan Privasi & Keamanan Modul */}
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-slate-700 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[#843bab] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Ketentuan Akses Akademik:</strong> Sesuai silabus resmi di atas, pengunjung publik dapat melihat ringkasan judul dan estimasi durasi belajar. Akses teks materi lengkap, video panduan, dan kuis evaluasi otomatis akan terbuka di ruang belajar setelah Anda terdaftar aktif.
                  </div>
                </div>
              </section>
            </div>

            {/* Kolom Kanan: Sticky Card Pendaftaran (Harga, Sisa Kursi, Tombol Daftar) */}
            <aside className="lg:col-span-4 sticky top-24 space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 space-y-5">
                {/* Header Biaya Pendaftaran */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Biaya Pendaftaran Kursus
                  </div>
                  <div className={`text-3xl font-black tracking-tight mt-1 ${isFree ? 'text-[#843bab]' : 'text-slate-900'}`}>
                    {formatRupiah(course.harga)}
                  </div>
                  {isFree && (
                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                      ✓ Akses materi dan sertifikat gratis
                    </p>
                  )}
                </div>

                {/* Sisa Kursi Alert Box (BR-06) */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isFull
                    ? 'bg-red-50 border-red-200'
                    : isLastSeat
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Ketersediaan Kursi:</span>
                    {isFull ? (
                      <span className="text-red-700 flex items-center gap-1">
                        <Lock size={12} />
                        Kuota Penuh
                      </span>
                    ) : isLastSeat ? (
                      <span className="text-amber-800 animate-pulse flex items-center gap-1">
                        <Users size={12} />
                        Sisa 1 Kursi Terakhir!
                      </span>
                    ) : (
                      <span className="text-[#843bab] flex items-center gap-1">
                        <Users size={12} />
                        Tersedia ({course.sisa_kursi} Kursi)
                      </span>
                    )}
                  </div>

                  {/* Progress Bar Kursi */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-red-500'
                          : isLastSeat
                          ? 'bg-amber-500'
                          : 'bg-[#843bab]'
                      }`}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isFull
                      ? 'Seluruh kursi pada kursus ini telah terisi penuh. Pendaftaran saat ini ditutup.'
                      : isLastSeat
                      ? 'Tinggal 1 kursi lagi sebelum pendaftaran ditutup. Daftarkan diri Anda sekarang!'
                      : `Tersisa ${course.sisa_kursi} dari total kuota ${course.kuota} kursi peserta.`}
                  </p>
                </div>

                {/* Tombol Daftar (EnrollButton) */}
                <div className="pt-1">
                  <EnrollButton
                    courseId={course.id}
                    slug={course.slug}
                    harga={course.harga}
                    sisaKursi={course.sisa_kursi}
                    initialEnrollment={myEnrollment}
                    isLoggedIn={!!user}
                    userRole={userRole}
                  />
                </div>

                {/* Garansi Benefit Kursus */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={15} className="text-[#843bab] shrink-0" />
                    <span>Sertifikat kelulusan ber-nomor registrasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Latihan kuis bertahap dengan evaluasi instan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[#843bab] shrink-0" />
                    <span>Akses fleksibel tanpa batas waktu belajar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                    <span>Kurikulum standar industri vokasi Depok</span>
                  </div>
                </div>
              </div>

              {/* Bantuan Pendaftaran Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-900">
                  Butuh bantuan seputar kursus?
                </div>
                <p className="text-[11px] text-slate-500">
                  Tim administrasi LKP Pijar Aksara siap melayani pertanyaan seputar jadwal, materi, maupun proses pembayaran.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
