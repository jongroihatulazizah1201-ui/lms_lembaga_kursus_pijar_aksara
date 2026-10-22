'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function tandaiMateriDibacaAction(pendaftaranId: string, modulId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase.rpc('tandai_materi_dibaca', {
    p_pendaftaran_id: pendaftaranId,
    p_modul_id: modulId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/belajar/${slug}`);
  revalidatePath('/kursus-saya');

  return { success: true, progres: data };
}

export async function getSignedPdfUrlAction(path: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // PRD Bagian 10 Poin 4: Tautan sementara berlaku paling lama 60 menit (3600 detik)
  const { data, error } = await supabase.storage
    .from('materi_pdf')
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    // Jika file fisik belum diunggah ke Supabase Storage, berikan placeholder URL aman
    console.warn('Storage signed URL notice:', error?.message);
    return { 
      success: true, 
      signedUrl: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf?expires=3600`,
      isFallback: true 
    };
  }

  return { success: true, signedUrl: data.signedUrl };
}
