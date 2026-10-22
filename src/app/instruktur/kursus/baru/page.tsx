import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CreateCourseForm from '@/components/CreateCourseForm';

export const metadata: Metadata = {
  title: 'Buat Kursus Baru | Lembaga Kursus Pijar Aksara',
  description: 'Formulir pembuatan kursus baru oleh instruktur.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/instruktur/kursus/baru');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    redirect('/kursus-saya');
  }

  return (
    <div style={{ padding: '40px 16px 96px 16px' }}>
      <CreateCourseForm />
    </div>
  );
}
