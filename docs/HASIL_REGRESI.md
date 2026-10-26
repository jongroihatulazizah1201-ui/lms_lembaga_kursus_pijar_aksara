# Laporan Hasil Uji Regresi Lengkap
LMS Lembaga Kursus Pijar Aksara

Tanggal Uji: 25 Oktober 2026
Lingkungan: Supabase PostgreSQL + Local Next.js 16 Production Runtime
Cakupan: 20 Kasus Uji Aturan Bisnis PRD (docs/HASIL_UJI.md) + 10 Kasus Uji Keamanan Webhook Mayar (docs/HASIL_UJI_WEBHOOK.md)

---

## 1. Ringkasan Status Regresi

| Kelompok Uji | Total Kasus | Lulus | Gagal | Persentase | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aturan Bisnis PRD (BR-06 s.d. BR-12)** | 20 | 20 | 0 | 100% | **LULUS (100%)** |
| **Keamanan Webhook Mayar** | 11 | 11 | 0 | 100% | **LULUS (100%)** |
| **Total Keseluruhan** | **31** | **31** | **0** | **100%** | **SELURUH PENGUJIAN LULUS** |

---

## 2. Tabel Regresi Lengkap: Aturan Bisnis PRD

| Kasus | Hasil | Bukti |
| :--- | :--- | :--- |
| **TC-BR10-01: Kirim kuis ke-4 pada modul yang sama wajib ditolak oleh sistem** | **Lulus** | `submit_kuis('540da96f-c309-4804-9184-889787dddccd', 'dc36d797-1fae-4770-8810-bde562947642', ...) [Percobaan ke-4]`<br><small>Query failed (400): {"message":"Failed to run sql query: ERROR:  P0001: Batas maksimal 3 kali percobaan kuis telah habis (BR-10)\nCONTEXT:  PL/pgSQL function submit_kuis(uuid,uuid,jsonb) line 69 at RAISE\n"}</small> |
| **TC-BR10-02: Dua kiriman kuis bersamaan saat sisa 1 kesempatan: hanya 1 yang berhasil, percobaan ke-4 ditolak** | **Lulus** | `Promise.all([submit_kuis, submit_kuis]) pada sisa 1 kesempatan`<br><small>Berhasil: 1, Ditolak: 1, Total di DB: 3</small> |
| **TC-BR10-03: Modul yang sudah lulus tidak bisa dikerjakan ulang** | **Lulus** | `submit_kuis('33a64e73-7667-4eeb-bf08-0425d5fb0d67', 'dc36d797-1fae-4770-8810-bde562947642', ...) [Setelah Lulus]`<br><small>Query failed (400): {"message":"Failed to run sql query: ERROR:  P0001: Modul ini sudah lulus dan tidak bisa dikerjakan lagi (BR-10)\nCONTEXT:  PL/pgSQL function submit_kuis(uuid,uuid,jsonb) line 59 at RAISE\n"}</small> |
| **TC-BR09-01: Nilai kuis dibulatkan ke bawah (Floor): 2 dari 3 soal benar menghasilkan nilai tepat 66** | **Lulus** | `submit_kuis(2 benar dari 3 soal)`<br><small>Nilai: 66, Jumlah Benar: 2, Total Soal: 3</small> |
| **TC-BR09-02: Peserta (role authenticated) tidak bisa SELECT kolom kunci_jawaban langsung (RLS menghasilkan 0 baris)** | **Lulus** | `SELECT id, kunci_jawaban FROM public.soal [Sebagai Peserta]`<br><small>Jumlah baris dikembalikan: 0 baris (RLS memblokir akses peserta)</small> |
| **TC-BR09-03: Respons RPC get_soal_kuis tidak memuat kolom kunci_jawaban sama sekali** | **Lulus** | `SELECT * FROM public.get_soal_kuis('dc36d797-1fae-4770-8810-bde562947642')`<br><small>Kolom tersedia: id, modul_id, urutan, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d</small> |
| **TC-BR08-01: Modul 2 berstatus terkunci sebelum kuis Modul 1 dinyatakan lulus** | **Lulus** | `get_ruang_belajar('kursus-uji-1792923792362') [Modul 1 Belum Lulus]`<br><small>Modul 1: terbuka, Modul 2: terkunci</small> |
| **TC-BR08-02: Kuis wajib ditolak jika materi belum ditandai sudah dibaca** | **Lulus** | `submit_kuis('58c42762-1ce6-4c3f-884e-80b9192e2879', 'dc36d797-1fae-4770-8810-bde562947642', ...) [Materi Belum Dibaca]`<br><small>Query failed (400): {"message":"Failed to run sql query: ERROR:  P0001: Materi modul harus ditandai sudah dibaca terlebih dahulu sebelum mengerjakan kuis (BR-08)\nCONTEXT:  PL/pgSQL function submit_kuis(uuid,uuid,jsonb) line 54 at RAISE\n"}</small> |
| **TC-BR08-03: Materi kursus dapat diakses pada pendaftaran berstatus aktif maupun selesai** | **Lulus** | `get_ruang_belajar pada status aktif vs status selesai`<br><small>Materi terbaca: Aktif=1 modul, Selesai=1 modul</small> |
| **TC-BR08-04: Pengguna tanpa pendaftaran aktif/selesai ditolak saat mengakses ruang belajar** | **Lulus** | `get_ruang_belajar('kursus-uji-1792923792362') [Tanpa Pendaftaran]`<br><small>Query failed (400): {"message":"Failed to run sql query: ERROR:  P0001: Materi hanya dapat dibuka oleh peserta dengan pendaftaran aktif atau selesai (BR-08)\nCONTEXT:  PL/pgSQL function get_ruang_belajar(text) line 30 at RAISE\n"}</small> |
| **TC-BR08-05: Akses berkas PDF materi terkunci/tanpa pendaftaran dicegah (lampiran_path bernilai NULL di level database)** | **Lulus** | `SELECT status_akses, lampiran_path FROM get_ruang_belajar(...) WHERE urutan = 2`<br><small>Status Akses: terkunci, Lampiran Path: null (Aman dari pembacaan liar)</small> |
| **TC-BR11-01: Sertifikat HANYA terbit setelah seluruh modul (Modul 1 & 2) berstatus lulus** | **Lulus** | `submit_kuis modul 1 -> cek sertifikat (0), lalu modul 2 -> cek sertifikat (1)`<br><small>Sebelum modul 2: 0 cert. Sesudah modul 2: PA-2026-0027</small> |
| **TC-BR11-02: Nomor sertifikat memenuhi format baku PA-TAHUN-NOMOR (contoh: PA-2026-0026)** | **Lulus** | `Regex test /^PA-[0-9]{4}-[0-9]{4}$/ pada PA-2026-0027`<br><small>Nomor Sertifikat Diterbitkan: "PA-2026-0027" (Format Valid)</small> |
| **TC-BR11-03: Dua peserta lulus modul terakhir bersamaan: nomor sertifikat unik, berbeda, dan berurutan** | **Lulus** | `Promise.all([submit_kuis_E, submit_kuis_F])`<br><small>Peserta E: "PA-2026-0028", Peserta F: "PA-2026-0029" (Selisih urutan: 1)</small> |
| **TC-BR11-04: Audit sertifikat di database: hitung sertifikat yang formatnya bukan PA-TAHUN-NOMOR** | **Lulus** | `SELECT count(*) FROM public.sertifikat WHERE nomor_sertifikat !~ '^PA-[0-9]{4}-[0-9]{4}$'`<br><small>Jumlah sertifikat non-standar: 0 (100% dari total 25+ sertifikat telah memenuhi format baku)</small> |
| **TC-BR06-01: Dua peserta mendaftar bersamaan pada kursi terakhir: hanya 1 yang berhasil, kuota tidak bocor** | **Lulus** | `Promise.all([daftar_kursus(A), daftar_kursus(B)]) pada kuota=1`<br><small>Berhasil: 1, Ditolak: 1, Total Terdaftar di DB: 1</small> |
| **TC-BR12-01: Instruktur A tidak bisa membaca data pendaftaran di kursus milik Instruktur B (RLS mengembalikan 0 baris)** | **Lulus** | `SELECT * FROM public.pendaftaran WHERE id = '6e81e58d-f344-450b-83e8-8035621dac44' [Sebagai Instruktur A]`<br><small>Baris terlihat oleh Instruktur A: 0 baris (Terisolasi aman)</small> |
| **TC-BR12-02: Instruktur A tidak bisa membaca nilai (progres_modul) atau percobaan kuis di kursus Instruktur B** | **Lulus** | `SELECT progres & kuis WHERE pendaftaran_id = '6e81e58d-f344-450b-83e8-8035621dac44' [Sebagai Instruktur A]`<br><small>Progres terbaca: 0 baris, Percobaan kuis terbaca: 0 baris (RLS Proteksi Penuh)</small> |
| **TC-BR12-03: Peserta A tidak bisa membaca data pendaftaran milik Peserta B (RLS mengembalikan 0 baris)** | **Lulus** | `SELECT * FROM public.pendaftaran WHERE id = '6e81e58d-f344-450b-83e8-8035621dac44' [Sebagai Peserta A]`<br><small>Baris terlihat oleh Peserta A: 0 baris (Terisolasi aman)</small> |
| **TC-BR12-04: Peserta A tidak bisa membaca nilai (progres_modul) atau riwayat kuis milik Peserta B** | **Lulus** | `SELECT progres & kuis WHERE pendaftaran_id = '6e81e58d-f344-450b-83e8-8035621dac44' [Sebagai Peserta A]`<br><small>Progres terbaca: 0 baris, Percobaan kuis terbaca: 0 baris (Privasi Terjamin)</small> |

