import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import QuizWorkspace from '@/components/QuizWorkspace';
import { ShieldAlert, BookOpen, ArrowLeft, Lock } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Ruang Kuis wajib noindex
export const metadata: Metadata = {
  title: 'Kuis Evaluasi Modul | Lembaga Kursus Pijar Aksara',
  description: 'Evaluasi pemahaman materi modul kursus secara objektif dan instan.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ modul?: string }>;
}

export default async function QuizPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { modul } = await searchParams;
  const targetUrutan = modul ? parseInt(modul, 10) : 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/belajar/${slug}/kuis?modul=${targetUrutan}`);
  }

  // 1. Ambil data ruang belajar lewat RPC get_ruang_belajar (BR-08)
  const { data: modules, error: errModules } = await supabase.rpc('get_ruang_belajar', {
    p_slug: slug,
  });

  if (errModules || !modules || modules.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Akses Kuis Terbatas
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {errModules?.message || 'Kuis hanya dapat diakses oleh peserta dengan pendaftaran berstatus aktif atau selesai.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
            <Link
              href={`/kursus/${slug}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs transition-all"
            >
              <BookOpen size={16} />
              <span>Detail Kursus</span>
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

  // 2. Cari modul yang sedang dipilih
  const currentModule = modules.find((m: any) => m.urutan === targetUrutan) || modules[0];
  const pendaftaranId = currentModule.pendaftaran_id;
  const kursusJudul = currentModule.kursus_judul || 'Ruang Belajar Kursus';

  // 3. Validasi aturan bisnis BR-08 di server side
  if (currentModule.status_akses === 'terkunci') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Modul {currentModule.urutan} Masih Terkunci
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Modul terbuka berurutan. Anda wajib menyelesaikan modul sebelumnya sebelum dapat mengerjakan kuis modul ini.
          </p>
          <div className="pt-3 flex justify-center">
            <Link
              href={`/belajar/${slug}?modul=${currentModule.urutan - 1}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs transition-all"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Modul {currentModule.urutan - 1}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cek apakah materi sudah dibaca (BR-08: Kuis hanya dapat dikerjakan setelah materi dibaca)
  if (!currentModule.materi_dibaca_pada && currentModule.status_akses !== 'lulus') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Materi Belum Selesai Dibaca
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sesuai aturan bisnis, Anda wajib membaca materi dan menekan tombol &quot;Tandai Materi Sudah Dibaca&quot; sebelum dapat memulai pengerjaan kuis.
          </p>
          <div className="pt-3 flex justify-center">
            <Link
              href={`/belajar/${slug}?modul=${currentModule.urutan}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs transition-all"
            >
              <BookOpen size={16} />
              <span>Buka Materi Modul {currentModule.urutan}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Ambil soal kuis tanpa kunci jawaban lewat RPC get_soal_kuis (BR-09)
  const { data: questions, error: errQuestions } = await supabase.rpc('get_soal_kuis', {
    p_modul_id: currentModule.modul_id,
  });

  if (errQuestions) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Gagal Memuat Kuis
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {errQuestions.message}
          </p>
          <div className="pt-3 flex justify-center">
            <Link
              href={`/belajar/${slug}?modul=${currentModule.urutan}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Materi</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Hitung riwayat percobaan untuk modul ini (BR-10: Maksimal 3 kali percobaan)
  const { count: attemptCount } = await supabase
    .from('percobaan_kuis')
    .select('id', { count: 'exact', head: true })
    .eq('pendaftaran_id', pendaftaranId)
    .eq('modul_id', currentModule.modul_id);

  const alreadyPassed = currentModule.status_akses === 'lulus';

  return (
    <QuizWorkspace
      kursusSlug={slug}
      kursusJudul={kursusJudul}
      pendaftaranId={pendaftaranId}
      modulId={currentModule.modul_id}
      modulUrutan={currentModule.urutan}
      modulJudul={currentModule.judul}
      nilaiLulus={70} // PRD BR-09: Nilai kelulusan minimal adalah 70
      totalModul={modules.length}
      riwayatPercobaanCount={attemptCount || 0}
      alreadyPassed={alreadyPassed}
      questions={questions || []}
    />
  );
}
