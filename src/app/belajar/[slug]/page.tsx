import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import LearningRoom from '@/components/LearningRoom';
import { BookOpen, ArrowLeft, ShieldAlert } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD: Ruang Belajar wajib noindex
export const metadata: Metadata = {
  title: 'Ruang Belajar | Lembaga Kursus Pijar Aksara',
  description: 'Ruang belajar peserta untuk membaca materi, menonton video, dan mengerjakan kuis berurutan.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ modul?: string }>;
}

export default async function RuangBelajarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { modul } = await searchParams;
  const initialUrutan = modul ? parseInt(modul, 10) : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/belajar/${slug}`);
  }

  // Ambil data modul dan status akses berurutan lewat RPC get_ruang_belajar (BR-08)
  const { data: modules, error } = await supabase.rpc('get_ruang_belajar', {
    p_slug: slug,
  });

  // Jika ditolak oleh database (belum terdaftar aktif atau kursus tidak ditemukan)
  if (error || !modules || modules.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Akses Ruang Belajar Terbatas
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed">
            {error?.message ||
              'Materi pembelajaran hanya dapat dibuka oleh peserta dengan pendaftaran berstatus aktif atau selesai (BR-08).'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
            <Link
              href={`/kursus/${slug}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs transition-all"
            >
              <BookOpen size={16} />
              <span>Detail & Pendaftaran Kursus</span>
            </Link>
            <Link
              href="/kursus-saya"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Kursus Saya</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const kursusJudul = modules[0]?.kursus_judul || 'Ruang Belajar Kursus';
  const pendaftaranId = modules[0]?.pendaftaran_id;

  // Ambil riwayat percobaan kuis untuk pendaftaran ini
  const { data: quizAttempts } = await supabase
    .from('percobaan_kuis')
    .select('id, modul_id, nomor_percobaan, nilai, lulus, dibuat_pada')
    .eq('pendaftaran_id', pendaftaranId)
    .order('dibuat_pada', { ascending: true });

  // Cek apakah sertifikat sudah terbit
  const { data: certificate } = await supabase
    .from('sertifikat')
    .select('id, nomor_sertifikat')
    .eq('pendaftaran_id', pendaftaranId)
    .maybeSingle();

  return (
    <LearningRoom
      kursusSlug={slug}
      kursusJudul={kursusJudul}
      pendaftaranId={pendaftaranId}
      modules={modules}
      quizAttempts={quizAttempts || []}
      certificate={certificate || null}
      initialUrutan={initialUrutan}
    />
  );
}
