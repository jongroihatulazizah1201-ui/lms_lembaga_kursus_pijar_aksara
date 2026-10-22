import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CertificateView from '@/components/CertificateView';
import { ShieldAlert, ArrowLeft, BookOpen } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Halaman Sertifikat wajib noindex
export const metadata: Metadata = {
  title: 'Sertifikat Kelulusan | Lembaga Kursus Pijar Aksara',
  description: 'Sertifikat resmi tanda kelulusan kursus di Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/sertifikat/${id}`);
  }

  // Ambil detail sertifikat melalui RPC get_sertifikat_detail (BR-11, BR-12)
  const { data, error } = await supabase.rpc('get_sertifikat_detail', {
    p_identifier: id,
  });

  if (error || !data || data.length === 0) {
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
            Akses Sertifikat Terbatas
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
            {error?.message || 'Sertifikat ini tidak ditemukan atau Anda tidak memiliki hak akses untuk melihatnya sesuai aturan privasi (BR-12).'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/kursus-saya" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <ArrowLeft size={16} />
              <span>Kembali ke Kursus Saya</span>
            </Link>
            <Link href="/kursus" className="btn btn-outline" style={{ padding: '10px 20px' }}>
              <BookOpen size={16} />
              <span>Lihat Katalog Kursus</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certificate = data[0];

  return <CertificateView certificate={certificate} />;
}
