# LAPORAN REKONSILIASI TEKS DAN DOKUMEN LMS PIJAR AKSARA
**Acuan Kebenaran:** `PRD+ERDlms.md`, `docs/HASIL_UJI.md`, `docs/HASIL_REGRESI.md`  
**Waktu Pelaksanaan:** 26 Oktober 2026  
**Status Rekonsiliasi:** SELESAI (100% Selaras dengan PRD & Kode Teruji)

---

## 1. Ringkasan Eksekutif Rekonsiliasi

Tugas ini melakukan **rekonsiliasi teks dan dokumen** secara menyeluruh terhadap antarmuka `/dashboard` (aturan main, FAQ, tab panduan), dokumen arsitektur `laporan_fitur_halaman_aturan_lms.md`, `README.md`, teks di ruang kuis (`QuizWorkspace.tsx`), sertifikat (`CertificateView.tsx`), serta pembayaran (`ManualPaymentClient.tsx`).

Prinsip mutlak yang dijalankan:
- **TIDAK mengubah logika sistem:** Migrasi, fungsi database (RPC), trigger, RLS, skema tabel, alur pembayaran Mayar/manual, dan penilaian kuis dipertahankan 100% tanpa modifikasi.
- **Acuan Kebenaran Tunggal:** Seluruh pernyataan diselaraskan secara ketat terhadap `PRD+ERDlms.md` dan bukti eksekusi riil pengujian database di `docs/HASIL_UJI.md` serta `docs/HASIL_REGRESI.md`.
- **Menghapus Klaim Fiktif / Halusinasi:** Klaim fiktif seperti "KKM tetap 80", "remedial tanpa batas", format sertifikat `CERT-YYYYMMDD-XXXXX`, bucket `bukti-transfer`, dan event Mayar `PAYMENT_COMPLETED` telah direkonsiliasi ke fakta teknis yang sebenarnya.

---

## 2. Tabel Rekonsiliasi Komparatif

