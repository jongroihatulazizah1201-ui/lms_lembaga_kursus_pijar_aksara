import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentReminderEmail } from '@/lib/email';

// Helper verifikasi secret cron secara konstan (Timing-Safe)
function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    return false;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
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

export async function GET(req: NextRequest) {
  return handleCronReminders(req);
}

export async function POST(req: NextRequest) {
  return handleCronReminders(req);
}

async function handleCronReminders(req: NextRequest) {
  try {
    // 0. Verifikasi Otorisasi Cron (Wajib Bearer CRON_SECRET, Timing-Safe)
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Akses tidak sah: Token otorisasi cron tidak valid atau tidak disertakan.' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // =========================================================================
    // 1. LANGKAH KEDALUWARSA: Ubah pendaftaran menunggu_bayar yang lewat batas_bayar
    //    Dieksekusi via RPC khusus hak service role yang idempoten & catat audit log sistem
    // =========================================================================
    const { data: expiredRecords, error: expireErr } = await supabase.rpc(
      'cron_proses_pendaftaran_kedaluwarsa'
    );

    if (expireErr) {
      console.error('Gagal menjalankan RPC cron_proses_pendaftaran_kedaluwarsa:', expireErr);
      return NextResponse.json(
        { error: `Gagal memproses kedaluwarsa pendaftaran: ${expireErr.message}` },
        { status: 500 }
      );
    }

    const expiredCount = Array.isArray(expiredRecords) ? expiredRecords.length : 0;

    // =========================================================================
    // 2. LANGKAH PENGINGAT PEMBAYARAN: Pendaftaran sisa <= 3 jam sebelum batas
    // =========================================================================
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

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

    let sentCount = 0;
    let skippedCount = 0;

    if (listPendaftaran && listPendaftaran.length > 0) {
      for (const pendaftaran of listPendaftaran) {
        const peserta = pendaftaran.peserta as any;
        const kursus = pendaftaran.kursus as any;

        if (!peserta?.email) {
          skippedCount++;
          continue;
        }

        // Mekanisme Idempotensi: Periksa apakah pengingat sudah pernah dikirim untuk pendaftaran ini
        const { data: existingLog } = await supabase
          .from('audit_log')
          .select('id')
          .eq('aksi', 'email_reminder_pembayaran_3jam')
          .eq('id_data', pendaftaran.id)
          .maybeSingle();

        if (existingLog) {
          // Sudah pernah dikirim, lewati agar tidak mengirim email ganda
          skippedCount++;
          continue;
        }

        // Format batas waktu pembayaran ke WIB
        const deadlineDate = new Date(pendaftaran.batas_bayar);
        const deadlineFormatted =
          new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Asia/Jakarta',
          }).format(deadlineDate) + ' WIB';

        const paymentUrl = pendaftaran.mayar_invoice_id
          ? `https://sandbox.mayar.id/inv/${pendaftaran.mayar_invoice_id}`
          : null;

        // Kirim Email Pengingat
        const emailResult = await sendPaymentReminderEmail({
          to: peserta.email,
          studentName: peserta.nama_lengkap || 'Peserta',
          courseTitle: kursus?.judul || 'Kursus Pijar Aksara',
          amount: pendaftaran.nominal,
          deadlineFormatted,
          paymentUrl,
        });

        if (emailResult.success) {
          // Catat ke audit_log sebagai penanda permanen bahwa pengingat telah dikirim
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
    }

    return NextResponse.json({
      success: true,
      message: 'Eksekusi cron pembayaran berhasil diproses.',
      expiredCount,
      remindersSent: sentCount,
      remindersSkipped: skippedCount,
      totalPendingChecked: listPendaftaran?.length || 0,
    });
  } catch (err: any) {
    console.error('Cron payment-reminders error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
