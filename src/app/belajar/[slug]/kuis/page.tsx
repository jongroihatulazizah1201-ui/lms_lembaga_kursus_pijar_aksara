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
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Akses Kuis Terbatas
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
            {errModules?.message || 'Kuis hanya dapat diakses oleh peserta dengan pendaftaran berstatus aktif atau selesai.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/kursus/${slug}`} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <BookOpen size={16} />
              <span>Detail Kursus</span>
            </Link>
            <Link href="/kursus-saya" className="btn btn-outline" style={{ padding: '10px 20px' }}>
              <ArrowLeft size={16} />
              <span>Kursus Saya</span>
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
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Modul {currentModule.urutan} Masih Terkunci
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
            Modul terbuka berurutan. Anda wajib menyelesaikan modul sebelumnya sebelum dapat mengerjakan kuis modul ini.
          </p>
          <Link href={`/belajar/${slug}?modul=${currentModule.urutan - 1}`} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <ArrowLeft size={16} />
            <span>Kembali ke Modul {currentModule.urutan - 1}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Cek apakah materi sudah dibaca (BR-08: Kuis hanya dapat dikerjakan setelah materi dibaca)
  if (!currentModule.materi_dibaca_pada && currentModule.status_akses !== 'lulus') {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <BookOpen size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Materi Belum Selesai Dibaca
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
            Sesuai aturan bisnis, Anda wajib membaca materi dan menandai &quot;Tandai Materi Sudah Dibaca&quot; sebelum dapat memulai pengerjaan kuis.
          </p>
          <Link href={`/belajar/${slug}?modul=${currentModule.urutan}`} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <BookOpen size={16} />
            <span>Buka Materi Modul {currentModule.urutan}</span>
          </Link>
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
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <ShieldAlert size={32} color="#f87171" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Gagal Memuat Kuis
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px' }}>
            {errQuestions.message}
          </p>
          <Link href={`/belajar/${slug}?modul=${currentModule.urutan}`} className="btn btn-outline" style={{ padding: '10px 20px' }}>
            <ArrowLeft size={16} />
            <span>Kembali ke Materi</span>
          </Link>
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
