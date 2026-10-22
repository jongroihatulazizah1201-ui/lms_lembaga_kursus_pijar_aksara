import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{
    redirect?: string;
  }>;
}

export default async function DaftarPage({ searchParams }: PageProps) {
  const { redirect: redirectParam } = await searchParams;
  if (redirectParam) {
    redirect(`/register?redirect=${encodeURIComponent(redirectParam)}`);
  }
  redirect('/register');
}
