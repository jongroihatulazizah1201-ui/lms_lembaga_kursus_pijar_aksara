import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAntreanData } from '@/lib/antrean';
import AdminAntreanView from '@/components/AdminAntreanView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Antrean Operasional Admin | Lembaga Kursus Pijar Aksara',
  description: 'Antrean operasional terpadu admin untuk konfirmasi pembayaran batas waktu, tinjauan kursus baru, kapasitas kuota kritis, dan audit pendaftaran kedaluwarsa.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAntreanPage() {
  const supabase = await createClient();

  // 1. Verifikasi Autentikasi di Level Server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/antrean');
  }

  // 2. Verifikasi Peran Admin di Server dan RLS (Defense-in-Depth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    redirect('/kursus-saya');
  }

  // 3. Ambil data 4 antrean melalui client terautentikasi (mematuhi RLS admin)
  const antreanData = await getAntreanData(supabase);

  return <AdminAntreanView initialData={antreanData} />;
}
