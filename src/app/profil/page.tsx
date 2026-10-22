import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from '@/components/ProfileClient';

export const metadata: Metadata = {
  title: 'Profil Saya | Lembaga Kursus Pijar Aksara',
  description: 'Pengaturan akun, nama lengkap, foto profil, dan nomor handphone pengguna di Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profil');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, no_hp, peran, avatar_url, dibuat_pada')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Gagal mengambil data profil:', error);
    redirect('/login?redirect=/profil');
  }

  return (
    <ProfileClient
      profile={{
        id: profile.id,
        nama_lengkap: profile.nama_lengkap,
        email: profile.email || user.email || '',
        no_hp: profile.no_hp || null,
        peran: profile.peran,
        avatar_url: profile.avatar_url || null,
        dibuat_pada: profile.dibuat_pada,
      }}
    />
  );
}
