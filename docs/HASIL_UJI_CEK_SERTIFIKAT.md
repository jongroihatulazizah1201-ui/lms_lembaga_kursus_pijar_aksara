# Laporan Hasil Pengujian: Kepatuhan PRD Bagian 14 (Out of Scope)

**Tanggal Pengujian:** 26 Oktober 2026
**Aplikasi:** LMS Lembaga Kursus Pijar Aksara (Next.js 16 + Supabase + Netlify)
**Ringkasan Status:** **5/5 UJI LULUS (Tingkat Kelulusan 100%)**

---

## 1. Tabel Hasil Pengujian

| **ID Uji** | **Skenario Pengujian** | **Target / Endpoint** | **Status** | **Perintah Uji & Bukti Output** |
|---|---|---|:---:|---|
| **UJI-OUT-OF-SCOPE-01** | Tamu membuka /sertifikat/cek dialihkan ke /login (Tidak ada akses publik) | `Status: 307, Location: /login?redirect=%2Fsertifikat%2Fcek` | **LULUS** | `HTTP GET http://localhost:3000/sertifikat/cek -> 307 Redirect to /login?redirect=%2Fsertifikat%2Fcek` |
| **UJI-OUT-OF-SCOPE-02** | Fungsi RPC publik verify_certificate_status telah dihapus dari schema public | `Jumlah rutin ditemukan: 0` | **LULUS** | `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'verify_certificate_status' -> Kosong` |
| **UJI-BR12-01** | Tamu tanpa autentikasi mengakses /sertifikat/[id] dialihkan ke /login | `Status: 307, Location: /login?redirect=%2Fsertifikat%2F00000000-0000-4000-8000-000000000001` | **LULUS** | `HTTP GET /sertifikat/00000000-0000-4000-8000-000000000001 -> 307 redirect` |
| **UJI-BR12-02** | Role anon TIDAK memiliki izin eksekusi pada get_sertifikat_detail | `has_function_privilege('anon', ...): false` | **LULUS** | `Role anon ditolak dari get_sertifikat_detail (Akses murni authenticated)` |
| **UJI-BR11-01** | Seluruh nomor sertifikat di database berformat baku PA-TAHUN-NOMOR | `Jumlah format tidak valid: 0` | **LULUS** | `Format regex: ^PA-[0-9]{4}-[0-9]{4}$ (100% valid)` |

---

## 2. Refactoring Kepatuhan PRD Bagian 14 (Out of Scope)

- **Sesuai PRD Bagian 14 (Di Luar Lingkup):** Fitur verifikasi sertifikat publik dikeluarkan dari sistem karena bertentangan dengan kebijakan akses privat sertifikat.
- **Proxy (`src/proxy.ts`):** Rute `/sertifikat` sepenuhnya diproteksi untuk pemilik akun yang terautentikasi.
- **Database Supabase:** Fungsi RPC publik `verify_certificate_status(text)` telah di-DROP.
- **Frontend & UI:** Seluruh komponen, form verifikasi, dan tombol navigasi publik menuju `/sertifikat/cek` telah dihapus dari Header Navbar, MobileBottomNav, Footer, dan Dashboard Siswa.
- **Akses Eksklusif Kursus Saya (BR-11 & BR-12):** Sertifikat hanya dapat diakses oleh peserta bersangkutan di halaman Kursus Saya setelah menyelesaikan seluruh modul kursus.

**Laporan ini diperbarui secara otomatis oleh skrip pengujian `supabase/tests/test_cek_sertifikat.cjs`.**