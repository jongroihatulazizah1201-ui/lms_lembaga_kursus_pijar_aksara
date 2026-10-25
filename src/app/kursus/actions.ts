'use server';

import { createClient } from '@/lib/supabase/server';
import { createMayarInvoice } from '@/lib/mayar';
import { revalidatePath } from 'next/cache';

export async function daftarKursusAction(kursusId: string, metodeBayar: string = 'transfer_manual') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Silakan masuk terlebih dahulu untuk mendaftar kursus.' };
  }

  // 1. Ambil data kursus untuk cek info judul dan harga
  const { data: kursus, error: kursusErr } = await supabase
    .from('kursus')
    .select('id, judul, slug, harga, kuota, status')
    .eq('id', kursusId)
    .single();

  if (kursusErr || !kursus) {
    return { error: 'Kursus tidak ditemukan.' };
  }

  if (kursus.status !== 'terbit') {
    return { error: 'Hanya kursus berstatus terbit yang dapat didaftar.' };
  }

  // 2. Eksekusi RPC daftar_kursus (memiliki FOR UPDATE row-locking di database untuk cegah race condition)
  const { data: pendaftaran, error: rpcErr } = await supabase.rpc('daftar_kursus', {
    p_kursus_id: kursusId,
    p_metode_bayar: metodeBayar,
  });

  if (rpcErr) {
    return { error: rpcErr.message };
  }

  // 3. Jika kursus berbayar dan metode bayar Mayar, integrasikan dengan API Mayar
  let paymentUrl: string | null = null;
  if (kursus.harga > 0 && pendaftaran && metodeBayar === 'mayar') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nama_lengkap, email, nomor_hp')
      .eq('id', user.id)
      .single();

    const invoice = await createMayarInvoice({
      name: profile?.nama_lengkap || user.email || 'Peserta',
      email: profile?.email || user.email || '',
      mobile: profile?.nomor_hp || '081234567890',
      amount: kursus.harga,
      description: `Pendaftaran Kursus ${kursus.judul}`,
    });

    if (!invoice?.id) {
      // Kegagalan ke Mayar: di produksi, batalkan pendaftaran yang baru dibuat agar tidak menggantung dengan invoice palsu
      await supabase
        .from('pendaftaran')
        .update({
          status: 'dibatalkan',
          dibatalkan_pada: new Date().toISOString(),
          alasan_batal: 'Gagal membuat tagihan pembayaran Mayar. Silakan coba lagi.'
        })
        .eq('id', pendaftaran.id);

      return {
        error: 'Layanan gerbang pembayaran Mayar sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.',
      };
    }

    // Simpan ID invoice Mayar yang valid ke tabel pendaftaran
    await supabase
      .from('pendaftaran')
      .update({ mayar_invoice_id: invoice.id })
      .eq('id', pendaftaran.id);

    paymentUrl = invoice.link || null;
  }

  // 4. Pengiriman Email Otomatis jika kursus gratis (langsung aktif) (BR-07)
  if (pendaftaran.status === 'aktif') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nama_lengkap, email')
        .eq('id', user.id)
        .single();

      const recipientEmail = profile?.email || user.email;
      if (recipientEmail) {
        const { sendEnrollmentActivatedEmail } = await import('@/lib/email');
        await sendEnrollmentActivatedEmail({
          to: recipientEmail,
          studentName: profile?.nama_lengkap || 'Peserta',
          courseTitle: kursus.judul,
          courseSlug: kursus.slug,
        });
      }
    } catch (emailErr) {
      console.error('Gagal mengirimkan email aktivasi pendaftaran kursus gratis:', emailErr);
    }
  }

  revalidatePath('/kursus-saya');
  revalidatePath(`/kursus/${kursus.slug}`);

  return {
    success: true,
    status: pendaftaran.status,
    pendaftaranId: pendaftaran.id,
    paymentUrl,
    isFree: kursus.harga === 0,
    message: kursus.harga === 0
      ? 'Selamat! Pendaftaran kursus gratis berhasil dan langsung aktif.'
      : 'Pendaftaran berhasil dicatat. Silakan lakukan pembayaran dalam batas waktu 24 jam.',
  };
}

export async function batalkanPendaftaranAction(pendaftaranId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase.rpc('batalkan_pendaftaran_peserta', {
    p_pendaftaran_id: pendaftaranId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/kursus-saya');
  return { success: true, message: 'Pendaftaran berhasil dibatalkan.' };
}
