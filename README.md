# LMS Lembaga Kursus & Pelatihan Pijar Aksara

Platform pembelajaran vokasi dan manajemen kursus daring resmi untuk **Lembaga Kursus & Pelatihan (LKP) Pijar Aksara**, Depok, Jawa Barat. Dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL, RLS, Storage), Mayar Gateway, dan Resend.

---

## 🚀 Fitur Utama & Arsitektur Peran

Aplikasi mengimplementasikan 3 peran pengguna dengan hak akses terisolasi melalui Row-Level Security (RLS) dan middleware proxy guard:

1. **Peserta (Siswa):**
   - **Katalog Kursus:** Menjelajahi katalog kursus vokasi yang berstatus `terbit` (BR-01), lengkap dengan unduhan brosur promosi resmi PDF.
   - **Dashboard Siswa:** Bilah tab navigasi panduan belajar di bagian paling atas, skala pengerjaan modul & kuis, 4 kartu capaian belajar, target tugas berikutnya, serta FAQ siswa.
   - **Kursus Saya:** Pengelolaan kursus aktif, penyelesaian pembayaran, dan penerbitan sertifikat resmi.
   - **Pembayaran Ganda:** Pembayaran instan otomatis QRIS (Mayar) via event `payment.received` dan transfer bank manual (BCA, Mandiri, BRI) dengan unggah bukti struk ke storage bucket privat `bukti_bayar` (BR-07).
   - **Ruang Belajar Sekuensial:** Modul disusun berurutan; modul berikutnya terkunci sampai kuis modul sebelumnya lulus (BR-08).
   - **Ruang Kuis Evaluasi:** Penilaian otomatis dieksekusi di database server via RPC `submit_kuis` (BR-09). Kunci jawaban tidak pernah dikirim ke browser. Maksimal 3 kali percobaan kuis per modul (BR-10).
   - **Sertifikat Digital & QR Code:** Terbit otomatis setelah 100% modul lulus (BR-11) dengan format baku `PA-TAHUN-NOMOR` (contoh: `PA-2026-0001`) dan dapat diverifikasi publik di `/sertifikat/cek?nomor=...`.

2. **Instruktur:**
   - **Manajemen Kursus:** Penyusunan silabus, materi teks, tautan video, penentuan KKM kursus (rentang 50–100, bawaan 70 sesuai BR-03), dan perancangan kuis evaluasi.
   - **Penguncian Konten (Content Lock):** Isi kursus dan butir soal kuis terkunci secara permanen di database setelah diajukan (`ditinjau`), `terbit`, atau `ditutup` (BR-04).
   - **Gradebook (Buku Nilai):** Pemantauan skor kuis evaluasi, jumlah percobaan, dan ketuntasan siswa dengan proteksi privasi.

3. **Administrator:**
   - **Dasbor Eksekutif:** Analitik pendapatan GMV, rasio penyelesaian kursus, dan tren pendaftaran siswa.
   - **Antrean Verifikasi Transfer:** Verifikasi bukti transfer bank dari storage bucket `bukti_bayar` dengan indikator antrean darurat.
   - **Review Kursus:** Penyetujuan kurikulum kursus (`draf` $\leftrightarrow$ `ditinjau` $\rightarrow$ `terbit` $\rightarrow$ `ditutup` per BR-02).
   - **Manajemen Pengguna:** Pengelolaan peran akun (siswa/instruktur/admin) dan penonaktifan akun (*suspend*).
   - **Audit Log Keamanan:** Pencatatan peristiwa penting secara *append-only* (tak dapat diubah/dihapus).

4. **Publik & Tamu:**
   - Halaman landing resmi institusi.
   - Portal verifikasi publik sertifikat di `/sertifikat/cek`.

---

## 📋 Aturan Bisnis Inti (Business Rules)

Sesuai spesifikasi `PRD+ERDlms.md`:
- **BR-01 (Katalog Publik):** Hanya kursus dengan status `terbit` yang tampil di katalog untuk umum.
- **BR-02 (Siklus Status Kursus):** Transisi status kursus sah adalah `draf`, `ditinjau`, `terbit`, `ditutup`.
- **BR-03 (Kelayakan Pengajuan Kursus):** Kursus wajib memiliki minimal 1 modul dan setiap modul memiliki minimal 1 soal kuis. KKM nilai lulus per kursus antara 50 sampai 100 (bawaan 70).
- **BR-04 (Kunci Konten Kursus):** Konten kursus terkunci setelah diajukan (`ditinjau`), `terbit`, atau `ditutup`.
- **BR-05 & BR-06 (Pencegahan Dobel Daftar & Kuota):** Peserta tidak dapat mendaftar dobel pada kursus yang sama. Kuota pendaftaran diproteksi dari *race condition* dengan penguncian baris (`FOR UPDATE`).
- **BR-07 (Batas Waktu Bayar 24 Jam):** Pendaftaran berstatus `menunggu_bayar` memiliki batas waktu 24 jam. Jika terlampaui, status berubah menjadi `kedaluwarsa`.
- **BR-08 (Alur Modul Sekuensial):** Peserta wajib membaca materi terlebih dahulu sebelum kuis terbuka. Modul ke-$N+1$ terkunci sampai modul ke-$N$ lulus.
- **BR-09 (Kerahasiaan Kunci Jawaban & Skoring Floor):** Kolom `kunci_jawaban` tidak dikirim ke klien. Nilai kuis dihitung dengan pembulatan ke bawah (*floor*).
- **BR-10 (Batas Percobaan Kuis):** Maksimal 3 kali percobaan kuis per modul. Modul yang sudah lulus tidak bisa dikerjakan ulang.
- **BR-11 (Sertifikat Kelulusan Otomatis):** Terbit otomatis setelah seluruh modul lulus dengan format nomor baku `PA-TAHUN-NOMOR` (contoh: `PA-2026-0001`).
- **BR-12 (Audit Log):** Setiap aksi administratif dan pembayaran dicatat di tabel `audit_logs` (*append-only*).

---

## 🛠️ Menjalankan Proyek

### Prasyarat
- Node.js versi 18+ atau 20+
- Akun Supabase (PostgreSQL & Storage)
- Akun Mayar (Payment Gateway)
- Akun Resend (Email Service)

### Instalasi Dependensi
```bash
npm install
```

### Konfigurasi Lingkungan (`.env.local`)
Pastikan variabel lingkungan berikut terisi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

MAYAR_API_KEY=<your-mayar-api-key>
MAYAR_WEBHOOK_SECRET=<your-mayar-webhook-secret>

RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

### Membangun untuk Produksi
```bash
npm run build
```

---

## 🧪 Pengujian & Verifikasi

Pengujian regresi otomatis dilakukan secara menyeluruh terhadap database Supabase:
- `node supabase/tests/run_tests.cjs` — Pengujian integrasi aturan bisnis BR-01 s.d. BR-12.
- `node supabase/tests/run_regression.cjs` — Uji regresi database dan RPC.
- `node supabase/tests/test_mayar_webhook.cjs` — Uji webhook Mayar dan validasi tanda tangan token.
- `node supabase/tests/test_cek_sertifikat.cjs` — Uji portal verifikasi sertifikat publik.

---

*Dikembangkan untuk Lembaga Kursus & Pelatihan Pijar Aksara — Hak Cipta © 2026.*
