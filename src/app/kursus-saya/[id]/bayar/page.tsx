import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ManualPaymentClient from '@/components/ManualPaymentClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pembayaran Transfer Manual | Lembaga Kursus Pijar Aksara',
  description: 'Instruksi pembayaran transfer manual antarbank dan formulir unggah bukti bayar untuk aktivasi kursus vokasi.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManualPaymentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Verifikasi Autentikasi Pengguna di Level Server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/kursus-saya/${id}/bayar`);
  }

  // 2. Ambil data pendaftaran (RLS membatasi hanya pemilik atau admin yang bisa baca)
  const { data: registration, error: regErr } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      peserta_id,
      status,
      nominal,
      metode_bayar,
      batas_bayar,
      bukti_bayar_path,
      didaftarkan_pada,
      kursus:kursus_id (
        id,
        judul,
        slug,
        kategori,
        ringkasan,
        harga,
        instruktur:instruktur_id (
          nama_lengkap
        )
      )
    `)
    .eq('id', id)
    .single();

  if (regErr || !registration) {
    redirect('/kursus-saya');
  }

  // 3. Hak Akses: Hanya pemilik pendaftaran yang boleh membuka halaman ini
  if (registration.peserta_id !== user.id) {
    redirect('/kursus-saya');
  }

  // 4. Data Rekening Tujuan dari Environment Variable (Tidak di-hardcode)
  const bankDetails = {
    bankName:
      process.env.MANUAL_TRANSFER_BANK_NAME ||
      process.env.NEXT_PUBLIC_MANUAL_TRANSFER_BANK_NAME ||
      'Bank Central Asia (BCA)',
    accountNumber:
      process.env.MANUAL_TRANSFER_ACCOUNT_NUMBER ||
      process.env.NEXT_PUBLIC_MANUAL_TRANSFER_ACCOUNT_NUMBER ||
      '7120938471',
    accountName:
      process.env.MANUAL_TRANSFER_ACCOUNT_NAME ||
      process.env.NEXT_PUBLIC_MANUAL_TRANSFER_ACCOUNT_NAME ||
      'Lembaga Kursus Pijar Aksara',
  };

  // 5. Buat Signed URL Bukti Bayar jika peserta sudah pernah mengunggah (Maksimal 60 menit)
  let existingSignedUrl: string | null = null;
  if (registration.bukti_bayar_path) {
    try {
      const { data: signedData } = await supabase.storage
        .from('bukti_bayar')
        .createSignedUrl(registration.bukti_bayar_path, 3600);
      existingSignedUrl = signedData?.signedUrl || null;
    } catch (e) {
      console.error('Error creating signed url for existing proof:', e);
    }
  }

  const formattedReg = {
    ...registration,
    kursus: Array.isArray(registration.kursus) ? registration.kursus[0] : registration.kursus,
  };

  return (
    <ManualPaymentClient
      registration={formattedReg as any}
      bankDetails={bankDetails}
      existingSignedUrl={existingSignedUrl}
    />
  );
}
