import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CourseEditor from '@/components/CourseEditor';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Editor Kursus & Silabus | Lembaga Kursus Pijar Aksara',
  description: 'Editor materi modul dan bank soal kuis untuk instruktur.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/instruktur/kursus/${id}`);
  }

  // 1. Verifikasi peran
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    redirect('/kursus-saya');
  }

  // 2. Ambil data kursus beserta seluruh modul dan butir soal kuis (BR-12: Isolasi kepemilikan)
  const { data: course, error } = await supabase
    .from('kursus')
    .select(`
      id,
      instruktur_id,
      judul,
      slug,
      kategori,
      ringkasan,
      deskripsi,
      harga,
      kuota,
      nilai_lulus,
      status,
      catatan_tinjauan,
      modul (
        id,
        urutan,
        judul,
        isi_materi,
        video_url,
        lampiran_path,
        durasi_menit,
        soal (
          id,
          urutan,
          pertanyaan,
          pilihan_a,
          pilihan_b,
          pilihan_c,
          pilihan_d,
          kunci_jawaban
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !course) {
    notFound();
  }

  // Validasi Kepemilikan (BR-12): Instruktur tidak bisa membuka kursus instruktur lain
  if (profile.peran !== 'admin' && course.instruktur_id !== user.id) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Akses Ditolak (BR-12)
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sesuai aturan bisnis, instruktur hanya dapat mengelola kursus miliknya sendiri. Anda tidak memiliki akses ke kursus ini.
          </p>
          <div className="pt-2">
            <Link
              href="/instruktur"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold shadow-xs transition-all"
            >
              <ArrowLeft size={15} />
              <span>Kembali ke Dashboard Instruktur</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6">
      <CourseEditor course={course as any} />
    </div>
  );
}
