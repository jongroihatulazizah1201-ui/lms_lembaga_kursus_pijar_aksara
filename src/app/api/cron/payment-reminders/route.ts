import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentReminderEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  return handleCronReminders(req);
}

export async function POST(req: NextRequest) {
  return handleCronReminders(req);
}

async function handleCronReminders(req: NextRequest) {
  try {
    // Verifikasi otorisasi cron (opsional jika CRON_SECRET dikonfigurasi)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // 1. Ambil seluruh pendaftaran berstatus 'menunggu_bayar' dengan batas bayar tersisa <= 3 jam
    const { data: listPendaftaran, error: fetchErr } = await supabase
      .from('pendaftaran')
      .select(`
        id,
        nominal,
        batas_bayar,
        mayar_invoice_id,
        kursus:kursus_id (
          id,
          judul,
          slug
        ),
        peserta:peserta_id (
          id,
          nama_lengkap,
          email
        )
      `)
      .eq('status', 'menunggu_bayar')
      .gt('batas_bayar', now.toISOString())
      .lte('batas_bayar', threeHoursFromNow.toISOString());

    if (fetchErr) {
      console.error('Gagal mengambil data pendaftaran untuk pengingat pembayaran:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!listPendaftaran || listPendaftaran.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada tagihan yang memerlukan pengingat 3 jam saat ini.',
        processedCount: 0,
      });
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const pendaftaran of listPendaftaran) {
      const peserta = pendaftaran.peserta as any;
      const kursus = pendaftaran.kursus as any;

      if (!peserta?.email) {
        skippedCount++;
        continue;
      }

      // 2. Mekanisme Idempotency: Cek apakah email pengingat 3 jam sudah pernah dikirim
      const { data: existingLog } = await supabase
        .from('audit_log')
        .select('id')
        .eq('aksi', 'email_reminder_pembayaran_3jam')
        .eq('id_data', pendaftaran.id)
        .maybeSingle();

      if (existingLog) {
        // Sudah pernah dikirim, lewati untuk cegah email spam
        skippedCount++;
        continue;
      }

      // Format batas waktu pembayaran ke WIB
      const deadlineDate = new Date(pendaftaran.batas_bayar);
      const deadlineFormatted = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(deadlineDate) + ' WIB';

      // Mayar payment URL fallback ke halaman kursus saya
      const paymentUrl = pendaftaran.mayar_invoice_id
        ? `https://sandbox.mayar.id/inv/${pendaftaran.mayar_invoice_id}`
        : null;

      // 3. Kirim Email Pengingat
      const emailResult = await sendPaymentReminderEmail({
        to: peserta.email,
        studentName: peserta.nama_lengkap || 'Peserta',
        courseTitle: kursus?.judul || 'Kursus Pijar Aksara',
        amount: pendaftaran.nominal,
        deadlineFormatted,
        paymentUrl,
      });

      if (emailResult.success) {
        // 4. Catat ke audit_log sebagai penanda bahwa pengingat telah dikirim
        await supabase.from('audit_log').insert({
          pelaku_id: peserta.id,
          aksi: 'email_reminder_pembayaran_3jam',
          nama_tabel: 'pendaftaran',
          id_data: pendaftaran.id,
          data_sebelum: null,
          data_sesudah: {
            email: peserta.email,
            batas_bayar: pendaftaran.batas_bayar,
            message_id: emailResult.messageId,
            dikirim_pada: new Date().toISOString(),
          },
          dibuat_pada: new Date().toISOString(),
        });

        sentCount++;
      } else {
        console.warn(`Gagal mengirimkan email ke ${peserta.email}:`, emailResult.error);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pemrosesan pengingat selesai: ${sentCount} email terkirim, ${skippedCount} dilewati.`,
      sentCount,
      skippedCount,
      totalChecked: listPendaftaran.length,
    });
  } catch (err: any) {
    console.error('Cron payment-reminders error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
