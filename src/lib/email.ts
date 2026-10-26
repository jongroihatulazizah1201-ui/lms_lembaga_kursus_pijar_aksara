interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured. Email not sent to:', to);
    return { success: false, error: 'RESEND_API_KEY is not set' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lembaga Kursus Pijar Aksara <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.id) {
      return { success: true, messageId: data.id };
    } else {
      console.warn('Resend email error:', data);
      return { success: false, error: data?.message || 'Failed to send email' };
    }
  } catch (err: any) {
    console.error('Email send exception:', err.message);
    return { success: false, error: err.message };
  }
}

// 1. Email Notifikasi Pendaftaran Kursus Berhasil Diaktifkan
export async function sendEnrollmentActivatedEmail({
  to,
  studentName,
  courseTitle,
  courseSlug,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  courseSlug?: string;
}): Promise<EmailResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NETLIFY_SITE_URL ||
    process.env.URL ||
    'https://lmslembagakursuspijaraksara.netlify.app';
  const learningUrl = courseSlug ? `${siteUrl}/belajar/${courseSlug}` : `${siteUrl}/kursus-saya`;

  const subject = `Pendaftaran Aktif: ${courseTitle} - Pijar Aksara`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 223, 15, 0.15); color: #ffdf0f; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      Pendaftaran Dikonfirmasi
                    </span>
                    <h1 style="margin: 16px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Lembaga Kursus Pijar Aksara
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Halo <strong>${studentName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Pembayaran dan pendaftaran Anda untuk kursus berikut telah berhasil diverifikasi dan kini berstatus <strong>Aktif</strong>. Anda sudah dapat mengakses seluruh materi pembelajaran dan kuis evaluasi.
              </p>

              <!-- Course Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Judul Kursus</span>
                    <p style="margin: 6px 0 0 0; font-size: 17px; font-weight: 700; color: #ffffff;">${courseTitle}</p>
                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #1e293b;">
                      <span style="font-size: 12px; color: #94a3b8;">Status Pembelajaran:</span>
                      <span style="display: inline-block; margin-left: 6px; padding: 2px 8px; background-color: rgba(16, 185, 129, 0.2); color: #34d399; border-radius: 6px; font-size: 12px; font-weight: 700;">Aktif</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${learningUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 24px; background-color: #ffdf0f; color: #0f172a; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 223, 15, 0.3);">
                      Mulai Belajar Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                Jika tombol di atas tidak dapat diklik, silakan salin tautan berikut ke peramban web Anda:<br>
                <a href="${learningUrl}" style="color: #ffdf0f; text-decoration: underline; word-break: break-all;">${learningUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; font-weight: 600;">
                Lembaga Kursus Pijar Aksara
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Pemberitahuan otomatis sistem LMS. Mohon tidak membalas email ini secara langsung.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text: `Halo ${studentName},\n\nPendaftaran Anda untuk kursus "${courseTitle}" telah berhasil diaktifkan.\n\nSilakan mulai belajar melalui tautan berikut: ${learningUrl}\n\nSalam,\nLembaga Kursus Pijar Aksara`,
  });
}

