# Laporan Hasil Pengujian: Verifikasi Sertifikat Publik (/sertifikat/cek)

**Tanggal Pengujian:** 25 Oktober 2026
**Aplikasi:** LMS Lembaga Kursus Pijar Aksara (Next.js 16 + Supabase + Netlify)
**Ringkasan Status:** **10/10 UJI LULUS (Tingkat Kelulusan 100%)**

---

## 1. Tabel Hasil Pengujian

| **ID Uji** | **Skenario Pengujian** | **Target / Endpoint** | **Status** | **Perintah Uji & Bukti Output** |
|---|---|---|:---:|---|
| **UJI-CEK-01** | Tamu membuka /sertifikat/cek di localhost:3000 tanpa login -> 200 OK tanpa redirect | `Status: 200, Location: none` | **LULUS** | `HTTP GET http://localhost:3000/sertifikat/cek -> 200 OK (Tanpa pengalihan)` |
| **UJI-CEK-02** | Halaman /sertifikat/cek memiliki instruksi noindex untuk mesin pencari | `Meta tag robot noindex ditemukan dalam response` | **LULUS** | `robots: { index: false, follow: false } aktif di metadata` |
| **UJI-CEK-03** | Nomor sertifikat valid -> Data minimal (nomor, nama, kursus, tgl) & Tanpa PII | `Fields: valid, nomor_sertifikat, nama_peserta, judul_kursus, diterbitkan_pada` | **LULUS** | `{"valid":true,"nomor_sertifikat":"PA-2026-0027","nama_peserta":"Nadia Putri","judul_kursus":"Desain Konten Media Sosial dengan Canva","diterbitkan_pada":"2026-10-25T10:23:53.277182+00:00"}` |
| **UJI-CEK-04** | Nomor sertifikat tidak ditemukan -> RPC mengembalikan 0 baris (status 200) | `Hasil RPC: []` | **LULUS** | `Query nomor "PA-2026-9999" menghasilkan 0 baris, UI menampilkan "Sertifikat tidak ditemukan"` |
| **UJI-CEK-05** | Tamu membuka /sertifikat/[id] tanpa login -> HTTP 307 dialihkan ke /login | `Status: 307, Location: /login?redirect=%2Fsertifikat%2F9afb8a2b-5e5f-4454-bd3a-d8da63640d00` | **LULUS** | `GET /sertifikat/9afb8a2b-5e5f-4454-bd3a-d8da63640d00 dialihkan ke /login?redirect=%2Fsertifikat%2F9afb8a2b-5e5f-4454-bd3a-d8da63640d00` |
| **UJI-CEK-06** | Peserta lain mengakses detail sertifikat via get_sertifikat_detail -> Ditolak (BR-12) | `Pesan Error: Query failed (400): {"message":"Failed to run sql query: ERROR:  P0001: Akses ditolak: Anda tidak memiliki izin untuk melihat sertifikat ini (BR-12)\nCONTEXT:  PL/pgSQL function get_sertifikat_detail(text) line 48 at RAISE\n"}` | **LULUS** | `Akses ditolak: Anda tidak memiliki izin untuk melihat sertifikat ini (BR-12)` |
| **TC-BR11-01** | Audit database: seluruh nomor sertifikat memenuhi format baku PA-TAHUN-NOMOR | `Jumlah nomor tidak standar: 0` | **LULUS** | `SELECT count(*) WHERE nomor_sertifikat !~ '^PA-[0-9]{4}-[0-9]{4}$' -> 0 non-standar (100% valid)` |
| **TC-BR11-02** | Nomor sertifikat sampel ("PA-2026-0027") memenuhi format baku PA-YYYY-XXXX | `Regex check: PA-2026-0027` | **LULUS** | `Regex ^PA-[0-9]{4}-[0-9]{4}$ match: true` |
| **TC-BR11-03** | Integritas sertifikat: tidak ada sertifikat yang terbit pada pendaftaran batal/menunggu_bayar | `Jumlah anomali pendaftaran non-aktif: 0` | **LULUS** | `Integritas pendaftaran & sertifikat valid 100% (Semua berstatus aktif/selesai)` |
| **TC-BR11-04** | Hak akses RPC verify_certificate_status diberikan ke role anon secara aman | `has_function_privilege('anon', ...): true` | **LULUS** | `Role anon memiliki izin eksekusi resmi pada verify_certificate_status` |

---

## 2. Bukti Diagnosa Awal vs Setelah Perbaikan

### A. Diagnosa Awal (Masalah)
- **URL Netlify:** `GET https://lmslembagakursuspijaraksara.netlify.app/sertifikat/cek`
- **Status HTTP:** `307 Temporary Redirect` -> `Location: /kursus-saya`
- **Lanjutan:** `GET /kursus-saya` tanpa sesi cookie dialihkan ke `/login?redirect=%2Fkursus-saya`
- **Penyebab Utama:**
  1. File `src/app/sertifikat/cek/page.tsx` sebelumnya berisi fungsi stub `redirect('/kursus-saya')`.
  2. Di `src/proxy.ts`, rute `/sertifikat/*` belum membedakan antara `/sertifikat/cek` (akses publik) dan `/sertifikat/[id]` (akses privat pemilik sertifikat).
  3. Belum ada tautan "Cek Sertifikat" di Navbar (desktop & mobile) maupun Footer untuk pengunjung.

### B. Hasil Setelah Perbaikan
- **Proxy (`src/proxy.ts`):** Rute `/sertifikat/cek` dikecualikan secara eksplisit dari proteksi login (`isCertificateOwnerRoute = path.startsWith('/sertifikat/') && !path.startsWith('/sertifikat/cek')`). Rute `/sertifikat/[id]` tetap diproteksi dan mewajibkan autentikasi login.
- **Halaman Verifikasi (`src/app/sertifikat/cek/page.tsx` & `src/components/CertificateVerificationClient.tsx`):** Menampilkan form input kode sertifikat dengan auto-uppercase, validasi format `PA-TAHUN-NOMOR`, indikator loading, pesan ramah bila nomor tidak terdaftar, dan perlindungan privasi (hanya nomor, nama, kursus, tanggal; tanpa email, nomor HP, atau internal ID).
- **URL Parameter Otomatis:** Mendukung `?nomor=...` untuk langsung memverifikasi sertifikat saat QR code dipindai dari perangkat seluler.
- **Tampilan Sertifikat (`src/components/CertificateView.tsx`):** Ditambahkan badge QR code verifikasi resmi yang mengarah ke `/sertifikat/cek?nomor=...`.
- **Navigasi Publik:** Tautan "Cek Sertifikat" tersedia di Header Navbar, Footer ("Kepercayaan & Legalitas"), dan MobileBottomNav untuk tamu.
- **Robots:** Halaman `/sertifikat/cek` tetap dikonfigurasi `robots: { index: false, follow: false }` (`noindex`).

---

## 3. Verifikasi Regresi Aturan Bisnis BR-11 & BR-12
- Seluruh nomor sertifikat di database (100%) mematuhi format baku regex `^PA-[0-9]{4}-[0-9]{4}$`.
- Hak eksekusi RPC `verify_certificate_status` diberikan kepada role `anon` secara aman (SECURITY DEFINER dengan search_path eksplisit `public, pg_temp`).
- Sertifikat orang lain (`/sertifikat/[id]`) terlindungi secara bertingkat: Proxy edge melempar tamu ke `/login`, dan RPC `get_sertifikat_detail` menolak akses peserta lain sesuai aturan BR-12.

**Laporan ini dibuat secara otomatis oleh skrip pengujian `supabase/tests/test_cek_sertifikat.cjs`.**