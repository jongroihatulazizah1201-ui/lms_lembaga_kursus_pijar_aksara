'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Verifikasi Autentikasi Pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' };
  }

  // 2. Baca Field Form
  const namaLengkap = (formData.get('nama_lengkap') as string || '').trim();
  const rawNomorHp = (formData.get('nomor_hp') as string || '').trim();
  const removeAvatar = formData.get('remove_avatar') === 'true';
  const avatarFile = formData.get('avatar_file') as File | null;

  // 3. Validasi Nama Lengkap
  if (!namaLengkap) {
    return { error: 'Nama lengkap wajib diisi.' };
  }
  if (namaLengkap.length < 3 || namaLengkap.length > 100) {
    return { error: 'Nama lengkap harus antara 3 hingga 100 karakter.' };
  }

  // 4. Validasi & Normalisasi Nomor HP
  let cleanHp = '';
  if (rawNomorHp) {
    cleanHp = rawNomorHp.replace(/[^0-9]/g, '');
    if (cleanHp.startsWith('62')) {
      cleanHp = '0' + cleanHp.slice(2);
    }
    if (!/^08[0-9]{8,11}$/.test(cleanHp)) {
      return {
        error: 'Format nomor HP tidak valid. Gunakan format 08xxxxxxxxxx (10 hingga 13 digit).',
      };
    }
  }

  // 5. Penanganan Foto Profil (Avatar)
  let newAvatarUrl: string | null | undefined = undefined;

  if (removeAvatar) {
    newAvatarUrl = null;
  } else if (avatarFile && avatarFile.size > 0) {
    // Validasi Ukuran File (Maksimal 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (avatarFile.size > MAX_SIZE) {
      return { error: 'Ukuran foto profil maksimal 5 MB.' };
    }

    // Validasi Tipe File
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(avatarFile.type)) {
      return { error: 'Format gambar tidak didukung. Harap gunakan file JPG, PNG, atau WebP.' };
    }

    // Tentukan ekstensi
    let ext = 'jpg';
    if (avatarFile.type === 'image/png') ext = 'png';
    else if (avatarFile.type === 'image/webp') ext = 'webp';
    else if (avatarFile.type === 'image/gif') ext = 'gif';

    const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;

    try {
      const fileBuffer = await avatarFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBuffer, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Gagal upload avatar ke storage:', uploadError);
        return { error: `Gagal mengunggah foto profil: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      newAvatarUrl = publicUrlData.publicUrl;
    } catch (err: any) {
      console.error('Error proses avatar:', err);
      return { error: 'Terjadi kendala saat memproses berkas foto profil.' };
    }
  }

  // 6. Siapkan Payload Update Database
  const updatePayload: {
    nama_lengkap: string;
    no_hp: string | null;
    avatar_url?: string | null;
  } = {
    nama_lengkap: namaLengkap,
    no_hp: cleanHp || null,
  };

  if (newAvatarUrl !== undefined) {
    updatePayload.avatar_url = newAvatarUrl;
  }

  // 7. Simpan ke tabel public.profiles
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (updateError) {
    console.error('Gagal update profiles:', updateError);
    return { error: `Gagal memperbarui profil: ${updateError.message}` };
  }

  // 8. Sinkronisasi Cache Tampilan
  revalidatePath('/', 'layout');
  revalidatePath('/profil');
  revalidatePath('/kursus-saya');

  return {
    success: true,
    message: 'Profil dan informasi akun Anda berhasil diperbarui.',
    avatarUrl: newAvatarUrl,
  };
}
