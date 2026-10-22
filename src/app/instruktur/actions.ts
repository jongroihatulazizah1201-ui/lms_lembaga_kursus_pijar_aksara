'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 1. Buat Kursus Baru (Otomatis Draf, BR-02)
export async function createKursusAction(formData: {
  judul: string;
  slug: string;
  kategori: string;
  ringkasan: string;
  deskripsi: string;
  harga: number;
  kuota: number;
  nilai_lulus?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Verifikasi peran instruktur atau admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    return { error: 'Hanya instruktur atau admin yang berhak membuat kursus.' };
  }

  // Validasi BR-03
  if (formData.harga !== 0 && (formData.harga < 50000 || formData.harga > 5000000)) {
    return { error: 'Harga kursus harus Rp0 (gratis) atau antara Rp50.000 hingga Rp5.000.000.' };
  }

  if (formData.kuota < 1 || formData.kuota > 100) {
    return { error: 'Kuota peserta harus antara 1 sampai 100 orang.' };
  }

  const { data, error } = await supabase
    .from('kursus')
    .insert({
      instruktur_id: user.id,
      judul: formData.judul,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
      kategori: formData.kategori,
      ringkasan: formData.ringkasan,
      deskripsi: formData.deskripsi,
      harga: formData.harga,
      kuota: formData.kuota,
      nilai_lulus: formData.nilai_lulus || 70,
      status: 'draf', // Selalu draf saat baru dibuat (BR-02, Tabel 6.1)
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/instruktur');
  return { success: true, kursus: data };
}

// 2. Perbarui Informasi Dasar Kursus
export async function updateKursusAction(id: string, formData: {
  judul: string;
  kategori: string;
  ringkasan: string;
  deskripsi: string;
  harga: number;
  kuota: number;
  nilai_lulus: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase
    .from('kursus')
    .update({
      judul: formData.judul,
      kategori: formData.kategori,
      ringkasan: formData.ringkasan,
      deskripsi: formData.deskripsi,
      harga: formData.harga,
      kuota: formData.kuota,
      nilai_lulus: formData.nilai_lulus,
      diubah_pada: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/instruktur');
  revalidatePath(`/instruktur/kursus/${id}`);
  return { success: true, kursus: data };
}

// 3. Tambah Modul Baru (Hanya saat draf, BR-04)
export async function createModulAction(formData: {
  kursus_id: string;
  urutan: number;
  judul: string;
  isi_materi: string;
  video_url?: string;
  durasi_menit: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase
    .from('modul')
    .insert({
      kursus_id: formData.kursus_id,
      urutan: formData.urutan,
      judul: formData.judul,
      isi_materi: formData.isi_materi,
      video_url: formData.video_url || null,
      durasi_menit: formData.durasi_menit,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/instruktur/kursus/${formData.kursus_id}`);
  return { success: true, modul: data };
}

// 4. Perbarui Modul (Hanya saat draf, BR-04)
export async function updateModulAction(modulId: string, kursusId: string, formData: {
  urutan: number;
  judul: string;
  isi_materi: string;
  video_url?: string;
  durasi_menit: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase
    .from('modul')
    .update({
      urutan: formData.urutan,
      judul: formData.judul,
      isi_materi: formData.isi_materi,
      video_url: formData.video_url || null,
      durasi_menit: formData.durasi_menit,
    })
    .eq('id', modulId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/instruktur/kursus/${kursusId}`);
  return { success: true, modul: data };
}

// 5. Hapus Modul (Hanya saat draf, BR-04)
export async function deleteModulAction(modulId: string, kursusId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { error } = await supabase
    .from('modul')
    .delete()
    .eq('id', modulId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/instruktur/kursus/${kursusId}`);
  return { success: true };
}

// 6. Tambah Soal Kuis (Hanya saat draf, BR-04)
export async function createSoalAction(formData: {
  modul_id: string;
  kursus_id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  kunci_jawaban: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase
    .from('soal')
    .insert({
      modul_id: formData.modul_id,
      urutan: formData.urutan,
      pertanyaan: formData.pertanyaan,
      pilihan_a: formData.pilihan_a,
      pilihan_b: formData.pilihan_b,
      pilihan_c: formData.pilihan_c,
      pilihan_d: formData.pilihan_d,
      kunci_jawaban: formData.kunci_jawaban.toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/instruktur/kursus/${formData.kursus_id}`);
  return { success: true, soal: data };
}

// 7. Hapus Soal (Hanya saat draf, BR-04)
export async function deleteSoalAction(soalId: string, kursusId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { error } = await supabase
    .from('soal')
    .delete()
    .eq('id', soalId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/instruktur/kursus/${kursusId}`);
  return { success: true };
}

// 8. Ajukan Kursus untuk Ditinjau (BR-02, BR-03)
export async function ajukanKursusAction(kursusId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Panggil RPC database yang menegakkan BR-02 dan BR-03
  const { data, error } = await supabase.rpc('ajukan_kursus_instruktur', {
    p_kursus_id: kursusId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/instruktur');
  revalidatePath(`/instruktur/kursus/${kursusId}`);
  return { success: true, kursus: data };
}
