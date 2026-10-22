import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import InstructorGradebook, { CourseSummary } from '@/components/InstructorGradebook';
import { ShieldAlert, BookOpen, Plus, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Peserta & Nilai Kuis | Lembaga Kursus Pijar Aksara',
  description: 'Rekapitulasi data peserta, progres belajar, nilai terbaik, dan jumlah percobaan kuis per modul bagi instruktur dan admin.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: Promise<{ kursus?: string }>;
}

export default async function InstructorGradebookPage({ searchParams }: Props) {
  const { kursus } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/instruktur/nilai');
  }

  // 1. Verifikasi peran instruktur pemilik atau admin (Route Guard)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    redirect('/kursus-saya');
  }

  // 2. Ambil seluruh kursus: jika instruktur hanya milik sendiri (BR-12), jika admin seluruh kursus
  let courseQuery = supabase
    .from('kursus')
    .select(`
      id,
      judul,
      slug,
      status,
      kategori,
      instruktur_id,
      profiles:instruktur_id (
        nama_lengkap
      )
    `)
    .order('dibuat_pada', { ascending: false });

  if (profile.peran !== 'admin') {
    courseQuery = courseQuery.eq('instruktur_id', user.id);
  }

  const { data: courses, error: errCourses } = await courseQuery;

  if (errCourses || !courses || courses.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/60">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center mx-auto mb-5 shadow-xs">
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Belum Ada Kursus Ditemukan
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {profile.peran === 'admin'
              ? 'Belum ada kursus yang terdaftar dalam sistem LMS Lembaga Kursus Pijar Aksara.'
              : 'Anda belum memiliki kursus terdaftar. Buat kursus terlebih dahulu untuk memantau rekapitulasi peserta dan nilai kuis per modul.'}
          </p>
          {profile.peran === 'instruktur' ? (
            <Link
              href="/instruktur/kursus/baru"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#6c2e8f] text-white font-bold text-sm shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Buat Kursus Baru</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Panel Admin</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Tentukan kursus yang aktif (default ke kursus pertama jika tidak ditentukan di URL)
  const activeCourseId = kursus || courses[0].id;

  // 3. Panggil RPC get_peserta_dan_nilai_kursus yang menegakkan isolasi BR-12 di level database
  const { data: gradebookData, error: errGradebook } = await supabase.rpc(
    'get_peserta_dan_nilai_kursus',
    {
      p_kursus_id: activeCourseId,
    }
  );

  if (errGradebook || !gradebookData) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/60">
        <div className="bg-white rounded-3xl border border-red-200 p-8 sm:p-12 text-center max-w-lg shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Akses Ditolak (BR-12)
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {errGradebook?.message ||
              'Anda tidak memiliki izin untuk melihat rekapitulasi nilai kursus ini karena kursus bukan milik Anda.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={profile.peran === 'admin' ? '/admin' : '/instruktur'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              <span>Kembali ke Panel {profile.peran === 'admin' ? 'Admin' : 'Instruktur'}</span>
            </Link>
            {courses.length > 0 && (
              <Link
                href={`/instruktur/nilai?kursus=${courses[0].id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#6c2e8f] text-white font-bold text-sm shadow-sm transition-all"
              >
                <span>Lihat Kursus Anda</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formattedCourses: CourseSummary[] = courses.map((c: any) => ({
    id: c.id,
    judul: c.judul,
    slug: c.slug,
    status: c.status,
    kategori: c.kategori,
    instruktur_nama: c.profiles?.nama_lengkap || null,
  }));

  return (
    <InstructorGradebook
      initialData={gradebookData}
      instructorCourses={formattedCourses}
      currentUser={{
        id: user.id,
        nama_lengkap: profile.nama_lengkap || user.email || 'Pengguna',
        email: profile.email || user.email || '',
        peran: profile.peran as 'instruktur' | 'admin',
      }}
    />
  );
}
