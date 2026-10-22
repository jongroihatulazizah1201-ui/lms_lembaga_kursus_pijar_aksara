'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '';

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || 'Email atau kata sandi salah.' };
  }

  // Ambil profil untuk menentukan redirect sesuai peran
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran, aktif')
    .eq('id', data.user.id)
    .single();

  if (!profile || !profile.aktif) {
    await supabase.auth.signOut();
    return { error: 'Akun Anda dinonaktifkan. Silakan hubungi admin.' };
  }

  // Jika ada query redirect spesifik (misal dari halaman kursus tertentu)
  if (redirectTo && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  // Arahkan ke dashboard sesuai peran
  if (profile.peran === 'admin') {
    redirect('/admin');
  } else if (profile.peran === 'instruktur') {
    redirect('/instruktur/kursus');
  } else {
    redirect('/kursus-saya');
  }
}

export async function registerAction(formData: FormData) {
  const namaLengkap = formData.get('nama_lengkap') as string;
  const email = formData.get('email') as string;
  const nomorHp = formData.get('nomor_hp') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '';

  if (!namaLengkap || !email || !password) {
    return { error: 'Nama lengkap, email, dan kata sandi wajib diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Kata sandi minimal 6 karakter.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama_lengkap: namaLengkap,
        nomor_hp: nomorHp || null,
        peran: 'peserta', // Sesuai PRD Bagian 3: Akun baru selalu berperan Peserta
      },
    },
  });

  if (error || !data.user) {
    return { error: error?.message || 'Gagal mendaftar akun.' };
  }

  // Pastikan profile terisi (trigger handle_new_user atau upsert)
  await supabase.from('profiles').upsert({
    id: data.user.id,
    nama_lengkap: namaLengkap,
    email: email,
    nomor_hp: nomorHp || null,
    peran: 'peserta',
    aktif: true,
  });

  if (redirectTo && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  redirect('/kursus-saya');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
