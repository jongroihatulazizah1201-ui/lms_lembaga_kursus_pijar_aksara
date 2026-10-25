const crypto = require('crypto');
const { querySql } = require('./db_helper.cjs');

async function executeAs(userId, sql) {
  const query = `
    DO $$
    BEGIN
      PERFORM set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', false);
      PERFORM set_config('request.jwt.claim.sub', '${userId}', false);
      PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
    END $$;
    SET ROLE authenticated;
    ${sql}
  `;
  try {
    return await querySql(query);
  } finally {
    try {
      await querySql('RESET ROLE;');
    } catch {}
  }
}

async function testRoles() {
  console.log('=== UJI HAK AKSES PERAN SUNNGUHAN (Admin, Instruktur, Peserta) ===\n');

  const adminId = '00000000-0000-4000-a000-000000000002'; // Dimas Prasetyo (admin)
  const instructorId = '00000000-0000-4000-a000-000000000012'; // Laras Wulandari (instruktur)
  const studentId = '00000000-0000-4000-a000-000000000102'; // Rizky Ramadhan (peserta)

  const dummyCourseId = '00000000-0000-4000-b000-000000000001'; // Excel
  const dummyRegId = '00000000-0000-4000-c000-000000000001';

  // 1. Peserta memanggil admin_ubah_kuota_kursus dan admin_konfirmasi_pembayaran -> DITOLAK
  console.log('--- 1. Peserta memanggil admin RPC ---');
  let pesAdminErr1 = null;
  try {
    await executeAs(studentId, `SELECT public.admin_ubah_kuota_kursus('${dummyCourseId}', 50);`);
  } catch (err) {
    pesAdminErr1 = err.message;
  }
  console.log('Peserta -> admin_ubah_kuota_kursus:', pesAdminErr1 ? 'DITOLAK (PASS)' : 'GAGAL DITOLAK');

  let pesAdminErr2 = null;
  try {
    await executeAs(studentId, `SELECT public.admin_konfirmasi_pembayaran('${dummyRegId}');`);
  } catch (err) {
    pesAdminErr2 = err.message;
  }
  console.log('Peserta -> admin_konfirmasi_pembayaran:', pesAdminErr2 ? 'DITOLAK (PASS)' : 'GAGAL DITOLAK');

  // 2. Instruktur memanggil admin_* -> DITOLAK
  console.log('\n--- 2. Instruktur memanggil admin RPC ---');
  const adminFuncs = [
    `admin_ubah_kuota_kursus('${dummyCourseId}', 50)`,
    `admin_konfirmasi_pembayaran('${dummyRegId}')`,
    `admin_ubah_status_kursus('${dummyCourseId}', 'ditutup', 'Catatan admin')`,
    `admin_ubah_peran_pengguna('${studentId}', 'instruktur')`,
    `admin_ubah_status_pengguna('${studentId}', false)`,
    `admin_batalkan_pendaftaran('${dummyRegId}', 'Alasan batal')`
  ];

  for (const fn of adminFuncs) {
    let instErr = null;
    try {
      await executeAs(instructorId, `SELECT public.${fn};`);
    } catch (err) {
      instErr = err.message;
    }
    console.log(`Instruktur -> ${fn.split('(')[0]}:`, instErr ? 'DITOLAK (PASS)' : 'GAGAL DITOLAK');
  }

  // 3. Admin memanggil get_admin_dashboard_analytics dan ubah status kursus
  console.log('\n--- 3. Admin memanggil analytics & ubah status kursus ---');
  let adminAnalytics = null;
  try {
    adminAnalytics = await executeAs(adminId, `SELECT public.get_admin_dashboard_analytics(now() - interval '30 days', now());`);
    console.log('Admin -> get_admin_dashboard_analytics: BERHASIL (PASS)');
  } catch (err) {
    console.error('Admin -> get_admin_dashboard_analytics: GAGAL', err.message);
  }

  // Uji daur hidup kursus oleh admin: draf -> ditinjau -> terbit -> ditutup -> terbit
  const testCId = crypto.randomUUID();
  const testTag = Date.now();
  console.log('\n--- 4. Siklus Status Kursus: draf -> ditinjau -> terbit -> ditutup -> terbit ---');
  try {
    // Setup kursus baru dengan 2 modul dan masing-masing 3 soal saat draf (BR-03 & BR-04)
    await querySql(`
      INSERT INTO public.kursus (id, instruktur_id, judul, slug, kategori, ringkasan, deskripsi, harga, kuota, nilai_lulus, status)
      VALUES ('${testCId}', '${instructorId}', 'Kursus Siklus Status', 'kursus-siklus-${testTag}', 'Teknologi', 'Ringkasan', 'Deskripsi', 0, 10, 70, 'draf');

      INSERT INTO public.modul (id, kursus_id, urutan, judul, durasi_menit, isi_materi)
      VALUES 
        ('${crypto.randomUUID()}', '${testCId}', 1, 'Modul 1', 30, 'Materi 1'),
        ('${crypto.randomUUID()}', '${testCId}', 2, 'Modul 2', 30, 'Materi 2');
    `);

    const modRows = await querySql(`SELECT id FROM public.modul WHERE kursus_id = '${testCId}' ORDER BY urutan;`);
    for (const m of modRows) {
      await querySql(`
        INSERT INTO public.soal (modul_id, urutan, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban)
        VALUES 
          ('${m.id}', 1, 'Soal 1?', 'A', 'B', 'C', 'D', 'A'),
          ('${m.id}', 2, 'Soal 2?', 'A', 'B', 'C', 'D', 'B'),
          ('${m.id}', 3, 'Soal 3?', 'A', 'B', 'C', 'D', 'C');
      `);
    }

    // Step 1: draf -> ditinjau (Instruktur mengajukan)
    await executeAs(instructorId, `SELECT public.ajukan_kursus_instruktur('${testCId}');`);
    console.log('Step 1: draf -> ditinjau: BERHASIL (PASS)');

    // Step 2: ditinjau -> terbit (Admin menerbitkan)
    await executeAs(adminId, `SELECT public.admin_ubah_status_kursus('${testCId}', 'terbit', 'Disetujui admin');`);
    console.log('Step 2: ditinjau -> terbit: BERHASIL (PASS)');

    // Step 3: terbit -> ditutup (Admin menutup)
    await executeAs(adminId, `SELECT public.admin_ubah_status_kursus('${testCId}', 'ditutup', 'Ditutup admin');`);
    console.log('Step 3: terbit -> ditutup: BERHASIL (PASS)');

    // Step 4: ditutup -> terbit (Admin membuka kembali)
    await executeAs(adminId, `SELECT public.admin_ubah_status_kursus('${testCId}', 'terbit', 'Dibuka kembali');`);
    console.log('Step 4: ditutup -> terbit: BERHASIL (PASS)');

    // 5. Uji Alur Lengkap Peserta (daftar gratis, bayar, baca materi, get soal, submit kuis, batal)
    console.log('\n--- 5. Alur Lengkap Peserta ---');
    // Peserta mendaftar kursus gratis
    const regRes = await executeAs(studentId, `SELECT * FROM public.daftar_kursus('${testCId}', 'gratis');`);
    const studentRegId = regRes[0].id;
    console.log('Peserta -> daftar_kursus gratis: BERHASIL (PASS), id:', studentRegId);

    // Peserta get ruang belajar
    const ruang = await executeAs(studentId, `SELECT * FROM public.get_ruang_belajar('kursus-siklus-${testTag}');`);
    console.log('Peserta -> get_ruang_belajar: BERHASIL (PASS), modul count:', ruang.length);

    // Peserta tandai materi dibaca
    await executeAs(studentId, `SELECT * FROM public.tandai_materi_dibaca('${studentRegId}', '${modRows[0].id}');`);
    console.log('Peserta -> tandai_materi_dibaca: BERHASIL (PASS)');

    // Peserta get soal kuis
    const soalList = await executeAs(studentId, `SELECT * FROM public.get_soal_kuis('${modRows[0].id}');`);
    console.log('Peserta -> get_soal_kuis: BERHASIL (PASS), soal count:', soalList.length);

    // Peserta submit kuis (kunci jawaban berdasarkan ID soal)
    const jawabanPayload = {};
    soalList.forEach(s => { jawabanPayload[s.id] = 'A'; });
    const submitRes = await executeAs(studentId, `SELECT * FROM public.submit_kuis('${studentRegId}', '${modRows[0].id}', '${JSON.stringify(jawabanPayload)}'::jsonb);`);
    console.log('Peserta -> submit_kuis: BERHASIL (PASS), nilai:', submitRes[0].nilai);

    // Uji daftar berbayar & pembatalan oleh peserta
    // Buat kursus berbayar terbit terpisah
    const paidCId = crypto.randomUUID();
    await querySql(`
      INSERT INTO public.kursus (id, instruktur_id, judul, slug, kategori, ringkasan, deskripsi, harga, kuota, nilai_lulus, status)
      VALUES ('${paidCId}', '${instructorId}', 'Kursus Berbayar Uji', 'kursus-bayar-${testTag}', 'Bisnis', 'Ringkasan', 'Deskripsi', 150000, 10, 70, 'draf');

      INSERT INTO public.modul (id, kursus_id, urutan, judul, durasi_menit, isi_materi)
      VALUES 
        ('${crypto.randomUUID()}', '${paidCId}', 1, 'Modul 1', 30, 'Materi 1'),
        ('${crypto.randomUUID()}', '${paidCId}', 2, 'Modul 2', 30, 'Materi 2');
    `);
    const pModRows = await querySql(`SELECT id FROM public.modul WHERE kursus_id = '${paidCId}' ORDER BY urutan;`);
    for (const m of pModRows) {
      await querySql(`
        INSERT INTO public.soal (modul_id, urutan, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban)
        VALUES 
          ('${m.id}', 1, 'Soal 1?', 'A', 'B', 'C', 'D', 'A'),
          ('${m.id}', 2, 'Soal 2?', 'A', 'B', 'C', 'D', 'B'),
          ('${m.id}', 3, 'Soal 3?', 'A', 'B', 'C', 'D', 'C');
      `);
    }
    await executeAs(instructorId, `SELECT public.ajukan_kursus_instruktur('${paidCId}');`);
    await executeAs(adminId, `SELECT public.admin_ubah_status_kursus('${paidCId}', 'terbit', 'OK');`);

    // Peserta mendaftar kursus berbayar (status: menunggu_bayar)
    const paidRegRes = await executeAs(studentId, `SELECT * FROM public.daftar_kursus('${paidCId}', 'transfer_manual');`);
    const paidRegId = paidRegRes[0].id;
    console.log('Peserta -> daftar_kursus berbayar: BERHASIL (PASS), status:', paidRegRes[0].status);

    // Peserta membatalkan pendaftaran miliknya
    const cancelRes = await executeAs(studentId, `SELECT * FROM public.batalkan_pendaftaran_peserta('${paidRegId}');`);
    console.log('Peserta -> batalkan_pendaftaran_peserta: BERHASIL (PASS), status baru:', cancelRes[0].status);

    // Cleanup
    await querySql(`
      SET session_replication_role = 'replica';
      DELETE FROM public.pendaftaran WHERE kursus_id IN ('${testCId}', '${paidCId}');
      DELETE FROM public.modul WHERE kursus_id IN ('${testCId}', '${paidCId}');
      DELETE FROM public.kursus WHERE id IN ('${testCId}', '${paidCId}');
      SET session_replication_role = 'origin';
    `);
    console.log('\nData uji berhasil dibersihkan.');

  } catch (err) {
    console.error('Error saat siklus status & alur peserta:', err);
  }
}

testRoles().catch(console.error);
