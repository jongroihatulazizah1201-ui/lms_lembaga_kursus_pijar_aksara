import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const siteUrl =
    process.env.NETLIFY_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://lmslembagakursuspijaraksara.netlify.app";
  const cronSecret = process.env.CRON_SECRET;

  const url = `${siteUrl.replace(/\/+$/, '')}/api/cron/payment-reminders`;
  console.log(`[Scheduled Function] Menjalankan cron pembayaran otomatis ke: ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    console.log('[Scheduled Function] Hasil eksekusi cron:', data);
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Scheduled Function] Gagal mengeksekusi cron pembayaran:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  schedule: "@hourly",
};
