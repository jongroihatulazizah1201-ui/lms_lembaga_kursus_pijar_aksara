import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Daftar Akun Peserta | Lembaga Kursus Pijar Aksara',
  description: 'Pendaftaran akun baru peserta pelatihan Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

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
