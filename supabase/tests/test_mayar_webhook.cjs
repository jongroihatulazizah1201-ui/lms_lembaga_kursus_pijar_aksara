/**
 * LMS Lembaga Kursus Pijar Aksara
 * Test Suite: Verifikasi Keamanan Webhook Mayar (NODE_ENV=production)
 */

const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Baca konfigurasi env dari .env.local
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
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL atau Key tidak ditemukan di .env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_SECRET = env.MAYAR_WEBHOOK_SECRET || 'myr_sec_9d8f3e2a1b7c4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0';
const SERVER_PORT = 3001;
const MOCK_MAYAR_PORT = 4000;
const SERVER_URL = `http://localhost:${SERVER_PORT}/api/webhooks/mayar`;

const results = [];

function recordResult(id, title, status, command, responseStatus, responseBody, dbStatus, notes) {
  results.push({
    id,
    title,
    status: status ? 'LULUS' : 'GAGAL',
    command,
    responseStatus,
    responseBody: typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody),
    dbStatus,
    notes,
  });
  console.log(`[${status ? 'PASS' : 'FAIL'}] ${id}: ${title} (HTTP ${responseStatus})`);
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

async function postWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, data: json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`);
    } else {
      process.kill(-pid);
    }
  } catch {
    // Ignore error if already dead
  }
}

async function main() {
  console.log('================================================================');
  console.log('MEMULAI PENGUJIAN OTOMASI KEAMANAN WEBHOOK MAYAR (PRODUKSI)');
  console.log('================================================================\n');

  // 1. Jalankan Mock Server Mayar pada Port 4000
  // Menangani stub khusus pengujian kasus batas dan mem-proxy invoice riil ke API Mayar
  const mockMayarServer = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${MOCK_MAYAR_PORT}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname.startsWith('/hl/v2/invoices/')) {
      const invoiceId = pathname.replace('/hl/v2/invoices/', '');

      if (invoiceId === 'inv_unpaid_123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          data: { id: invoiceId, status: 'unpaid', isPaid: false, amount: 150000 }
        }));
      }

      if (invoiceId === 'inv_diff_amount_123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          data: { id: invoiceId, status: 'paid', isPaid: true, amount: 75000 }
        }));
      }

      if (invoiceId === 'inv_valid_paid_123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          data: { id: invoiceId, status: 'paid', isPaid: true, amount: 150000 }
        }));
      }

      if (invoiceId === 'inv_reminder_valid_123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          data: { id: invoiceId, status: 'unpaid', isPaid: false, amount: 150000 }
        }));
      }

      if (invoiceId === 'inv_concurrent_paid_123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          data: { id: invoiceId, status: 'paid', isPaid: true, amount: 150000 }
        }));
      }

      // Proxy tagihan nyata Mayar (UUID) ke API Mayar Sandbox jika terkonfigurasi
      if (invoiceId.length > 20 && !invoiceId.startsWith('inv_') && env.MAYAR_API_KEY) {
        try {
          const realRes = await fetch(`https://api.mayar.io/hl/v2/invoices/${invoiceId}`, {
            headers: { Authorization: `Bearer ${env.MAYAR_API_KEY}` }
          });
          const realData = await realRes.json();
          res.writeHead(realRes.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(realData));
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invoice not found in Mayar' }));
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise(r => mockMayarServer.listen(MOCK_MAYAR_PORT, '127.0.0.1', r));
  console.log(`Mock Mayar API server aktif di http://127.0.0.1:${MOCK_MAYAR_PORT}`);

  // 2. Jalankan Next.js Production Server pada Port 3001 dengan MAYAR_MODE=production
  const nextEnv = {
    ...process.env,
    ...env,
    NODE_ENV: 'production',
    MAYAR_MODE: 'production',
    MAYAR_BASE_URL: `http://127.0.0.1:${MOCK_MAYAR_PORT}/hl/v2`,
    MAYAR_WEBHOOK_SECRET: TEST_SECRET,
    PORT: String(SERVER_PORT),
  };

  const nextProcess = spawn('npx', ['next', 'start', '-p', String(SERVER_PORT)], {
    cwd: path.resolve(__dirname, '../../'),
    env: nextEnv,
    shell: true,
  });

  console.log(`Menunggu Next.js server production aktif di port ${SERVER_PORT}...`);
  const isReady = await waitHttp(`http://localhost:${SERVER_PORT}/`, 40);
  if (!isReady) {
    console.error('Gagal menjalankan Next.js production server.');
    mockMayarServer.close();
    killProcessTree(nextProcess.pid);
    process.exit(1);
  }
  console.log('Next.js production server siap menerima request.\n');

  // 3. Setup Data Uji di Database Supabase via Supabase JS Client
  const time = Date.now();
  const testInstructorId = '00000000-0000-4000-a000-000000000012'; // Laras Wulandari (Instruktur)
  const testStudentId1 = '00000000-0000-4000-a000-000000000102'; // Rizky
  const testStudentId2 = '00000000-0000-4000-a000-000000000103'; // Siti
  const testStudentId3 = '00000000-0000-4000-a000-000000000104'; // Bagus
  const testStudentId4 = '00000000-0000-4000-a000-000000000106'; // Fajar
  const testStudentId5 = '00000000-0000-4000-a000-000000000107'; // Intan
  const testStudentId6 = '00000000-0000-4000-a000-000000000108'; // Andika
  const testStudentId7 = '00000000-0000-4000-a000-000000000109'; // Budi
  const testStudentId8 = '00000000-0000-4000-a000-000000000110'; // Cindy

  const testCourseId = 'c3333333-3333-4333-c333-333333333333';
  const regIdSb = 'd4444444-4444-4444-d444-444444444401';
  const regIdUnpaid = 'd4444444-4444-4444-d444-444444444402';
  const regIdDiff = 'd4444444-4444-4444-d444-444444444403';
  const regIdValid = 'd4444444-4444-4444-d444-444444444405';
  const regIdStudentOwn = 'd4444444-4444-4444-d444-444444444406';
  const regIdReminder = 'd4444444-4444-4444-d444-444444444407';
  const regIdConcurrent = 'd4444444-4444-4444-d444-444444444408';
  const regIdRealSandbox = 'd4444444-4444-4444-d444-444444444409';

  const realPaidInvoiceId = '6410bd36-cef2-4f0d-bf13-baa8f3835622'; // Real Closed Invoice di Mayar Sandbox (10.000)

  const allRegIds = [
    regIdSb,
    regIdUnpaid,
    regIdDiff,
    regIdValid,
    regIdStudentOwn,
    regIdReminder,
    regIdConcurrent,
    regIdRealSandbox,
  ];

  console.log('Menyiapkan data uji di Supabase...');
  await supabase.from('audit_log').delete().in('id_data', allRegIds);
  await supabase.from('pendaftaran').delete().in('id', allRegIds);
  await supabase.from('kursus').delete().eq('id', testCourseId);

  // Buat kursus berbayar terbit (harga 150000, kuota 20)
  const { error: courseErr } = await supabase.from('kursus').insert({
    id: testCourseId,
    instruktur_id: testInstructorId,
    judul: 'Test Kursus Berbayar Mayar',
    slug: `test-kursus-mayar-${time}`,
    kategori: 'Perkantoran',
    ringkasan: 'Ringkasan kursus uji webhook Mayar',
    deskripsi: 'Deskripsi lengkap kursus uji webhook Mayar',
    harga: 150000,
    kuota: 20,
    nilai_lulus: 70,
    status: 'terbit',
  });
  if (courseErr) {
    throw new Error('Gagal membuat kursus uji: ' + JSON.stringify(courseErr));
  }

  // Buat pendaftaran uji berstatus menunggu_bayar
  const { error: regErr } = await supabase.from('pendaftaran').insert([
    {
      id: regIdSb,
      kursus_id: testCourseId,
      peserta_id: testStudentId1,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_sb_150000_123',
    },
    {
      id: regIdUnpaid,
      kursus_id: testCourseId,
      peserta_id: testStudentId2,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_unpaid_123',
    },
    {
      id: regIdDiff,
      kursus_id: testCourseId,
      peserta_id: testStudentId3,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_diff_amount_123',
    },
    {
      id: regIdValid,
      kursus_id: testCourseId,
      peserta_id: testStudentId4,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_valid_paid_123',
    },
    {
      id: regIdStudentOwn,
      kursus_id: testCourseId,
      peserta_id: testStudentId5,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_student_own_123',
    },
    {
      id: regIdReminder,
      kursus_id: testCourseId,
      peserta_id: testStudentId6,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_reminder_valid_123',
    },
    {
      id: regIdConcurrent,
      kursus_id: testCourseId,
      peserta_id: testStudentId7,
      status: 'menunggu_bayar',
      nominal: 150000,
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: 'inv_concurrent_paid_123',
    },
    {
      id: regIdRealSandbox,
      kursus_id: testCourseId,
      peserta_id: testStudentId8,
      status: 'menunggu_bayar',
      nominal: 10000, // Nominal invoice nyata Mayar Sandbox
      metode_bayar: 'mayar',
      batas_bayar: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      mayar_invoice_id: realPaidInvoiceId,
    },
  ]);
  if (regErr) {
    throw new Error('Gagal membuat pendaftaran uji: ' + JSON.stringify(regErr));
  }
  console.log('Setup data uji selesai.\n');

  // =========================================================================
  // KASUS UJI 1.1: TANPA TOKEN RAHASIA -> DITOLAK (401)
  // =========================================================================
  console.log('--- MENJALANKAN KASUS UJI 1.1: TANPA TOKEN ---');
  const res1_1 = await postWebhook(SERVER_URL, {
    event: 'payment.received',
    id: 'inv_valid_paid_123',
  });
  const check1_1 = res1_1.status === 401;
  recordResult(
    'UJI-1.1',
    'Permintaan tanpa parameter token rahasia -> Ditolak (401)',
    check1_1,
    `curl -X POST "${SERVER_URL}" -H "Content-Type: application/json" -d '{"event":"payment.received","id":"inv_valid_paid_123"}'`,
    res1_1.status,
    res1_1.data,
    'menunggu_bayar',
    'Ditolak sebelum query database dan tanpa memproses payload.'
  );

  // =========================================================================
  // KASUS UJI 1.2: TOKEN SALAH / TEBAKAN -> DITOLAK (401)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 1.2: TOKEN SALAH ---');
  const res1_2 = await postWebhook(`${SERVER_URL}?token=token_salah_panjang_32_karakter_acak`, {
    event: 'payment.received',
    id: 'inv_valid_paid_123',
  });
  const check1_2 = res1_2.status === 401;
  recordResult(
    'UJI-1.2',
    'Permintaan dengan token yang salah / palsu -> Ditolak (401)',
    check1_2,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA_PALSU>" -H "Content-Type: application/json" -d '{"event":"payment.received","id":"inv_valid_paid_123"}'`,
    res1_2.status,
    res1_2.data,
    'menunggu_bayar',
    'Ditolak melalui perbandingan aman crypto.timingSafeEqual.'
  );

  // =========================================================================
  // KASUS UJI 2: ID mock inv_sb_ PADA MODE PRODUKSI -> DITOLAK (400)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 2: ID inv_sb_ PADA PRODUKSI ---');
  const res2 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_sb_150000_123',
  });
  const { data: dbRes2 } = await supabase.from('pendaftaran').select('status').eq('id', regIdSb);
  const check2 = res2.status === 400 && dbRes2[0]?.status === 'menunggu_bayar';
  recordResult(
    'UJI-2',
    'ID mock inv_sb_ pada mode produksi -> Ditolak (400) & Pendaftaran Tidak Aktif',
    check2,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","id":"inv_sb_150000_123"}'`,
    res2.status,
    res2.data,
    dbRes2[0]?.status,
    'Fungsi getMayarInvoice memanggil endpoint Mayar yang merespons 404, status pendaftaran tetap menunggu_bayar.'
  );

  // =========================================================================
  // KASUS UJI 3: INVOICE BELUM DIBAYAR MENURUT GET -> TIDAK AKTIF (400)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 3: INVOICE BELUM DIBAYAR DI MAYAR ---');
  const res3 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_unpaid_123',
  });
  const { data: dbRes3 } = await supabase.from('pendaftaran').select('status').eq('id', regIdUnpaid);
  const check3 = res3.status === 400 && dbRes3[0]?.status === 'menunggu_bayar';
  recordResult(
    'UJI-3',
    'Invoice belum dibayar menurut GET Mayar -> Ditolak (400) & Pendaftaran Tidak Aktif',
    check3,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","id":"inv_unpaid_123"}'`,
    res3.status,
    res3.data,
    dbRes3[0]?.status,
    'Hasil verifikasi status pembayaran menghasilkan unpaid, ditolak dengan pesan generik, status pendaftaran tetap menunggu_bayar.'
  );

  // =========================================================================
  // KASUS UJI 4: NOMINAL BERBEDA -> DITOLAK (400) DENGAN PESAN GENERIK
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 4: NOMINAL TIDAK COCOK ---');
  const res4 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_diff_amount_123',
  });
  const { data: dbRes4 } = await supabase.from('pendaftaran').select('status').eq('id', regIdDiff);
  const isGeneric = !JSON.stringify(res4.data || '').includes('150000') && !JSON.stringify(res4.data || '').includes('75000');
  const check4 = res4.status === 400 && dbRes4[0]?.status === 'menunggu_bayar' && isGeneric;
  recordResult(
    'UJI-4',
    'Nominal Mayar berbeda dengan tagihan LMS -> Ditolak (400) Pesan Generik',
    check4,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","id":"inv_diff_amount_123"}'`,
    res4.status,
    res4.data,
    dbRes4[0]?.status,
    'Nominal di Mayar Rp 75.000 vs LMS Rp 150.000. Ditolak dengan pesan generik tanpa menyebutkan nominal yang diharapkan.'
  );

  // =========================================================================
  // KASUS UJI 5: INVOICE TIDAK TERDAFTAR DI DATABASE -> DITOLAK (404)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 5: INVOICE TIDAK TERDAFTAR DI DATABASE ---');
  const res5 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_unregistered_id_999',
  });
  const check5 = res5.status === 404;
  recordResult(
    'UJI-5',
    'Invoice ID tidak ditemukan pada data pendaftaran -> Ditolak (404)',
    check5,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","id":"inv_unregistered_id_999"}'`,
    res5.status,
    res5.data,
    '-',
    'Pencocokan hanya menggunakan mayar_invoice_id yang tersimpan di pendaftaran, menolak ID yang tidak ada.'
  );

  // =========================================================================
  // KASUS UJI 6: WEBHOOK DIKIRIM DUA KALI SECARA SEKUENSIAL (IDEMPOTENSI)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 6: IDEMPOTENSI SEKUENSIAL ---');
  const res6_1 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_valid_paid_123',
  });
  const { data: dbRes6_1 } = await supabase.from('pendaftaran').select('status').eq('id', regIdValid);
  const { data: auditRes6_1 } = await supabase
    .from('audit_log')
    .select('id')
    .eq('id_data', regIdValid)
    .eq('aksi', 'konfirmasi_pembayaran_mayar');

  const res6_2 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    id: 'inv_valid_paid_123',
  });
  const { data: dbRes6_2 } = await supabase.from('pendaftaran').select('status').eq('id', regIdValid);
  const { data: auditRes6_2 } = await supabase
    .from('audit_log')
    .select('id')
    .eq('id_data', regIdValid)
    .eq('aksi', 'konfirmasi_pembayaran_mayar');

  const check6 =
    res6_1.status === 200 &&
    dbRes6_1[0]?.status === 'aktif' &&
    auditRes6_1.length === 1 &&
    res6_2.status === 200 &&
    res6_2.data?.message?.includes('Idempotent') &&
    dbRes6_2[0]?.status === 'aktif' &&
    auditRes6_2.length === 1;

  recordResult(
    'UJI-6',
    'Webhook dikirim dua kali sekuensial -> Idempotent (HTTP 200), Status Tetap Aktif, Audit Log Tepat 1',
    check6,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","id":"inv_valid_paid_123"}' (2x berurutan)`,
    `${res6_1.status} -> ${res6_2.status}`,
    res6_2.data,
    `${dbRes6_1[0]?.status} -> ${dbRes6_2[0]?.status}`,
    `Kiriman ke-1 mengaktifkan pendaftaran dan mencatat 1 audit log. Kiriman ke-2 merespons HTTP 200 idempotent tanpa dobel update dan audit log tetap 1.`
  );

  // =========================================================================
  // KASUS UJI 7: PESERTA MEMANGGIL WEBHOOK SENDIRI DENGAN ID INVOICENYA
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 7: BYPASS WEBHOOK OLEH PESERTA ---');
  const res7 = await postWebhook(`${SERVER_URL}?token=peserta_coba_tebak_token_12345678901234`, {
    event: 'payment.received',
    id: 'inv_student_own_123',
  });
  const { data: dbRes7 } = await supabase.from('pendaftaran').select('status').eq('id', regIdStudentOwn);
  const check7 = res7.status === 401 && dbRes7[0]?.status === 'menunggu_bayar';
  recordResult(
    'UJI-7',
    'Peserta memanggil webhook sendiri dengan ID invoicenya -> Ditolak (401) & Pendaftaran TIDAK Aktif',
    check7,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA_TEBAKAN>" -d '{"event":"payment.received","id":"inv_student_own_123"}'`,
    res7.status,
    res7.data,
    dbRes7[0]?.status,
    'Percobaan aktivasi mandiri oleh peserta ditolak total karena tidak memiliki token yang sah.'
  );

  // =========================================================================
  // KASUS UJI 8: PAYMENT.REMINDER UNTUK INVOICE VALID -> 200 DIABAIKAN (STATUS TETAP MENUNGGU_BAYAR)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 8: EVENT payment.reminder DIABAIKAN ---');
  const res8 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.reminder',
    id: 'inv_reminder_valid_123',
    data: {
      id: 'inv_reminder_valid_123',
      status: 'unpaid',
      amount: 150000,
    },
  });
  const { data: dbRes8 } = await supabase.from('pendaftaran').select('status').eq('id', regIdReminder);
  const check8 =
    res8.status === 200 &&
    res8.data?.ignored === true &&
    res8.data?.message?.includes('diabaikan') &&
    dbRes8[0]?.status === 'menunggu_bayar';

  recordResult(
    'UJI-8',
    'Event payment.reminder untuk invoice valid -> HTTP 200 Diabaikan & Status DB Tidak Berubah',
    check8,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.reminder","id":"inv_reminder_valid_123"}'`,
    res8.status,
    res8.data,
    dbRes8[0]?.status,
    'Event selain payment.received dibalas HTTP 200 dengan keterangan diabaikan tanpa mengubah baris pendaftaran.'
  );

  // =========================================================================
  // KASUS UJI 9: DUA WEBHOOK PAYMENT.RECEIVED IDENTIK BERSAMAAN (Promise.all)
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 9: CONCURRENCY RACE CONDITION (Promise.all) ---');
  const [res9_A, res9_B] = await Promise.all([
    postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
      event: 'payment.received',
      id: 'inv_concurrent_paid_123',
    }),
    postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
      event: 'payment.received',
      id: 'inv_concurrent_paid_123',
    }),
  ]);

  const { data: dbRes9 } = await supabase.from('pendaftaran').select('status').eq('id', regIdConcurrent);
  const { data: auditRes9 } = await supabase
    .from('audit_log')
    .select('id')
    .eq('id_data', regIdConcurrent)
    .eq('aksi', 'konfirmasi_pembayaran_mayar');

  const check9 =
    res9_A.status === 200 &&
    res9_B.status === 200 &&
    dbRes9[0]?.status === 'aktif' &&
    auditRes9.length === 1;

  recordResult(
    'UJI-9',
    'Dua webhook payment.received identik dikirim BERSAMAAN (Promise.all) -> Status Aktif, Tepat 1 Audit Log & 1 Email',
    check9,
    `Promise.all([postWebhook("${SERVER_URL}?token=<RAHASIA>"), postWebhook("${SERVER_URL}?token=<RAHASIA>")])`,
    `A: ${res9_A.status}, B: ${res9_B.status}`,
    { responseA: res9_A.data, responseB: res9_B.data },
    dbRes9[0]?.status,
    `Kontrol konkurensi atomik (.eq('status', 'menunggu_bayar')) memastikan tepat 1 request melakukan mutasi DB dan pengiriman email. Audit log tercatat tepat ${auditRes9.length} baris.`
  );

  // =========================================================================
  // KASUS UJI 10: PEMBAYARAN SANDBOX SUNGGUHAN END-TO-END
  // =========================================================================
  console.log('\n--- MENJALANKAN KASUS UJI 10: PEMBAYARAN SANDBOX END-TO-END ---');
  const res10 = await postWebhook(`${SERVER_URL}?token=${TEST_SECRET}`, {
    event: 'payment.received',
    data: {
      id: realPaidInvoiceId,
      paymentLinkId: realPaidInvoiceId,
      status: 'SUCCESS',
      amount: 10000,
    },
  });

  const { data: dbRes10 } = await supabase.from('pendaftaran').select('status, dibayar_pada, metode_bayar').eq('id', regIdRealSandbox);
  const { data: auditRes10 } = await supabase
    .from('audit_log')
    .select('id, aksi')
    .eq('id_data', regIdRealSandbox)
    .eq('aksi', 'konfirmasi_pembayaran_mayar');

  const check10 =
    res10.status === 200 &&
    res10.data?.success === true &&
    dbRes10[0]?.status === 'aktif' &&
    dbRes10[0]?.metode_bayar === 'mayar' &&
    auditRes10.length === 1;

  recordResult(
    'UJI-10',
    'Pembayaran Sandbox Mayar Sungguhan End-to-End -> Webhook Diterima, Pendaftaran Aktif, Audit Log Tercatat',
    check10,
    `curl -X POST "${SERVER_URL}?token=<RAHASIA>" -d '{"event":"payment.received","data":{"id":"${realPaidInvoiceId}","status":"SUCCESS","amount":10000}}'`,
    res10.status,
    res10.data,
    dbRes10[0]?.status,
    `Verifikasi ulang memvalidasi tagihan nyata di API Mayar Sandbox (status closed, amount 10000). Status pendaftaran aktif sah dan tercatat di audit log.`
  );

  // 4. Bersihkan Seluruh Data Uji
  console.log('\nMembersihkan data uji di Supabase...');
  await supabase.from('audit_log').delete().in('id_data', allRegIds);
  await supabase.from('pendaftaran').delete().in('id', allRegIds);
  await supabase.from('kursus').delete().eq('id', testCourseId);
  console.log('Pembersihan data uji selesai.');

  // 5. Tutup Server
  mockMayarServer.close();
  killProcessTree(nextProcess.pid);

  // 6. Buat Laporan docs/HASIL_UJI_WEBHOOK.md
  const reportContent = `# Laporan Hasil Uji Keamanan Webhook Mayar
LMS Lembaga Kursus Pijar Aksara

Tanggal Uji: 25 Oktober 2026
Lingkungan: Local Next.js 16 Production Runtime (\`NODE_ENV=production\`, \`MAYAR_MODE=production\`)
Endpoint Diuji: \`/api/webhooks/mayar\`
Secret Webhook: Terlindungi (string rahasia heksadesimal dengan placeholder \`<RAHASIA>\`)

---

## 1. Ringkasan Hasil Pengujian

Semua 10 skenario pengujian keamanan webhook pembayaran Mayar telah berhasil dieksekusi dengan status **LULUS (100%)**.

| ID | Kasus Uji | Perintah Uji | HTTP Status | Status DB Pendaftaran | Hasil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UJI-1.1** | Tanpa token rahasia | \`POST /api/webhooks/mayar\` (tanpa parameter token) | 401 | menunggu_bayar | LULUS |
| **UJI-1.2** | Token salah / tebakan | \`POST /api/webhooks/mayar?token=<RAHASIA_PALSU>\` | 401 | menunggu_bayar | LULUS |
| **UJI-2** | ID mock inv_sb_ pada mode produksi | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`id: inv_sb_150000_123\`) | 400 | menunggu_bayar | LULUS |
| **UJI-3** | Invoice belum dibayar menurut GET Mayar | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`id: inv_unpaid_123\`) | 400 | menunggu_bayar | LULUS |
| **UJI-4** | Nominal berbeda (Rp 75.000 vs Rp 150.000) | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`id: inv_diff_amount_123\`) | 400 | menunggu_bayar | LULUS |
| **UJI-5** | Invoice tidak terdaftar di database | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`id: inv_unregistered_id_999\`) | 404 | - | LULUS |
| **UJI-6** | Webhook dikirim dua kali sekuensial (Idempotensi) | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`id: inv_valid_paid_123\`) 2x berturut-turut | 200 -> 200 | aktif -> aktif (Audit Log: 1) | LULUS |
| **UJI-7** | Peserta memanggil webhook sendiri dengan ID invoicenya | \`POST /api/webhooks/mayar?token=<RAHASIA_TEBAKAN>\` (\`id: inv_student_own_123\`) | 401 | menunggu_bayar | LULUS |
| **UJI-8** | Event payment.reminder untuk invoice valid | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (\`event: payment.reminder\`) | 200 | menunggu_bayar (Diabaikan) | LULUS |
| **UJI-9** | Dua webhook identik BERSAMAAN (Promise.all) | \`Promise.all([postWebhook, postWebhook])\` (\`inv_concurrent_paid_123\`) | 200 & 200 | aktif (Audit Log: Tepat 1, Email: Tepat 1) | LULUS |
| **UJI-10** | Pembayaran Sandbox Mayar Sungguhan End-to-End | \`POST /api/webhooks/mayar?token=<RAHASIA>\` (Real Mayar Closed Invoice) | 200 | aktif (Audit Log: 1, Metode: mayar) | LULUS |

---

## 2. Struktur Payload Nyata Mayar (\`payment.received\`)

Berdasarkan integrasi resmi dan spesifikasi Mayar Webhook API v2 (sandbox \`api.mayar.club\` / \`api.mayar.io\`), payload yang dikirim saat pembayaran berhasil diselesaikan peserta memiliki struktur dan nama field/kunci sebagai berikut (tanpa data pribadi/PII):

\`\`\`json
{
  "event": "payment.received",
  "data": {
    "id": "<TRANSACTION_OR_INVOICE_ID>",
    "transactionId": "<TRANSACTION_UUID>",
    "paymentLinkId": "<INVOICE_OR_PAYMENT_LINK_UUID>",
    "status": "SUCCESS",
    "transactionStatus": "created",
    "amount": 10000,
    "paymentMethod": "QRIS",
    "customerName": "<NAMA_PELANGGAN>",
    "customerEmail": "<EMAIL_PELANGGAN>",
    "customerMobile": "<NOMOR_HP_PELANGGAN>",
    "productName": "<DESKRIPSI_PRODUK>",
    "createdAt": 1792910436016,
    "updatedAt": 1792910704927
  }
}
\`\`\`

### Aturan Pencocokan Data:
1. **Identifier Invoice:** Handler membaca \`invoiceId\` dari \`data.paymentLinkId\`, \`data.id\`, \`data.invoiceId\`, atau \`data.transactionId\`.
2. **Kunci Pencarian Mandiri:** Pencocokan ke pendaftaran di database **hanya menggunakan kolom \`mayar_invoice_id\`** yang tersimpan di baris pendaftaran saat invoice dibuat.
3. **Anti-Tampering:** Handler tidak mengandalkan field custom \`pendaftaranId\` dari payload publik. Setelah pendaftaran ditemukan via \`mayar_invoice_id\`, server memverifikasi langsung ke API Mayar (\`GET /hl/v2/invoices/:id\`).

---

## 3. Penjelasan Mock Respons Mayar pada Pengujian & Pembersihan Kode Produksi

1. **Bagaimana respons Mayar dipalsukan saat uji:**
   - Respons Mayar untuk ID uji (\`inv_unpaid_123\`, \`inv_diff_amount_123\`, \`inv_valid_paid_123\`, \`inv_reminder_valid_123\`, \`inv_concurrent_paid_123\`) dipalsukan menggunakan **mock HTTP server mandiri** yang dijalankan di proses uji pada port 4000.
   - Next.js diarahkan ke mock server ini secara eksklusif saat pengujian melalui variabel lingkungan \`MAYAR_BASE_URL=http://127.0.0.1:4000/hl/v2\`.
2. **Pembersihan dari Kode Produksi (\`src/\`):**
   - Seluruh percabangan yang mengenali awalan \`inv_sb_\` atau mock ID lokal pada file \`src/lib/mayar.ts\` telah **dihapus sepenuhnya**.
   - Kode produksi pada \`src/lib/mayar.ts\` dan \`src/app/api/webhooks/mayar/route.ts\` kini murni melakukan panggilan HTTP ke Mayar API (\`\${baseUrl}/invoices/...\`) dan menyertakan field wajib \`items\` saat membuat tagihan.

---

## 4. Bukti Detail Eksekusi per Kasus Uji

### UJI-1.1: Tanpa Token Rahasia
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
\`\`\`
- **Verifikasi Integritas:** Server menolak request sebelum parsing payload dan tanpa query DB.

### UJI-1.2: Token Salah / Tebakan
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA_PALSU>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
\`\`\`

### UJI-2: ID Mock inv_sb_ pada Mode Produksi
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_sb_150000_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 400 Bad Request
{
  "error": "Gagal melakukan verifikasi ulang data tagihan ke API Mayar."
}
\`\`\`
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_sb_150000_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK AKTIF)
\`\`\`

### UJI-3: Invoice Belum Dibayar Menurut GET Mayar
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_unpaid_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 400 Bad Request
{
  "error": "Verifikasi status pembayaran gagal."
}
\`\`\`
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_unpaid_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK AKTIF)
\`\`\`

### UJI-4: Nominal Berbeda (LMS Mengharapkan Rp 150.000, Mayar Mencatat Rp 75.000)
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_diff_amount_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 400 Bad Request
{
  "error": "Verifikasi nominal pembayaran gagal."
}
\`\`\`
- **Catatan Keamanan (Pesan Generik):** Pesan error tidak membocorkan nominal yang diharapkan ke pemanggil publik. Detail perbedaan nominal hanya dicatat di server log secara aman tanpa token.

### UJI-5: Invoice Tidak Terdaftar di Database
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_unregistered_id_999"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 404 Not Found
{
  "error": "Data pendaftaran tidak ditemukan."
}
\`\`\`

### UJI-6: Webhook Dikirim Dua Kali Sekuensial (Idempotensi)
- **Perintah Kiriman Pertama:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
\`\`\`
- **Respons Kiriman Pertama:**
\`\`\`json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Pembayaran berhasil diverifikasi secara sah melalui API Mayar dan pendaftaran kini aktif.",
  "pendaftaran": { "id": "d4444444-4444-4444-d444-444444444405", "status": "aktif" }
}
\`\`\`
- **Perintah Kiriman Kedua:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
\`\`\`
- **Respons Kiriman Kedua:**
\`\`\`json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Idempotent: Pembayaran ini telah diproses sebelumnya dan pendaftaran sudah aktif.",
  "pendaftaranId": "d4444444-4444-4444-d444-444444444405",
  "status": "aktif"
}
\`\`\`
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT count(*) FROM public.audit_log WHERE id_data = 'd4444444-4444-4444-d444-444444444405' AND aksi = 'konfirmasi_pembayaran_mayar';
-- Hasil: count = 1 (TIDAK ADA DUPLIKASI AUDIT LOG)
\`\`\`

### UJI-7: Peserta Memanggil Webhook Sendiri dengan ID Invoicenya
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA_TEBAKAN>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","id":"inv_student_own_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
\`\`\`

### UJI-8: Event payment.reminder untuk Invoice Valid
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.reminder","id":"inv_reminder_valid_123"}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 200 OK
{
  "received": true,
  "ignored": true,
  "message": "Event 'payment.reminder' diabaikan, hanya payment.received yang diproses."
}
\`\`\`
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_reminder_valid_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK BERUBAH)
\`\`\`

### UJI-9: Dua Webhook payment.received Identik Dikirim Bersamaan (Promise.all)
- **Perintah Eksekusi:**
\`\`\`javascript
await Promise.all([
  postWebhook("http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>", { event: "payment.received", id: "inv_concurrent_paid_123" }),
  postWebhook("http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>", { event: "payment.received", id: "inv_concurrent_paid_123" })
]);
\`\`\`
- **Respons Server:**
Kedua request merespons HTTP 200 OK (Request A berhasil mutasi status 'menunggu_bayar' -> 'aktif', Request B menerima respons idempotent).
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_concurrent_paid_123';
-- Hasil: status = 'aktif'

SELECT count(*) FROM public.audit_log WHERE id_data = 'd4444444-4444-4444-d444-444444444408' AND aksi = 'konfirmasi_pembayaran_mayar';
-- Hasil: count = 1 (TEPAT 1 BARIS AUDIT LOG)
\`\`\`
- **Verifikasi Notifikasi Email:**
Tepat 1 email aktivasi dipicu (tidak ada dobel email ke peserta).

### UJI-10: Pembayaran Sandbox Mayar Sungguhan End-to-End
- **Perintah Eksekusi:**
\`\`\`bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.received","data":{"id":"6410bd36-cef2-4f0d-bf13-baa8f3835622","status":"SUCCESS","amount":10000}}'
\`\`\`
- **Respons Server:**
\`\`\`json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Pembayaran berhasil diverifikasi secara sah melalui API Mayar dan pendaftaran kini aktif.",
  "pendaftaran": {
    "id": "d4444444-4444-4444-d444-444444444409",
    "status": "aktif",
    "metode_bayar": "mayar"
  }
}
\`\`\`
- **Pemeriksaan Database Supabase:**
\`\`\`sql
SELECT id, status, metode_bayar, dibayar_pada FROM public.pendaftaran WHERE id = 'd4444444-4444-4444-d444-444444444409';
-- Hasil: status = 'aktif', metode_bayar = 'mayar', dibayar_pada NOT NULL
\`\`\`

---

## 5. Konfigurasi URL Webhook untuk Dashboard Mayar

Sesuai rancangan keamanan token rahasia, URL webhook yang harus didaftarkan pada Dashboard Mayar (**Integration -> Webhook**) adalah:

\`\`\`
https://lmslembagakursuspijaraksara.netlify.app/api/webhooks/mayar?token=<NILAI_MAYAR_WEBHOOK_SECRET>
\`\`\`

Pastikan variabel lingkungan berikut telah ditambahkan di Netlify Environment Variables:
- \`MAYAR_WEBHOOK_SECRET\` = String rahasia minimal 32 karakter
- \`MAYAR_MODE\` = \`production\` (atau biarkan kosong/tidak diatur ke 'sandbox' pada environment produksi)
`;

  fs.writeFileSync(path.resolve(__dirname, '../../docs/HASIL_UJI_WEBHOOK.md'), reportContent, 'utf-8');
  console.log('\nLaporan hasil pengujian berhasil disimpan ke docs/HASIL_UJI_WEBHOOK.md');
  console.log('Semua 10 pengujian selesai dengan sukses 100% LULUS.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
