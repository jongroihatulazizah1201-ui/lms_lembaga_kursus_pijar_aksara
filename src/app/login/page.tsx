import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from '@/components/LoginForm';

interface PageProps {
  searchParams: Promise<{
    redirect?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect: redirectParam, error: errorParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika sudah terotentikasi, segera arahkan langsung ke workspace peran tanpa render form login
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

  return <LoginForm redirectParam={redirectParam} errorParam={errorParam} />;
}
