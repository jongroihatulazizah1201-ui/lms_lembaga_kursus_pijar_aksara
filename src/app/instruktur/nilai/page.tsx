import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import InstructorGradebook from '@/components/InstructorGradebook';
import { ShieldAlert, BookOpen, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Peserta & Nilai Kuis | Lembaga Kursus Pijar Aksara',
  description: 'Rekapitulasi data peserta, progres belajar, dan nilai kuis per modul bagi instruktur.',
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/instruktur/nilai');
  }

  // 1. Verifikasi peran instruktur atau admin (Route Guard)
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    redirect('/kursus-saya');
  }

  // 2. Ambil seluruh kursus milik instruktur ini (BR-12)
  let courseQuery = supabase
    .from('kursus')
    .select('id, judul, status')
    .order('dibuat_pada', { ascending: false });

  if (profile.peran !== 'admin') {
    courseQuery = courseQuery.eq('instruktur_id', user.id);
  }

  const { data: courses, error: errCourses } = await courseQuery;

  if (errCourses || !courses || courses.length === 0) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <BookOpen size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Belum Ada Kursus Ditemukan
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            Anda belum memiliki kursus terdaftar. Buat kursus terlebih dahulu untuk melihat rekapitulasi peserta dan nilai kuis.
          </p>
          <Link href="/instruktur/kursus/baru" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <Plus size={16} />
            <span>Buat Kursus Baru</span>
          </Link>
        </div>
      </div>
    );
  }

  // Tentukan kursus yang aktif (default ke kursus pertama jika tidak ditentukan)
  const activeCourseId = kursus || courses[0].id;

  // 3. Panggil RPC get_peserta_dan_nilai_kursus yang menegakkan BR-12 di level database
  const { data: gradebookData, error: errGradebook } = await supabase.rpc('get_peserta_dan_nilai_kursus', {
    p_kursus_id: activeCourseId,
  });

  if (errGradebook || !gradebookData) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '520px' }}>
          <ShieldAlert size={36} color="#f87171" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
            Akses Ditolak (BR-12)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            {errGradebook?.message || 'Anda tidak memiliki hak akses untuk melihat peserta kursus ini.'}
          </p>
          <Link href="/instruktur" className="btn btn-outline" style={{ padding: '10px 20px' }}>
            <span>Kembali ke Dashboard Instruktur</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '36px 16px 96px 16px' }}>
      <InstructorGradebook
        initialData={gradebookData}
        instructorCourses={courses}
      />
    </div>
  );
}
