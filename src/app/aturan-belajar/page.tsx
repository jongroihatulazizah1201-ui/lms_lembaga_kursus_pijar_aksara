import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CourseRulesClient from '@/components/CourseRulesClient';

export const metadata: Metadata = {
  title: 'Aturan & Pedoman Kursus | Lembaga Kursus Pijar Aksara',
  description:
    'Pedoman lengkap standar kelulusan kuis, alur sekuensial anti-skip, penerbitan sertifikat kompetensi resmi ber-QR Code, dan kebijakan batas pembayaran Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AturanBelajarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/aturan-belajar');
  }

  // Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (profile?.peran === 'admin') {
    redirect('/admin/dashboard');
  } else if (profile?.peran === 'instruktur') {
    redirect('/instruktur');
  }

  return (
    <CourseRulesClient
      userProfile={{
        nama_lengkap: profile?.nama_lengkap || 'Peserta',
        email: profile?.email || user.email || '',
      }}
    />
  );
}