| Pernyataan Awal (Klaim Sebelumnya) | Lokasi Dokumen / Kode | Perilaku Sebenarnya (Bukti Kode & DB) | Status Rekonsiliasi |
| :--- | :--- | :--- | :--- |
| **KKM Tetap 80 Poin (80%):** Disebutkan bahwa KKM kelulusan kuis adalah minimal 80 poin tetap (Grade A 90–100%, Grade B 80–89%, Remedial <80%). | • `/dashboard` (FAQ 1 & Bagian 1 Skala Penilaian)<br>• `laporan_fitur_halaman_aturan_lms.md` (Aturan 1) | **KKM ditentukan per kursus (50–100, bawaan 70):** Sesuai PRD BR-03, `kursus.nilai_lulus` bertipe `integer NOT NULL DEFAULT 70 CHECK (nilai_lulus >= 50 AND nilai_lulus <= 100)`. Di `QuizWorkspace.tsx`, batas lulus dinamis sesuai `nilaiLulus` masing-masing kursus. | **TEREKONSILIASI:** Teks diubah menjadi KKM per kursus (rentang 50–100, bawaan 70). |
| **Remedial Tanpa Batas Percobaan:** Disebutkan fasilitas remedial kuis bebas biaya tanpa batas percobaan kapan saja hingga lulus. | • `/dashboard` (FAQ 2 & Bagian 1 Ketentuan Kuis)<br>• `laporan_fitur_halaman_aturan_lms.md` (Aturan 1) | **Maksimal 3 kali percobaan kuis per modul (BR-10):** Sesuai PRD BR-10 dan migrasi `20261021000013_enforce_quiz_submission_concurrency.sql`, percobaan ke-4 ditolak (`Batas maksimal 3 kali percobaan kuis telah habis`). Modul yang sudah lulus tidak bisa diulang. Terbukti lulus di uji regresi TC-BR10-01 dan TC-BR10-03. | **TEREKONSILIASI:** Teks diubah menjadi batas maksimal 3 kali percobaan kuis per modul. |
| **Pembahasan Kunci Jawaban Ditampilkan ke Siswa:** Disebutkan bahwa sistem otomatis menghitung skor perolehan beserta kunci pembahasan dan analisis tiap butir soal setelah submit kuis. | • `/dashboard` (Bagian 1 Ketentuan Kuis)<br>• `laporan_fitur_halaman_aturan_lms.md` (Fitur Ruang Kuis) | **Kunci Jawaban Dirahasiakan Penuh di Server (BR-09):** RPC `get_soal_kuis` tidak mengirim kolom `kunci_jawaban` ke klien. RPC `submit_kuis` hanya mengembalikan skor nilai akhir, jumlah soal benar, sisa percobaan, dan status kelulusan. Tidak ada pengiriman kunci jawaban atau analisis butir soal ke browser. | **TEREKONSILIASI:** Klaim pembahasan dihapus. Dijelaskan bahwa kunci jawaban dirahasiakan di server demi integritas evaluasi. |
| **Format Sertifikat `CERT-YYYYMMDD-XXXXX` & Parameter `?no=`:** Disebutkan sertifikat berformat `CERT-20261021-00001` dengan tautan verifikasi `?no=CERT-...`. | • `/dashboard` (Mockup Sertifikat)<br>• `laporan_fitur_halaman_aturan_lms.md` (Aturan 3) | **Format Baku `PA-TAHUN-NOMOR` & Parameter `?nomor=` (BR-11):** Sesuai PRD BR-11, migrasi `20261021000006_enforce_certificate_integrity_and_access.sql`, dan `CertificateView.tsx`, seluruh 26 sertifikat berformat `PA-2026-XXXX`. Endpoint QR Code menggunakan `/sertifikat/cek?nomor=PA-...`. | **TEREKONSILIASI:** Mockup diubah menjadi `PA-2026-0001` dan parameter QR diselaraskan ke `?nomor=`. |
| **Status Kursus Draft, Review, Dipublikasikan, Ditolak:** Menggunakan istilah bahasa Inggris campur tidak baku. | • `laporan_fitur_halaman_aturan_lms.md` (Tabel Sitemap & Aturan 5) | **Status Baku Database: `draf`, `ditinjau`, `terbit`, `ditutup` (BR-02):** Sesuai Tabel 6.1 PRD dan migrasi `20261021000002_enforce_course_status_transitions.sql`, enum status kursus yang sah di database adalah `draf`, `ditinjau`, `terbit`, `ditutup`. | **TEREKONSILIASI:** Dokumen diselaraskan ke 4 status baku PRD: `draf`, `ditinjau`, `terbit`, `ditutup`. |
| **Status Invoice Lewat 24 Jam Otomatis `dibatalkan`:** Disebutkan invoice kadaluwarsa langsung menjadi status `dibatalkan`. | • `laporan_fitur_halaman_aturan_lms.md` (Aturan 4) | **Status Pendaftaran: `menunggu_bayar`, `aktif`, `selesai`, `kedaluwarsa`, `dibatalkan` (BR-07):** Sesuai PRD Tabel 6.2 dan migrasi `20261025000018_cron_pendaftaran_kedaluwarsa.sql`, invoice yang melampaui batas 24 jam berubah menjadi `kedaluwarsa`. Status `dibatalkan` hanya digunakan untuk pembatalan mandiri peserta atau penolakan transfer oleh admin. | **TEREKONSILIASI:** Rincian status diperjelas antara `kedaluwarsa` (otomatis 24 jam) dan `dibatalkan` (manual). |
| **Bucket Storage Bernama `bukti-transfer`:** Disebutkan berkas bukti pembayaran diunggah ke bucket `bukti-transfer`. | • `laporan_fitur_halaman_aturan_lms.md` (Migrasi 20 & Fitur Bayar) | **Nama Bucket Resmi: `bukti_bayar`:** Sesuai migrasi `20261025000019_manual_transfer_proof_and_storage.sql`, `ManualPaymentClient.tsx`, dan `src/app/kursus-saya/actions.ts` (baris 86), bucket privat yang dibuat dan digunakan adalah `bukti_bayar` via RPC `peserta_unggah_bukti_bayar`. | **TEREKONSILIASI:** Seluruh referensi bucket diselaraskan ke `bukti_bayar`. |
| **Event Webhook Mayar Bernama `PAYMENT_COMPLETED`:** Disebutkan webhook Mayar memproses status `PAYMENT_COMPLETED`. | • `laporan_fitur_halaman_aturan_lms.md` (Integrasi Mayar) | **Nama Event Webhook: `payment.received`:** Sesuai `src/app/api/webhooks/mayar/route.ts` baris 65 dan suite uji `test_mayar_webhook.cjs`, hanya event `payment.received` yang diproses oleh handler untuk mengaktifkan kursus. Event lain dibalas HTTP 200 diabaikan. | **TEREKONSILIASI:** Diselaraskan ke nama event resmi `payment.received`. |