// 2. Email Pengingat Batas Waktu Pembayaran (Sisa 3 Jam)
export async function sendPaymentReminderEmail({
  to,
  studentName,
  courseTitle,
  amount,
  deadlineFormatted,
  paymentUrl,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  deadlineFormatted: string;
  paymentUrl?: string | null;
}): Promise<EmailResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NETLIFY_SITE_URL ||
    process.env.URL ||
    'https://lmslembagakursuspijaraksara.netlify.app';
  const payUrl = paymentUrl || `${siteUrl}/kursus-saya`;

  const formattedRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  const subject = `Peringatan: Batas Pembayaran Kursus ${courseTitle} Tersisa 3 Jam - Pijar Aksara`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                Pengingat Batas Pembayaran (Sisa 3 Jam)
              </span>
              <h1 style="margin: 16px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Lembaga Kursus Pijar Aksara
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Halo <strong>${studentName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Kami menginformasikan bahwa tagihan pendaftaran kursus Anda akan kedaluwarsa dalam <strong>3 jam lagi</strong>. Mohon segera menyelesaikan transaksi sebelum batas waktu agar alokasi kuota Anda tidak dibatalkan otomatis oleh sistem.
              </p>

              <!-- Invoice Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Kursus</span>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #ffffff;">${courseTitle}</p>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Nominal Tagihan</span>
                      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #ffdf0f;">${formattedRupiah}</p>
                    </div>
                    <div>
                      <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Batas Waktu Pembayaran</span>
                      <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #f87171;">${deadlineFormatted}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${payUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 24px; background-color: #ffdf0f; color: #0f172a; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 223, 15, 0.3);">
                      Selesaikan Pembayaran Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                Jika Anda telah menyelesaikan pembayaran, mohon abaikan email ini. Tautan pembayaran alternatif:<br>
                <a href="${payUrl}" style="color: #ffdf0f; text-decoration: underline; word-break: break-all;">${payUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; font-weight: 600;">
                Lembaga Kursus Pijar Aksara
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Pemberitahuan otomatis sistem LMS. Mohon tidak membalas email ini secara langsung.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text: `Halo ${studentName},\n\nBatas waktu pembayaran untuk kursus "${courseTitle}" tersisa 3 jam lagi.\nNominal: ${formattedRupiah}\nBatas Waktu: ${deadlineFormatted}\n\nSilakan selesaikan pembayaran di tautan berikut: ${payUrl}\n\nSalam,\nLembaga Kursus Pijar Aksara`,
  });
}

// 3. Email Notifikasi Sertifikat Kelulusan Telah Terbit
export async function sendCertificateIssuedEmail({
  to,
  studentName,
  courseTitle,
  certificateNumber,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
}): Promise<EmailResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NETLIFY_SITE_URL ||
    process.env.URL ||
    'https://lmslembagakursuspijaraksara.netlify.app';
  const certificateUrl = `${siteUrl}/sertifikat/${certificateNumber}`;

  const subject = `Sertifikat Kelulusan Terbit: ${courseTitle} (${certificateNumber}) - Pijar Aksara`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                Kelulusan & Sertifikat Resmi
              </span>
              <h1 style="margin: 16px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Lembaga Kursus Pijar Aksara
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Selamat, <strong>${studentName}</strong>!
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Anda telah berhasil menyelesaikan seluruh materi dan lulus semua kuis evaluasi pada kursus <strong>${courseTitle}</strong>. Sertifikat kelulusan digital resmi Anda telah diterbitkan dengan nomor seri yang terverifikasi.
              </p>

              <!-- Certificate Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Nomor Sertifikat</span>
                      <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 18px; font-weight: 800; color: #ffdf0f; letter-spacing: 1px;">
                        ${certificateNumber}
                      </p>
                    </div>
                    <div>
                      <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Penerima Sertifikat</span>
                      <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #ffffff;">${studentName}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${certificateUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 24px; background-color: #ffdf0f; color: #0f172a; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 223, 15, 0.3);">
                      Lihat & Unduh Sertifikat Digital
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                Tautan verifikasi sertifikat:<br>
                <a href="${certificateUrl}" style="color: #ffdf0f; text-decoration: underline; word-break: break-all;">${certificateUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; font-weight: 600;">
                Lembaga Kursus Pijar Aksara
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Pemberitahuan otomatis sistem LMS. Mohon tidak membalas email ini secara langsung.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text: `Selamat ${studentName}!\n\nAnda telah lulus kursus "${courseTitle}". Sertifikat resmi Anda dengan nomor ${certificateNumber} telah terbit.\n\nLihat sertifikat Anda di: ${certificateUrl}\n\nSalam,\nLembaga Kursus Pijar Aksara`,
  });
}
