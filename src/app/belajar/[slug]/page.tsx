import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import LearningRoom from '@/components/LearningRoom';
import { Lock, BookOpen, ArrowLeft, ShieldAlert } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Ruang Belajar wajib noindex
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
  const { data: { user } } = await supabase.auth.getUser();

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
            Akses Ruang Belajar Terbatas
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
            {error?.message || 'Materi pembelajaran hanya dapat dibuka oleh peserta dengan pendaftaran berstatus aktif atau selesai (BR-08).'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/kursus/${slug}`} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <BookOpen size={16} />
              <span>Detail & Pendaftaran Kursus</span>
            </Link>
            <Link href="/kursus-saya" className="btn btn-outline" style={{ padding: '10px 20px' }}>
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

  return (
    <LearningRoom
      kursusSlug={slug}
      kursusJudul={kursusJudul}
      pendaftaranId={pendaftaranId}
      modules={modules}
      initialUrutan={initialUrutan}
    />
  );
}
