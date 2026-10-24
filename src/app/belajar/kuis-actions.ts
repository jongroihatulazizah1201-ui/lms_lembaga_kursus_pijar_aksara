'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSoalKuisAction(modulId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Mengambil soal kuis TANPA kunci jawaban (BR-09)
  const { data, error } = await supabase.rpc('get_soal_kuis', {
    p_modul_id: modulId,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, soal: data };
}

export async function submitKuisAction(
  pendaftaranId: string,
  modulId: string,
  jawaban: Record<string, string>,
  slug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Penilaian otomatis di server terhadap kunci jawaban rahasia (BR-09, BR-10, BR-11)
  const { data, error } = await supabase.rpc('submit_kuis', {
    p_pendaftaran_id: pendaftaranId,
    p_modul_id: modulId,
    p_jawaban: jawaban,
  });

  if (error) {
    return { error: error.message };
  }

  // Pengiriman Email Otomatis: Notifikasi Sertifikat Kelulusan Terbit (BR-07, BR-11)
  if (data?.semua_modul_selesai && data?.nomor_sertifikat) {
    try {
      const { data: cert } = await supabase
        .from('sertifikat')
        .select('nama_peserta, judul_kursus, nomor_sertifikat')
        .eq('nomor_sertifikat', data.nomor_sertifikat)
        .maybeSingle();

      const recipientEmail = user.email;
      if (recipientEmail && cert) {
        const { sendCertificateIssuedEmail } = await import('@/lib/email');
        await sendCertificateIssuedEmail({
          to: recipientEmail,
          studentName: cert.nama_peserta || 'Peserta',
          courseTitle: cert.judul_kursus,
          certificateNumber: cert.nomor_sertifikat,
        });
      }
    } catch (emailErr) {
      console.error('Gagal mengirimkan email notifikasi sertifikat:', emailErr);
    }
  }

  revalidatePath(`/belajar/${slug}`);
  revalidatePath(`/belajar/${slug}/kuis`);
  revalidatePath('/kursus-saya');

  return { success: true, hasil: data };
}
