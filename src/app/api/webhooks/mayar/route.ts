import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMayarInvoice } from '@/lib/mayar';
import { sendEnrollmentActivatedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Ekstrak event dan invoice ID dari payload webhook Mayar
    const event = body.event || body.type;
    const invoiceId =
      body.data?.invoiceId ||
      body.data?.invoice_id ||
      body.data?.invoice?.id ||
      body.data?.id ||
      body.invoiceId ||
      body.invoice_id ||
      body.id;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Format webhook tidak valid: Invoice ID tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Jika webhook adalah event selain payment.received, tetap kembalikan 200 OK untuk acknowledge
    if (event && event !== 'payment.received') {
      return NextResponse.json({
        received: true,
        ignored: true,
        message: `Event ${event} diabaikan, hanya payment.received yang diproses.`,
      });
    }

    const supabase = createAdminClient();

    // 2. Cari pendaftaran yang cocok berdasarkan mayar_invoice_id
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
      return NextResponse.json(
        { error: `Data pendaftaran dengan invoice Mayar ID ${invoiceId} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // 3. Mekanisme Idempotency (Cegah Duplicate Webhook Processing)
    // Jika status sudah 'aktif' atau 'selesai', return 200 tanpa mengubah data lagi
    if (pendaftaran.status === 'aktif' || pendaftaran.status === 'selesai') {
      return NextResponse.json({
        success: true,
        message: 'Idempotent: Pembayaran ini telah diproses sebelumnya dan pendaftaran sudah aktif.',
        pendaftaranId: pendaftaran.id,
        status: pendaftaran.status,
      }, { status: 200 });
    }

    // Jika pendaftaran sudah dibatalkan atau kedaluwarsa secara permanen
    if (pendaftaran.status === 'dibatalkan' || pendaftaran.status === 'kedaluwarsa') {
      return NextResponse.json(
        { error: `Pendaftaran tidak dapat diaktifkan karena berstatus ${pendaftaran.status}.` },
        { status: 400 }
      );
    }

    // 4. Verifikasi Ulang Data Tagihan ke API Mayar Sandbox (GET /invoices/{id})
    const mayarInvoice = await getMayarInvoice(invoiceId);
    if (!mayarInvoice) {
      return NextResponse.json(
        { error: 'Gagal melakukan verifikasi ulang data tagihan ke API Mayar Sandbox.' },
        { status: 400 }
      );
    }

    // Cocokkan nominal pembayaran
    const mayarAmount = mayarInvoice.amount !== null && mayarInvoice.amount !== undefined
      ? Number(mayarInvoice.amount ?? mayarInvoice.totalAmount ?? mayarInvoice.paymentAmount)
      : null;
    const expectedAmount = Number(pendaftaran.nominal);

    if (mayarAmount !== null && (isNaN(mayarAmount) || mayarAmount !== expectedAmount)) {
      return NextResponse.json(
        {
          error: `Verifikasi nominal gagal: Tagihan Mayar mencatat Rp ${mayarAmount}, namun sistem LMS mengharapkan Rp ${expectedAmount}.`,
        },
        { status: 400 }
      );
    }

    // 5. Ubah Status Pendaftaran Menjadi Aktif (BR-07, Tabel 6.2)
    const now = new Date().toISOString();
    const { data: updatedPendaftaran, error: updateErr } = await supabase
      .from('pendaftaran')
      .update({
        status: 'aktif',
        dibayar_pada: now,
        metode_bayar: 'mayar',
      })
      .eq('id', pendaftaran.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: `Gagal memperbarui status pendaftaran: ${updateErr.message}` },
        { status: 500 }
      );
    }

    // 6. Catat Jejak ke Audit Log (BR-12)
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

    // 7. Pengiriman Notifikasi Email Otomatis (Pendaftaran Berhasil Diaktifkan)
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
      message: 'Pembayaran berhasil diverifikasi melalui Mayar Sandbox dan pendaftaran kini aktif.',
      pendaftaran: updatedPendaftaran,
    });
  } catch (err: any) {
    console.error('Mayar webhook unhandled error:', err);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan internal pada webhook handler.',
        ...(process.env.NODE_ENV === 'development' ? { detail: err?.message || String(err) } : {}),
      },
      { status: 500 }
    );
  }
}
