import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMayarInvoice } from '@/lib/mayar';
import { sendEnrollmentActivatedEmail } from '@/lib/email';

// Helper perbandingan token rahasia secara konstan (Timing Safe)
function verifyWebhookToken(providedToken: string | null): boolean {
  const secret = process.env.MAYAR_WEBHOOK_SECRET;
  if (
    !secret ||
    typeof secret !== 'string' ||
    secret.length < 32 ||
    !providedToken ||
    typeof providedToken !== 'string'
  ) {
    return false;
  }

  const secretBuf = Buffer.from(secret, 'utf-8');
  const tokenBuf = Buffer.from(providedToken, 'utf-8');

  if (secretBuf.length !== tokenBuf.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(secretBuf, tokenBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // =========================================================================
    // 1. VERIFIKASI TOKEN RAHASIA (DILAKUKAN PERTAMA SEBELUM BACA BODY & DB)
    // =========================================================================
    const token = req.nextUrl.searchParams.get('token');

    if (!verifyWebhookToken(token)) {
      // Gagal -> HTTP 401. Jangan pernah mencatat token atau URL lengkapnya di log.
      console.warn('Peringatan Keamanan Webhook Mayar: Percobaan akses tanpa token otorisasi yang sah (401).');
      return NextResponse.json(
        { error: 'Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan.' },
        { status: 401 }
      );
    }

    // =========================================================================
    // 2. PARSE PAYLOAD WEBHOOK & FILTER EVENT
    // =========================================================================
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Format payload tidak valid: Gagal mem-parse body JSON.' },
        { status: 400 }
      );
    }

    // Hanya proses event payment.received. Event lain (termasuk payment.reminder) dibalas HTTP 200 diabaikan
    const event = body?.event || body?.type;
    if (event !== 'payment.received') {
      return NextResponse.json({
        received: true,
        ignored: true,
        message: `Event '${event || 'unknown'}' diabaikan, hanya payment.received yang diproses.`,
      });
    }

    // Ambil identifier tagihan dari field resmi Mayar
    const invoiceId =
      body?.data?.paymentLinkId ||
      body?.data?.invoiceId ||
      body?.data?.invoice_id ||
      body?.data?.invoice?.id ||
      body?.data?.id ||
      body?.data?.transactionId ||
      body?.invoiceId ||
      body?.invoice_id ||
      body?.id;

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json(
        { error: 'Format webhook tidak valid: Invoice ID tidak ditemukan.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 3. CARI PENDAFTARAN DI DATABASE BERDASARKAN mayar_invoice_id (BUKAN DARI PAYLOAD)
    // =========================================================================
    const supabase = createAdminClient();

    const { data: pendaftaran, error: fetchErr } = await supabase
      .from('pendaftaran')
      .select(`
        id,
        status,
        nominal,
        batas_bayar,
        mayar_invoice_id,
        kursus:kursus_id (
          id,
          judul,
          slug,
          harga
        ),
        peserta:peserta_id (
          id,
          nama_lengkap,
          email
        )
      `)
      .eq('mayar_invoice_id', invoiceId)
      .maybeSingle();

    if (fetchErr || !pendaftaran) {
      console.warn(`Pendaftaran tidak ditemukan untuk invoice Mayar ID: ${invoiceId}`);
      return NextResponse.json(
        { error: 'Data pendaftaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    // =========================================================================
    // 4. MEKANISME IDEMPOTENSI (SEKUANSIAL)
    // =========================================================================
    if (pendaftaran.status === 'aktif' || pendaftaran.status === 'selesai') {
      return NextResponse.json(
        {
          success: true,
          message: 'Idempotent: Pembayaran ini telah diproses sebelumnya dan pendaftaran sudah aktif.',
          pendaftaranId: pendaftaran.id,
          status: pendaftaran.status,
        },
        { status: 200 }
      );
    }

    // Jika pendaftaran sudah dibatalkan atau kedaluwarsa secara permanen
    if (pendaftaran.status === 'dibatalkan' || pendaftaran.status === 'kedaluwarsa') {
      return NextResponse.json(
        { error: 'Status pendaftaran tidak valid untuk aktivasi.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 5. WAJIB: VERIFIKASI ULANG VIA GET INVOICE KE API MAYAR
    // =========================================================================
    const expectedAmount = Number(pendaftaran.nominal);
    const mayarInvoice = await getMayarInvoice(pendaftaran.mayar_invoice_id, expectedAmount);

    if (!mayarInvoice) {
      console.warn(`Verifikasi ke API Mayar gagal untuk invoice ID: ${pendaftaran.mayar_invoice_id}`);
      return NextResponse.json(
        { error: 'Gagal melakukan verifikasi ulang data tagihan ke API Mayar.' },
        { status: 400 }
      );
    }

    // A. Status Harus Sudah Lunas / Dibayar
    const rawStatus = (mayarInvoice.status || '').toLowerCase();
    const isPaid =
      mayarInvoice.isPaid === true ||
      rawStatus === 'paid' ||
      rawStatus === 'closed' ||
      rawStatus === 'settled' ||
      rawStatus === 'success';

    if (!isPaid) {
      console.warn(`Invoice Mayar ${pendaftaran.mayar_invoice_id} belum dibayar (status: ${mayarInvoice.status}).`);
      return NextResponse.json(
        { error: 'Verifikasi status pembayaran gagal.' },
        { status: 400 }
      );
    }

    // B. Nominal Harus Sama Persis (Pesan error generik, jangan membocorkan nominal yang diharapkan)
    const mayarAmount =
      mayarInvoice.amount !== null && mayarInvoice.amount !== undefined
        ? Number(mayarInvoice.amount)
        : null;

    if (mayarAmount === null || isNaN(mayarAmount) || mayarAmount !== expectedAmount) {
      console.warn(
        `Verifikasi nominal gagal untuk invoice ${pendaftaran.mayar_invoice_id}: Mayar=${mayarAmount}, LMS=${expectedAmount}`
      );
      return NextResponse.json(
        { error: 'Verifikasi nominal pembayaran gagal.' },
        { status: 400 }
      );
    }

    // C. Invoice Itu Harus Milik Pendaftaran yang Dicari
    if (mayarInvoice.id !== pendaftaran.mayar_invoice_id) {
      console.warn(
        `Integritas invoice gagal: Invoice Mayar ${mayarInvoice.id} != pendaftaran ${pendaftaran.mayar_invoice_id}`
      );
      return NextResponse.json(
        { error: 'Integritas gagal: Data tagihan tidak cocok dengan pendaftaran.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 6. UBAH STATUS PENDAFTARAN (KONTROL KONKURENSI ATOMIK UNTUK PROMISE.ALL)
    // =========================================================================
    const now = new Date().toISOString();
    const { data: updatedPendaftaran, error: updateErr } = await supabase
      .from('pendaftaran')
      .update({
        status: 'aktif',
        dibayar_pada: now,
        metode_bayar: 'mayar',
      })
      .eq('id', pendaftaran.id)
      .eq('status', 'menunggu_bayar') // ATOMIC: Hanya baris pertama yang berhasil update
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error('Gagal memperbarui status pendaftaran:', updateErr.message);
      return NextResponse.json(
        { error: 'Gagal memperbarui status pendaftaran.' },
        { status: 500 }
      );
    }

    // Jika null, berarti request konkuren lain telah memperbarui statusnya terlebih dahulu
    if (!updatedPendaftaran) {
      return NextResponse.json(
        {
          success: true,
          message: 'Idempotent: Pembayaran ini telah diproses sebelumnya dan pendaftaran sudah aktif.',
          pendaftaranId: pendaftaran.id,
          status: 'aktif',
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // 7. CATAT JEJAK KE AUDIT LOG (BR-12) - TEPAT 1 KALI KARENA UPDATE ATOMIK
    // =========================================================================
    await supabase.from('audit_log').insert({
      pelaku_id: (pendaftaran.peserta as any)?.id,
      aksi: 'konfirmasi_pembayaran_mayar',
      nama_tabel: 'pendaftaran',
      id_data: pendaftaran.id,
      data_sebelum: {
        status: pendaftaran.status,
        nominal: pendaftaran.nominal,
      },
      data_sesudah: {
        status: 'aktif',
        nominal: pendaftaran.nominal,
        mayar_invoice_id: invoiceId,
        dibayar_pada: now,
      },
      dibuat_pada: now,
    });

    // =========================================================================
    // 8. PENGIRIMAN NOTIFIKASI EMAIL OTOMATIS - TEPAT 1 KALI KARENA UPDATE ATOMIK
    // =========================================================================
    const peserta = pendaftaran.peserta as any;
    const kursus = pendaftaran.kursus as any;

    if (peserta?.email) {
      try {
        await sendEnrollmentActivatedEmail({
          to: peserta.email,
          studentName: peserta.nama_lengkap,
          courseTitle: kursus?.judul || 'Kursus Pijar Aksara',
          courseSlug: kursus?.slug,
        });
      } catch (emailErr) {
        console.error('Gagal mengirimkan email aktivasi pendaftaran:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi secara sah melalui API Mayar dan pendaftaran kini aktif.',
      pendaftaran: updatedPendaftaran,
    });
  } catch (err: any) {
    console.error('Mayar webhook unhandled error:', err?.message || 'Internal error');
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan internal pada webhook handler.',
      },
      { status: 500 }
    );
  }
}
