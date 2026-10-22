import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RegisterForm from '@/components/RegisterForm';

interface PageProps {
  searchParams: Promise<{
    redirect?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { redirect: redirectParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika pengguna sudah terautentikasi, arahkan langsung ke halaman sesuai perannya
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profile?.peran === 'admin') {
      redirect('/admin/dashboard');
    } else if (profile?.peran === 'instruktur') {
      redirect('/instruktur');
    } else {
      if (
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('/login') &&
        !redirectParam.startsWith('/register') &&
        !redirectParam.startsWith('/profil')
      ) {
        redirect(redirectParam);
      }
      redirect('/kursus-saya');
    }
  }

  return <RegisterForm redirectParam={redirectParam} />;
}
