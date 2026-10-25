/**
 * LMS Lembaga Kursus Pijar Aksara
 * Test Suite: SEO (Sitemap & Robots) dan Cron (Kedaluwarsa & Idempotensi Pengingat)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = env.CRON_SECRET || 'test_cron_secret_32_characters_random_string_123';
const supabase = createClient(supabaseUrl, supabaseKey);

const SERVER_PORT = 3001;
const results = [];

function record(id, title, pass, detail) {
  results.push({ id, title, pass: pass ? 'LULUS' : 'GAGAL', detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${title}`);
}

async function waitHttp(url, maxRetries = 40) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status) return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`);
    } else {
      process.kill(-pid);
    }
  } catch {}
}

async function main() {
  console.log('================================================================');
  console.log('MEMULAI PENGUJIAN SEO (SITEMAP & ROBOTS) & CRON PEMBAYARAN');
  console.log('================================================================\n');

  // Jalankan Next.js server production di port 3001
  const nextEnv = {
    ...process.env,
    ...env,
    NODE_ENV: 'production',
    CRON_SECRET: cronSecret,
    PORT: String(SERVER_PORT),
  };

  const nextProcess = spawn('npx', ['next', 'start', '-p', String(SERVER_PORT)], {
    cwd: path.resolve(__dirname, '../../'),
    env: nextEnv,
    shell: true,
  });

  console.log(`Menunggu server Next.js aktif di port ${SERVER_PORT}...`);
  const isReady = await waitHttp(`http://localhost:${SERVER_PORT}/`, 40);
  if (!isReady) {
    console.error('Server gagal menyala.');
    killProcessTree(nextProcess.pid);
    process.exit(1);
  }
  console.log('Server Next.js siap menerima request.\n');

  // =========================================================================
  // 1. UJI ROBOTS.TXT
  // =========================================================================
  console.log('--- 1. PENGUJIAN ROBOTS.TXT ---');
  const robotsRes = await fetch(`http://localhost:${SERVER_PORT}/robots.txt`);
  const robotsText = await robotsRes.text();

  const hasAllowSlash = robotsText.includes('Allow: /');
  const hasDisallowAdmin = robotsText.includes('Disallow: /admin');
  const hasDisallowInstruktur = robotsText.includes('Disallow: /instruktur');
  const hasDisallowApi = robotsText.includes('Disallow: /api');
  const hasSitemap = robotsText.includes('Sitemap:') && robotsText.includes('sitemap.xml');
  const noForbiddenDisallow =
    !robotsText.includes('Disallow: /sertifikat') &&
    !robotsText.includes('Disallow: /belajar') &&
    !robotsText.includes('Disallow: /kursus-saya') &&
    !robotsText.includes('Disallow: /profil');

  const robotsPass =
    robotsRes.status === 200 &&
    hasAllowSlash &&
    hasDisallowAdmin &&
    hasDisallowInstruktur &&
    hasDisallowApi &&
    hasSitemap &&
    noForbiddenDisallow;

  record(
    'UJI-SEO-01',
    'robots.txt: Izinkan /, larang hanya /admin, /instruktur, /api; tidak melarang /sertifikat dkk; ada sitemap',
    robotsPass,
    robotsText
  );

  // =========================================================================
  // 2. UJI SITEMAP.XML
  // =========================================================================
  console.log('\n--- 2. PENGUJIAN SITEMAP.XML ---');
  const sitemapRes = await fetch(`http://localhost:${SERVER_PORT}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();

  // Ambil seluruh kursus dari database dan kelompokkan berdasarkan status
  const { data: allCourses } = await supabase.from('kursus').select('slug, status, diterbitkan_pada');

  const terbitCourses = allCourses?.filter(c => c.status === 'terbit') || [];
  const nonTerbitCourses = allCourses?.filter(c => c.status !== 'terbit') || [];

  let allTerbitIncluded = true;
  for (const c of terbitCourses) {
    if (!sitemapText.includes(`/kursus/${c.slug}`)) {
      allTerbitIncluded = false;
      console.warn(`Kursus terbit tidak ditemukan di sitemap: ${c.slug}`);
    }
  }

  let noNonTerbitIncluded = true;
  for (const c of nonTerbitCourses) {
    if (sitemapText.includes(`/kursus/${c.slug}`)) {
      noNonTerbitIncluded = false;
      console.warn(`Kursus non-terbit (${c.status}) bocor ke sitemap: ${c.slug}`);
    }
  }

  const hasHome = sitemapText.includes('<loc>') && sitemapText.includes('kursus');
  const sitemapPass =
    sitemapRes.status === 200 &&
    hasHome &&
    allTerbitIncluded &&
    noNonTerbitIncluded &&
    terbitCourses.length > 0;

  record(
    'UJI-SEO-02',
    `sitemap.xml: Hanya memuat beranda, /kursus, dan ${terbitCourses.length} kursus terbit; 0 kursus non-terbit`,
    sitemapPass,
    {
      terbitCount: terbitCourses.length,
      nonTerbitCount: nonTerbitCourses.length,
      allTerbitIncluded,
      noNonTerbitIncluded,
    }
  );

  // =========================================================================
  // 3. UJI OTORISASI CRON PAYMENT-REMINDERS
  // =========================================================================
  console.log('\n--- 3. PENGUJIAN KEAMANAN ENDPOINT CRON ---');

  // 3.1 Panggilan Tanpa Secret -> 401
  const resNoAuth = await fetch(`http://localhost:${SERVER_PORT}/api/cron/payment-reminders`, {
    method: 'POST',
  });
  const passNoAuth = resNoAuth.status === 401;
  record('UJI-CRON-01', 'Panggilan cron tanpa secret -> Ditolak (HTTP 401)', passNoAuth, {
    status: resNoAuth.status,
  });

  // 3.2 Panggilan Dengan Secret Salah -> 401
  const resWrongAuth = await fetch(`http://localhost:${SERVER_PORT}/api/cron/payment-reminders`, {
    method: 'POST',
    headers: { Authorization: 'Bearer token_cron_palsu_yang_salah_total' },
  });
  const passWrongAuth = resWrongAuth.status === 401;
  record('UJI-CRON-02', 'Panggilan cron dengan secret salah -> Ditolak (HTTP 401)', passWrongAuth, {
    status: resWrongAuth.status,
  });

  // =========================================================================
  // 4. UJI KEDALUWARSA OTOMATIS & IDEMPOTENSI PENGINGAT (DUA KALI JALAN)
  // =========================================================================
  console.log('\n--- 4. PENGUJIAN KEDALUWARSA & IDEMPOTENSI CRON (DUA KALI JALAN) ---');

  const time = Date.now();
  const testInstructor = '00000000-0000-4000-a000-000000000012';
  const testStudentA = '00000000-0000-4000-a000-000000000102'; // Rizky
  const testStudentB = 'd2ad061a-cf73-41a0-b3e3-52e434ccdd1d'; // Akun terverifikasi Resend (jongroihatulazizah1201@gmail.com)

  const courseId = 'e1111111-1111-4111-e111-111111111111';
  const regIdExpired = 'e2222222-2222-4222-e222-222222222221'; // Batas bayar lewat (1 jam lalu)
  const regIdReminder = 'e2222222-2222-4222-e222-222222222222'; // Batas bayar tersisa 1 jam lagi (<= 3 jam)

  const allRegs = [regIdExpired, regIdReminder];

  // Bersihkan data lama jika ada
  await supabase.from('audit_log').delete().in('id_data', allRegs);
  await supabase.from('pendaftaran').delete().in('id', allRegs);
  await supabase.from('kursus').delete().eq('id', courseId);

  // Buat kursus uji
  await supabase.from('kursus').insert({
    id: courseId,
    instruktur_id: testInstructor,
    judul: 'Kursus Uji Cron',
    slug: `kursus-uji-cron-${time}`,
    kategori: 'Perkantoran',
    ringkasan: 'Ringkasan',
    deskripsi: 'Deskripsi',
    harga: 100000,
    kuota: 10,
    nilai_lulus: 70,
    status: 'terbit',
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Buat 2 pendaftaran: 1 sudah lewat batas bayar, 1 masih dalam window 3 jam
  await supabase.from('pendaftaran').insert([
    {
      id: regIdExpired,
      kursus_id: courseId,
      peserta_id: testStudentA,
      status: 'menunggu_bayar',
      nominal: 100000,
      metode_bayar: 'transfer_manual',
      batas_bayar: oneHourAgo,
    },
    {
      id: regIdReminder,
      kursus_id: courseId,
      peserta_id: testStudentB,
      status: 'menunggu_bayar',
      nominal: 100000,
      metode_bayar: 'transfer_manual',
      batas_bayar: oneHourLater,
    },
  ]);

  // EKSEKUSI CRON PERTAMA
  console.log('Menjalankan cron pertama...');
  const resCron1 = await fetch(`http://localhost:${SERVER_PORT}/api/cron/payment-reminders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const dataCron1 = await resCron1.json();

  // Periksa database setelah run pertama
  const { data: dbExpired1 } = await supabase.from('pendaftaran').select('status').eq('id', regIdExpired);
  const { data: dbAuditExpired1 } = await supabase
    .from('audit_log')
    .select('id, aksi')
    .eq('id_data', regIdExpired)
    .eq('aksi', 'kedaluwarsa_otomatis_sistem');

  const { data: dbAuditReminder1 } = await supabase
    .from('audit_log')
    .select('id, aksi')
    .eq('id_data', regIdReminder)
    .eq('aksi', 'email_reminder_pembayaran_3jam');

  // EKSEKUSI CRON KEDUA (Duplikasi / Run Berikutnya)
  console.log('Menjalankan cron kedua (uji idempotensi)...');
  const resCron2 = await fetch(`http://localhost:${SERVER_PORT}/api/cron/payment-reminders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const dataCron2 = await resCron2.json();

  // Periksa database setelah run kedua
  const { data: dbExpired2 } = await supabase.from('pendaftaran').select('status').eq('id', regIdExpired);
  const { data: dbAuditExpired2 } = await supabase
    .from('audit_log')
    .select('id, aksi')
    .eq('id_data', regIdExpired)
    .eq('aksi', 'kedaluwarsa_otomatis_sistem');

  const { data: dbAuditReminder2 } = await supabase
    .from('audit_log')
    .select('id, aksi')
    .eq('id_data', regIdReminder)
    .eq('aksi', 'email_reminder_pembayaran_3jam');

  // Validasi:
  // 1. regIdExpired berubah jadi 'kedaluwarsa', ada 1 audit log di run 1 dan tetap 1 di run 2
  // 2. regIdReminder mendapat 1 audit log pengingat di run 1 dan TETAP 1 di run 2 (tidak dobel kirim)
  const cron1Pass =
    resCron1.status === 200 &&
    dbExpired1[0]?.status === 'kedaluwarsa' &&
    dbAuditExpired1.length === 1 &&
    dbAuditReminder1.length === 1;

  const cron2Pass =
    resCron2.status === 200 &&
    dbExpired2[0]?.status === 'kedaluwarsa' &&
    dbAuditExpired2.length === 1 && // tidak bertambah
    dbAuditReminder2.length === 1 && // tidak bertambah
    dataCron2.remindersSkipped >= 1; // terdeteksi skipped

  record(
    'UJI-CRON-03',
    'Eksekusi Cron Run-1: Mengubah batas lewat jadi kedaluwarsa & mengirim 1 pengingat',
    cron1Pass,
    { dataCron1, statusExpired: dbExpired1[0]?.status }
  );

  record(
    'UJI-CRON-04',
    'Eksekusi Cron Run-2 (Idempotensi): Tidak ada dobel kedaluwarsa & tidak ada dobel kirim email (audit log tetap 1)',
    cron2Pass,
    { dataCron2, auditReminderCount: dbAuditReminder2.length }
  );

  // Bersihkan data uji
  await supabase.from('audit_log').delete().in('id_data', allRegs);
  await supabase.from('pendaftaran').delete().in('id', allRegs);
  await supabase.from('kursus').delete().eq('id', courseId);
  console.log('\nPembersihan data uji selesai.');

  // Tutup server
  killProcessTree(nextProcess.pid);

  const allPassed = robotsPass && sitemapPass && passNoAuth && passWrongAuth && cron1Pass && cron2Pass;
  console.log(`\n================================================================`);
  console.log(`HASIL AKHIR: ${allPassed ? 'SEMUA UJI LULUS (100%)' : 'ADA UJI YANG GAGAL'}`);
  console.log(`================================================================`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
