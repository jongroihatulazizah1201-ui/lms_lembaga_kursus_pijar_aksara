'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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

  // Bersihkan cache layout agar nama/peran user langsung sinkron
  revalidatePath('/', 'layout');

  let targetUrl = '/kursus-saya';
  if (redirectTo && redirectTo.startsWith('/')) {
    targetUrl = redirectTo;
  } else if (profile.peran === 'admin') {
    targetUrl = '/admin';
  } else if (profile.peran === 'instruktur') {
    targetUrl = '/instruktur/kursus';
  } else {
    targetUrl = '/kursus-saya';
  }

  return { success: true, redirectTo: targetUrl };
}

export async function registerAction(formData: FormData) {
  const namaLengkap = (formData.get('nama_lengkap') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const rawNomorHp = (formData.get('nomor_hp') as string || '').trim();
  const password = formData.get('password') as string || '';
  const redirectTo = (formData.get('redirect') as string) || '';

  // 1. Validasi Kelengkapan Field
  if (!namaLengkap || !email || !rawNomorHp || !password) {
    return { error: 'Nama lengkap, email, nomor HP, dan kata sandi wajib diisi.' };
  }

  // 2. Validasi Nama Lengkap (3-100 karakter)
  if (namaLengkap.length < 3 || namaLengkap.length > 100) {
    return { error: 'Nama lengkap harus antara 3 hingga 100 karakter.' };
  }

  // 3. Validasi Format Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Format alamat email tidak valid.' };
  }

  // 4. Validasi & Normalisasi Nomor HP (Standar Indonesia 08xxxxxxxxxx, 10-13 digit)
  let cleanHp = rawNomorHp.replace(/[^0-9]/g, '');
  if (cleanHp.startsWith('62')) {
    cleanHp = '0' + cleanHp.slice(2);
  }
  if (!/^08[0-9]{8,11}$/.test(cleanHp)) {
    return { error: 'Format nomor HP tidak valid. Gunakan format 08xxxxxxxxxx (10-13 digit).' };
  }

  // 5. Validasi Kata Sandi Kuat (Strong Password)
  if (password.length < 8) {
    return { error: 'Kata sandi minimal 8 karakter.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: 'Kata sandi wajib mengandung minimal 1 huruf besar (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { error: 'Kata sandi wajib mengandung minimal 1 huruf kecil (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'Kata sandi wajib mengandung minimal 1 angka (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/~`']/.test(password)) {
    return { error: 'Kata sandi wajib mengandung minimal 1 karakter simbol / tanda khusus (!@#$%^&*).' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama_lengkap: namaLengkap,
        no_hp: cleanHp,
        peran: 'peserta', // Sesuai PRD Bagian 3: Akun baru selalu berperan Peserta
      },
    },
  });

  if (error || !data.user) {
    return { error: error?.message || 'Gagal mendaftar akun.' };
  }

  // Pastikan profile terisi di tabel profiles
  await supabase.from('profiles').upsert({
    id: data.user.id,
    nama_lengkap: namaLengkap,
    email: email,
    no_hp: cleanHp,
    peran: 'peserta',
    aktif: true,
  });

  // Login otomatis agar session langsung aktif di cookie browser
  if (!data.session) {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  // Bersihkan cache layout agar data user baru langsung aktif
  revalidatePath('/', 'layout');

  const targetUrl = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/kursus-saya';
  return { success: true, redirectTo: targetUrl };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