---

## 3. Temuan Khusus (Kerahasiaan Kunci Jawaban & Integritas Kode vs PRD)

Sesuai instruksi khusus nomor 1 dan 3:
> *"PEMBAHASAN KUNCI JAWABAN: apakah submit_kuis atau halaman hasil mengirim kunci_jawaban, atau benar/salah per soal, ke browser? Jika ya, LAPORKAN saja dan jangan diubah."*

### Hasil Audit Kode Ruang Kuis:
1. **Pengambilan Soal (`get_soal_kuis` & `src/app/belajar/[slug]/kuis/page.tsx`):**
   - Prosedur tersimpan `get_soal_kuis` didefinisikan dengan query:
     ```sql
     SELECT s.id, s.modul_id, s.urutan, s.pertanyaan, s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d
     FROM public.soal_kuis s ...
     ```
   - Kolom `kunci_jawaban` **TIDAK PERNAH** disertakan dalam output SELECT. Peserta yang memantau tab Network browser tidak dapat melihat kunci jawaban soal.
   - Uji teknis **TC-BR09-02** dan **TC-BR09-03** membuktikan secara riil bahwa query RLS peserta mengembalikan 0 baris kunci jawaban, dan RPC `get_soal_kuis` bersih dari kolom kunci.

2. **Pengiriman Jawaban Kuis (`submit_kuis` & `QuizWorkspace.tsx`):**
   - Prosedur `submit_kuis` menerima payload jawaban `{ [soal_id]: 'A'|'B'|'C'|'D' }` dan melakukan evaluasi internal di database.
   - Objek JSON yang dikembalikan oleh `submit_kuis` ke browser adalah:
     ```json
     {
       "nomor_percobaan": 1,
       "jumlah_soal": 3,
       "jumlah_benar": 2,
       "nilai": 66,
       "nilai_lulus": 70,
       "lulus": false,
       "sisa_percobaan": 2,
       "semua_modul_selesai": false,
       "nomor_sertifikat": null
     }
     ```
   - **TIDAK ADA** pengembalian data `kunci_jawaban`.
   - **TIDAK ADA** pengembalian array benar/salah per butir soal (misal: soal 1 benar, soal 2 salah).
   - Di antarmuka `QuizWorkspace.tsx` (baris 475–523), modal hasil kuis hanya menampilkan skor agregat: nilai akhir, rasio jawaban benar (`jumlah_benar/jumlah_soal`), sisa percobaan, dan tombol lanjut/ulang.
   - **Kesimpulan Temuan:** Kode implementasi **SUDAH MEMATUHI PRD BR-09 DENGAN SEMPURNA**. Tidak ditemukan pelanggaran kebocoran kunci jawaban pada kode aplikasi. Klaim "pembahasan kunci jawaban" sebelumnya murni merupakan kekeliruan narasi dokumen yang kini telah dibersihkan.

---

## 4. Hasil Lint, Build, dan Pengujian Regresi Ulang

### A. Verifikasi TypeScript (`npx tsc --noEmit`)
- **Status:** LULUS (Exit Code 0)
- **Galat:** 0 error, 0 warning.

### B. Verifikasi Build Produksi Next.js (`npm run build`)
- **Status:** LULUS (Exit Code 0)
- **Kompilasi Turbopack:** Berhasil mengompilasi 31 rute aplikasi (Landing, Katalog, Detail Kursus, Login, Register, Dashboard, Kursus Saya, Bayar, Belajar, Kuis, Sertifikat, Cek Sertifikat, Profil, Ruang Instruktur, Ruang Admin, Webhook Mayar, dan Cron Reminder) tanpa galat sintaks maupun tipe data.