---

## 3. Tabel Regresi Lengkap: Keamanan Webhook Mayar

| Kasus | Hasil | Bukti |
| :--- | :--- | :--- |
| **UJI-1.1: Tanpa token rahasia** | **LULUS** | Perintah: ``POST /api/webhooks/mayar` (tanpa parameter token)`<br><small>HTTP 401, DB: menunggu_bayar</small> |
| **UJI-1.2: Token salah / tebakan** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA_PALSU>``<br><small>HTTP 401, DB: menunggu_bayar</small> |
| **UJI-2: ID mock inv_sb_ pada mode produksi** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_sb_150000_123`)`<br><small>HTTP 400, DB: menunggu_bayar</small> |
| **UJI-3: Invoice belum dibayar menurut GET Mayar** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_unpaid_123`)`<br><small>HTTP 400, DB: menunggu_bayar</small> |
| **UJI-4: Nominal berbeda (Rp 75.000 vs Rp 150.000)** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_diff_amount_123`)`<br><small>HTTP 400, DB: menunggu_bayar</small> |
| **UJI-5: Invoice tidak terdaftar di database** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_unregistered_id_999`)`<br><small>HTTP 404, DB: -</small> |
| **UJI-6: Webhook dikirim dua kali sekuensial (Idempotensi)** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_valid_paid_123`) 2x berturut-turut`<br><small>HTTP 200 -> 200, DB: aktif -> aktif (Audit Log: 1)</small> |
| **UJI-7: Peserta memanggil webhook sendiri dengan ID invoicenya** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA_TEBAKAN>` (`id: inv_student_own_123`)`<br><small>HTTP 401, DB: menunggu_bayar</small> |
| **UJI-8: Event payment.reminder untuk invoice valid** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (`event: payment.reminder`)`<br><small>HTTP 200, DB: menunggu_bayar (Diabaikan)</small> |
| **UJI-9: Dua webhook identik BERSAMAAN (Promise.all)** | **LULUS** | Perintah: ``Promise.all([postWebhook, postWebhook])` (`inv_concurrent_paid_123`)`<br><small>HTTP 200 & 200, DB: aktif (Audit Log: Tepat 1, Email: Tepat 1)</small> |
| **UJI-10: Pembayaran Sandbox Mayar Sungguhan End-to-End** | **LULUS** | Perintah: ``POST /api/webhooks/mayar?token=<RAHASIA>` (Real Mayar Closed Invoice)`<br><small>HTTP 200, DB: aktif (Audit Log: 1, Metode: mayar)</small> |

---

## 4. Kesimpulan Hasil Regresi
Seluruh 20 kasus uji aturan bisnis PRD dan seluruh 10 skenario uji keamanan webhook Mayar berhasil dieksekusi ulang secara lengkap tanpa ada satu pun kegagalan (0 gagal, kelulusan 100%). Integritas transaksi, konkurensi kuota, kerahasiaan kunci jawaban, batasan percobaan kuis, penomoran sertifikat, isolasi data antar-peran, dan autentikasi webhook tetap kokoh terjaga.
