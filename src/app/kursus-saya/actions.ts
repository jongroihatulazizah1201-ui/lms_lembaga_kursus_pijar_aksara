'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Server Action: Unggah Bukti Pembayaran Transfer Manual oleh Peserta
 * Memvalidasi kepemilikan, status menunggu_bayar, batas waktu bayar,
 * serta tipe & ukuran file di sisi server.
 */
export async function unggahBuktiBayarAction(pendaftaranId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi. Silakan masuk terlebih dahulu.' };
  }

  // 1. Verifikasi data pendaftaran di database
  const { data: reg, error: regErr } = await supabase
    .from('pendaftaran')
    .select('id, peserta_id, status, batas_bayar, bukti_bayar_path')
    .eq('id', pendaftaranId)
    .single();

  if (regErr || !reg) {
    return { error: 'Data pendaftaran tidak ditemukan.' };
  }

  // 2. Hanya pemilik pendaftaran yang berhak mengunggah
  if (reg.peserta_id !== user.id) {
    return { error: 'Akses ditolak: Anda bukan pemilik pendaftaran ini.' };
  }

  // 3. Hanya pendaftaran berstatus menunggu_bayar
  if (reg.status !== 'menunggu_bayar') {
    return {
      error: `Bukti pembayaran hanya dapat diunggah untuk pendaftaran yang menunggu pembayaran (status saat ini: ${reg.status}).`,
    };
  }

  // 4. Hanya sebelum batas_bayar
  if (reg.batas_bayar && new Date(reg.batas_bayar).getTime() < Date.now()) {
    return {
      error: 'Batas waktu pembayaran telah kedaluwarsa. Bukti pembayaran tidak dapat diunggah lagi.',
    };
  }

  // 5. Validasi Berkas di Sisi Server
  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string' || file.size === 0) {
    return { error: 'Berkas bukti pembayaran tidak ditemukan atau kosong.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'Ukuran berkas melebihi batas maksimal 2 MB.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: 'Format berkas tidak valid. Harap unggah berkas bertipe JPG, PNG, WebP, atau PDF.',
    };
  }

  // Tentukan ekstensi yang aman berdasarkan mime-type
  let ext = '.jpg';
  if (file.type === 'image/png') ext = '.png';
  else if (file.type === 'image/webp') ext = '.webp';
  else if (file.type === 'application/pdf') ext = '.pdf';

  const sanitizedFileName = `${Date.now()}_bukti${ext}`;
  // Foldername format: {pendaftaran_id}/{filename} agar sesuai dengan storage RLS
  const storagePath = `${pendaftaranId}/${sanitizedFileName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Unggah ke bucket privat 'bukti_bayar'
    const { error: uploadErr } = await supabase.storage
      .from('bukti_bayar')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return { error: `Gagal mengunggah berkas ke penyimpanan: ${uploadErr.message}` };
    }

    // 7. Simpan path berkas ke tabel pendaftaran lewat RPC terproteksi & tercatat di audit log
    const { data: updatedReg, error: rpcErr } = await supabase.rpc('peserta_unggah_bukti_bayar', {
      p_pendaftaran_id: pendaftaranId,
      p_bukti_bayar_path: storagePath,
    });

    if (rpcErr) {
      console.error('RPC peserta_unggah_bukti_bayar error:', rpcErr);
      return { error: `Gagal memperbarui catatan pendaftaran: ${rpcErr.message}` };
    }

    revalidatePath(`/kursus-saya/${pendaftaranId}/bayar`);
    revalidatePath('/kursus-saya');
    revalidatePath('/admin');
    revalidatePath('/admin/antrean');

    return {
      success: true,
      bukti_bayar_path: storagePath,
      message: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi dan konfirmasi dari administrator.',
    };
  } catch (err: any) {
    console.error('Unexpected error in unggahBuktiBayarAction:', err);
    return { error: err.message || 'Terjadi kesalahan sistem saat memproses berkas.' };
  }
}

/**
 * Server Action: Dapatkan Signed URL Bukti Pembayaran
 * Berlaku maksimal 60 menit (3600 detik). Hanya dapat diakses oleh Admin atau Pemilik Pendaftaran.
 */
export async function getSignedBuktiBayarUrlAction(pendaftaranId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // 1. Cek peran profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.peran === 'admin';

  // 2. Ambil data pendaftaran
  const { data: reg, error: regErr } = await supabase
    .from('pendaftaran')
    .select('id, peserta_id, bukti_bayar_path')
    .eq('id', pendaftaranId)
    .single();

  if (regErr || !reg) {
    return { error: 'Data pendaftaran tidak ditemukan.' };
  }

  // 3. Verifikasi hak akses: Hanya Pemilik Pendaftaran atau Admin
  if (!isAdmin && reg.peserta_id !== user.id) {
    return { error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat bukti pembayaran ini.' };
  }

  if (!reg.bukti_bayar_path) {
    return { error: 'Bukti pembayaran belum diunggah untuk pendaftaran ini.' };
  }

  // 4. Generate signed URL dengan masa kedaluwarsa maksimal 60 menit (3600 detik)
  const { data: signedData, error: signErr } = await supabase.storage
    .from('bukti_bayar')
    .createSignedUrl(reg.bukti_bayar_path, 3600);

  if (signErr || !signedData?.signedUrl) {
    console.error('Error creating signed URL:', signErr);
    return { error: 'Gagal membuat tautan aman bukti pembayaran.' };
  }

  return {
    success: true,
    signedUrl: signedData.signedUrl,
    expiresInSeconds: 3600,
  };
}

/**
 * Server Action: Dapatkan atau buat invoice Mayar untuk pendaftaran berstatus 'menunggu_bayar'
 * Mengembalikan paymentUrl (link Mayar) agar peserta bisa bayar via QRIS/VA/Mayar kapan saja.
 */
export async function getOrCreateMayarPaymentUrlAction(pendaftaranId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Silakan masuk terlebih dahulu.' };
  }

  // 1. Ambil pendaftaran
  const { data: reg, error: regErr } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      peserta_id,
      status,
      nominal,
      batas_bayar,
      mayar_invoice_id,
      kursus:kursus_id (
        id,
        judul,
        slug,
        harga
      )
    `)
    .eq('id', pendaftaranId)
    .single();

  if (regErr || !reg) {
    return { error: 'Data pendaftaran tidak ditemukan.' };
  }

  if (reg.peserta_id !== user.id) {
    return { error: 'Akses ditolak: Anda bukan pemilik pendaftaran ini.' };
  }

  if (reg.status !== 'menunggu_bayar') {
    return { error: `Pendaftaran ini berstatus ${reg.status}.` };
  }

  if (reg.batas_bayar && new Date(reg.batas_bayar).getTime() < Date.now()) {
    return { error: 'Batas waktu pembayaran 24 jam telah habis. Silakan daftar kembali dari katalog.' };
  }

  const { getMayarInvoice, createMayarInvoice } = await import('@/lib/mayar');

  // 2. Jika sudah ada mayar_invoice_id, coba cek link aktif dari Mayar API
  if (reg.mayar_invoice_id) {
    try {
      const existing = await getMayarInvoice(reg.mayar_invoice_id);
      const link =
        existing?.raw?.paymentUrl ||
        (existing?.raw?.link
          ? existing.raw.link.startsWith('http')
            ? existing.raw.link
            : `https://lmspijarkursuspijaraksara.myr.lat/invoices/${existing.raw.link}`
          : null);

      if (link) {
        return { success: true, paymentUrl: link };
      }
    } catch (e) {
      console.warn('Gagal mengambil invoice existing Mayar, membuat invoice baru:', e);
    }
  }

  // 3. Jika belum ada atau link tidak ditemukan, buat invoice Mayar baru
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, no_hp')
    .eq('id', user.id)
    .single();

  const kursus = reg.kursus as any;
  const invoice = await createMayarInvoice({
    name: profile?.nama_lengkap || user.email || 'Peserta',
    email: profile?.email || user.email || '',
    mobile: profile?.no_hp || '081234567890',
    amount: Number(reg.nominal),
    description: `Pendaftaran Kursus ${kursus?.judul || 'Pijar Aksara'}`,
  });

  if (!invoice?.id || !invoice?.link) {
    return {
      error: 'Layanan gerbang pembayaran Mayar sedang mengalami gangguan. Anda dapat menggunakan metode Transfer Bank Manual di bawah ini.',
    };
  }

  // Simpan mayar_invoice_id baru dan update metode_bayar ke 'mayar'
  await supabase
    .from('pendaftaran')
    .update({
      mayar_invoice_id: invoice.id,
      metode_bayar: 'mayar',
    })
    .eq('id', reg.id);

  revalidatePath('/kursus-saya');
  revalidatePath(`/kursus-saya/${pendaftaranId}/bayar`);

  return { success: true, paymentUrl: invoice.link };
}