### C. Uji Regresi Aturan Bisnis PRD (`node supabase/tests/run_tests.cjs`)
Seluruh 20 kasus uji aturan bisnis PRD dijalankan langsung terhadap basis data Supabase dan **100% LULUS**:
1. `[PASS]` **TC-BR01-01:** Tamu publik hanya dapat melihat kursus berstatus `terbit`.
2. `[PASS]` **TC-BR02-01:** Transisi status kursus ilegal ditolak oleh trigger database.
3. `[PASS]` **TC-BR03-01:** Kursus tanpa modul atau kuis ditolak saat diajukan untuk ditinjau.
4. `[PASS]` **TC-BR04-01:** Isi kursus yang sudah diajukan (`ditinjau`) terkunci dari perubahan.
5. `[PASS]` **TC-BR05-01:** Peserta tidak dapat mendaftar dobel pada kursus yang sama.
6. `[PASS]` **TC-BR06-01:** Dua pendaftar bersamaan pada 1 kursi sisa: hanya 1 yang berhasil, kuota tidak bocor.
7. `[PASS]` **TC-BR07-01:** Kursus gratis langsung `aktif`, kursus berbayar `menunggu_bayar` 24 jam.
8. `[PASS]` **TC-BR07-02:** Pendaftaran otomatis kedaluwarsa setelah 24 jam dan membebaskan kuota kursi.
9. `[PASS]` **TC-BR08-01:** Modul ke-2 terkunci sampai kuis Modul 1 dinyatakan lulus.
10. `[PASS]` **TC-BR08-02:** Kuis ditolak jika materi belum ditandai sudah dibaca.
11. `[PASS]` **TC-BR09-01:** Nilai kuis dibulatkan ke bawah (*floor*): 2 dari 3 soal benar bernilai tepat 66.
12. `[PASS]` **TC-BR09-02 & TC-BR09-03:** Kunci jawaban tidak dapat diakses langsung oleh peserta (RLS & RPC).
13. `[PASS]` **TC-BR10-01:** Kirim kuis ke-4 pada modul yang sama ditolak oleh sistem.
14. `[PASS]` **TC-BR10-02:** Dua kiriman kuis bersamaan pada sisa 1 kesempatan: hanya 1 yang berhasil.
15. `[PASS]` **TC-BR10-03:** Modul yang sudah lulus tidak bisa dikerjakan ulang.
16. `[PASS]` **TC-BR11-01:** Sertifikat HANYA terbit setelah seluruh modul (Modul 1 & 2) berstatus lulus.
17. `[PASS]` **TC-BR11-02:** Nomor sertifikat memenuhi format baku `PA-TAHUN-NOMOR` (contoh: `PA-2026-0026`).
18. `[PASS]` **TC-BR11-03:** Dua peserta lulus modul terakhir bersamaan menerima nomor sertifikat unik dan berurutan.
19. `[PASS]` **TC-BR12-01 & TC-BR12-02:** Verifikasi transfer dan pengajuan kursus mencatat jejak audit log otomatis.
20. `[PASS]` **TC-BR12-03:** Catatan audit log tidak dapat diubah atau dihapus (*append-only*).

### D. Uji Keamanan Webhook Mayar (`node supabase/tests/test_mayar_webhook.cjs`)
- **Status:** 10 Kasus Uji 100% LULUS (Validasi token rahasia HTTP 401, idempotensi HTTP 200, penolakan event selain `payment.received`, dan pencegahan race condition).

### E. Uji Verifikasi Sertifikat Publik (`node supabase/tests/test_cek_sertifikat.cjs`)
- **Status:** 6 Kasus Uji 100% LULUS (Verifikasi via RPC `verify_certificate_status`, validasi regex format `^PA-\d{4}-\d{4}$`, dan konfirmasi 26 sertifikat di database konsisten memenuhi format baku).

---

## 5. Ringkasan Berkas yang Diperbarui

1. `src/components/StudentDashboardClient.tsx`:
   - Menghapus referensi KKM 80, menggantikannya dengan KKM kursus (rentang 50–100, bawaan 70 per BR-03).
   - Menghapus klaim remedial tanpa batas, menggantikannya dengan batas maksimal 3 kali percobaan (BR-10).
   - Menghapus narasi bocoran pembahasan kunci jawaban, menggantikannya dengan penegasan bahwa penilaian aman di server dan kunci jawaban dirahasiakan (BR-09).
   - Memperbaiki nomor sertifikat mockup menjadi `PA-2026-0001` (BR-11).
2. `laporan_fitur_halaman_aturan_lms.md` (di root dan direktori artifacts):
   - Direvisi penuh agar 100% mencerminkan aturan bisnis PRD dan kode yang teruji.
3. `README.md` (di root proyek):
   - Dibuat baru dengan dokumentasi fitur peran, aturan bisnis BR-01 s.d. BR-12, panduan konfigurasi lingkungan, perintah instalasi, dan petunjuk eksekusi uji regresi.
4. `docs/REKONSILIASI.md`:
   - Dokumen ini, memuat tabel perbandingan, analisis temuan kerahasiaan kunci jawaban, dan catatan bukti uji regresi.
