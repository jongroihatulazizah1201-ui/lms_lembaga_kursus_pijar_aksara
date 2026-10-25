'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 1. Ubah Status Kursus oleh Admin (US-08, BR-01, BR-02, BR-12)
export async function ubahStatusKursusAction(
  kursusId: string,
  statusBaru: 'terbit' | 'draf' | 'ditutup',
  catatan?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Verifikasi peran admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    return { error: 'Akses ditolak: Hanya admin yang berhak melakukan aksi ini.' };
  }

  // Validasi catatan jika mengembalikan ke draf (BR-02)
  if (statusBaru === 'draf') {
    if (!catatan || catatan.trim().length < 10) {
      return { error: 'Pengembalian ke draf wajib menyertakan catatan tinjauan minimal 10 karakter.' };
    }
  }

  const { data, error } = await supabase.rpc('admin_ubah_status_kursus', {
    p_kursus_id: kursusId,
    p_status_baru: statusBaru,
    p_catatan: catatan ? catatan.trim() : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/antrean');
  revalidatePath('/kursus');
  revalidatePath('/');
  if (data?.slug) {
    revalidatePath(`/kursus/${data.slug}`);
  }

  return { success: true, kursus: data };
}

// 2. Ubah Kuota Kursus oleh Admin (US-09, BR-03, BR-06, BR-12)
export async function ubahKuotaKursusAction(
  kursusId: string,
  kuotaBaru: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  if (isNaN(kuotaBaru) || kuotaBaru < 1 || kuotaBaru > 100) {
    return { error: 'Kuota harus antara 1 sampai 100 peserta.' };
  }

  const { data, error } = await supabase.rpc('admin_ubah_kuota_kursus', {
    p_kursus_id: kursusId,
    p_kuota_baru: kuotaBaru
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/antrean');
  revalidatePath('/kursus');
  return { success: true, kursus: data };
}

// 3. Konfirmasi Pembayaran oleh Admin (US-09, BR-07, BR-12, Tabel 6.2)
export async function konfirmasiPembayaranAction(pendaftaranId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  const { data, error } = await supabase.rpc('admin_konfirmasi_pembayaran', {
    p_pendaftaran_id: pendaftaranId
  });

  if (error) {
    return { error: error.message };
  }

  // Pengiriman Email Otomatis: Notifikasi Pendaftaran Berhasil Diaktifkan (BR-07, BR-12)
  try {
    const { data: regInfo } = await supabase
      .from('pendaftaran')
      .select('kursus:kursus_id(judul, slug), peserta:peserta_id(nama_lengkap, email)')
      .eq('id', pendaftaranId)
      .maybeSingle();

    const peserta = regInfo?.peserta as any;
    const kursus = regInfo?.kursus as any;

    if (peserta?.email) {
      const { sendEnrollmentActivatedEmail } = await import('@/lib/email');
      await sendEnrollmentActivatedEmail({
        to: peserta.email,
        studentName: peserta.nama_lengkap || 'Peserta',
        courseTitle: kursus?.judul || 'Kursus Pijar Aksara',
        courseSlug: kursus?.slug,
      });
    }
  } catch (emailErr) {
    console.error('Gagal mengirimkan email aktivasi pendaftaran:', emailErr);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/antrean');
  return { success: true, pendaftaran: data };
}

// 4. Batalkan Pendaftaran oleh Admin (US-09, BR-07, BR-12, Tabel 6.2)
export async function batalkanPendaftaranAction(
  pendaftaranId: string,
  alasan: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  if (!alasan || alasan.trim().length < 10) {
    return { error: 'Pembatalan pendaftaran aktif wajib menyertakan alasan minimal 10 karakter.' };
  }

  const { data, error } = await supabase.rpc('admin_batalkan_pendaftaran', {
    p_pendaftaran_id: pendaftaranId,
    p_alasan: alasan.trim()
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/antrean');
  return { success: true, pendaftaran: data };
}

// 5. Ubah Peran Pengguna oleh Admin (US-09, BR-12)
export async function ubahPeranPenggunaAction(
  userId: string,
  peranBaru: 'peserta' | 'instruktur' | 'admin'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  if (user.id === userId && peranBaru !== 'admin') {
    return { error: 'Admin tidak boleh menurunkan peran akunnya sendiri.' };
  }

  const { data, error } = await supabase.rpc('admin_ubah_peran_pengguna', {
    p_user_id: userId,
    p_peran_baru: peranBaru
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { success: true, profil: data };
}

// 6. Ubah Status Aktif Pengguna oleh Admin (US-09, BR-12)
export async function ubahStatusPenggunaAction(
  userId: string,
  aktif: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  if (user.id === userId && !aktif) {
    return { error: 'Admin tidak boleh menonaktifkan akunnya sendiri.' };
  }

  const { data, error } = await supabase.rpc('admin_ubah_status_pengguna', {
    p_user_id: userId,
    p_aktif: aktif
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { success: true, profil: data };
}

// 7. Cek dan Sinkronisasi Status Invoice Mayar (Otomasi BR-07, BR-12)
export async function cekStatusMayarAction(pendaftaranId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Pengguna belum terautentikasi.' };
  }

  // Verifikasi peran admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    return { error: 'Akses ditolak: Hanya admin yang berhak memeriksa status gateway Mayar.' };
  }

  // Ambil detail pendaftaran
  const { data: reg, error: regErr } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      status,
      nominal,
      metode_bayar,
      mayar_invoice_id,
      kursus:kursus_id(judul, slug),
      peserta:peserta_id(nama_lengkap, email)
    `)
    .eq('id', pendaftaranId)
    .maybeSingle();

  if (regErr || !reg) {
    return { error: 'Data pendaftaran tidak ditemukan.' };
  }

  if (reg.metode_bayar !== 'mayar') {
    return { error: 'Pendaftaran ini bukan transaksi metode Mayar.' };
  }

  if (!reg.mayar_invoice_id) {
    return { error: 'ID invoice Mayar tidak tercatat pada pendaftaran ini.' };
  }

  const peserta = reg.peserta as any;
  const kursus = reg.kursus as any;

  // Jika pendaftaran sudah aktif di database
  if (reg.status === 'aktif' || reg.status === 'selesai') {
    return {
      success: true,
      isPaid: true,
      statusMayar: 'PAID',
      message: `Pendaftaran untuk ${peserta?.nama_lengkap || 'peserta'} sudah berstatus AKTIF (Lunas).`,
    };
  }

  // Query status invoice ke API Mayar
  const { getMayarInvoice } = await import('@/lib/mayar');
  const invoice = await getMayarInvoice(reg.mayar_invoice_id, reg.nominal);

  if (!invoice) {
    return {
      error: `Gagal mengambil status invoice "${reg.mayar_invoice_id}" dari gateway Mayar. Periksa koneksi atau konfigurasi MAYAR_API_KEY.`,
    };
  }

  // Jika Mayar menyatakan invoice SUDAH dibayar (isPaid = true)
  if (invoice.isPaid) {
    // Validasi kecocokan nominal
    if (invoice.amount !== null && invoice.amount !== reg.nominal) {
      return {
        error: `Nominal tidak cocok! Invoice Mayar mencatat Rp ${invoice.amount.toLocaleString('id-ID')}, namun tagihan LMS adalah Rp ${reg.nominal.toLocaleString('id-ID')}. Konfirmasi ditahan demi keamanan (BR-07).`,
      };
    }

    // Eksekusi aktivasi pendaftaran via RPC
    const { data: updatedReg, error: rpcErr } = await supabase.rpc('admin_konfirmasi_pembayaran', {
      p_pendaftaran_id: pendaftaranId,
    });

    if (rpcErr) {
      return { error: `Invoice Mayar lunas, namun gagal mengaktifkan di database: ${rpcErr.message}` };
    }

    // Kirim email aktivasi peserta
    if (peserta?.email) {
      try {
        const { sendEnrollmentActivatedEmail } = await import('@/lib/email');
        await sendEnrollmentActivatedEmail({
          to: peserta.email,
          studentName: peserta.nama_lengkap || 'Peserta',
          courseTitle: kursus?.judul || 'Kursus Pijar Aksara',
          courseSlug: kursus?.slug,
        });
      } catch (emailErr) {
        console.error('Gagal mengirimkan email aktivasi pendaftaran:', emailErr);
      }
    }

    revalidatePath('/admin');
    revalidatePath('/admin/antrean');

    return {
      success: true,
      isPaid: true,
      statusMayar: invoice.status,
      message: `Terverifikasi LUNAS di Mayar (${invoice.status.toUpperCase()})! Pendaftaran ${peserta?.nama_lengkap || 'peserta'} telah otomatis diaktifkan.`,
    };
  }

  // Jika invoice BELUM dibayar di Mayar
  return {
    success: true,
    isPaid: false,
    statusMayar: invoice.status,
    invoiceId: reg.mayar_invoice_id,
    message: `Tagihan di Mayar masih berstatus "${(invoice.status || 'UNPAID').toUpperCase()}". Peserta belum melakukan pembayaran di Mayar.`,
  };
}
