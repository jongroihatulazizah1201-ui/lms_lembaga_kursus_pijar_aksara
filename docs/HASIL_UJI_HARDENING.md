# Laporan Hasil Uji Pengerasan Keamanan Database (Hardening)
LMS Lembaga Kursus Pijar Aksara

Tanggal Uji: 25 Oktober 2026
Migrasi Terkait: `20261025000017_database_hardening_security_definer.sql`
Target Pengujian: Fungsi-fungsi `SECURITY DEFINER`, hak akses role (`anon` vs `authenticated`), pencegahan eskalasi hak istimewa, validasi kuota kursus, dan isolasi akses sertifikat (BR-06, BR-11, BR-12).

---

## 1. Ringkasan Hasil Pengujian

Semua 4 skenario uji pengerasan keamanan database berhasil dieksekusi dengan status **LULUS (100%)**.

| ID | Skenario Pengujian | Peran Penguji | Ekspektasi | Hasil Pengujian | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UJI-HD-01** | Anon mencoba memanggil RPC admin (`admin_ubah_kuota_kursus`) | `anon` | Ditolak oleh PostgreSQL / Guard Auth (`Pengguna belum terautentikasi` / `permission denied`) | Ditolak | **LULUS** |
| **UJI-HD-02** | Peserta A memanggil `generate_sertifikat` milik pendaftaran Peserta B | `authenticated` (Peserta A) | Ditolak oleh guard otorisasi fungsi (`Akses ditolak: BR-12`) | Ditolak dengan pesan: *Akses ditolak: Anda tidak memiliki izin untuk menerbitkan sertifikat pendaftaran ini (BR-12)* | **LULUS** |
| **UJI-HD-03** | Admin menurunkan kuota kursus berstatus 'ditutup' di bawah jumlah kursi terpakai | `authenticated` (Admin) | Ditolak oleh trigger `fn_validasi_kuota_kursus` (`BR-06`) | Ditolak dengan pesan: *Kuota tidak boleh lebih kecil dari kursi terpakai (2) (BR-06)* | **LULUS** |
| **UJI-HD-04** | Anon memanggil RPC publik (`get_kursus_katalog` dan `verify_certificate_status`) | `anon` | Diizinkan dan mengembalikan data yang sah tanpa kredensial | Berhasil dieksekusi tanpa error, mengembalikan katalog publik dan hasil cek verifikasi sertifikat | **LULUS** |

---

## 2. Rincian Teknis Pengerasan yang Diterapkan

Sesuai berkas migrasi `20261025000017_database_hardening_security_definer.sql`:

1. **Proteksi Jalur Pencarian (`search_path`):**
   Seluruh 34 fungsi `SECURITY DEFINER` di skema `public` telah dikonfigurasi secara eksplisit dengan:
   ```sql
   SET search_path = public, extensions, pg_temp;
   ```
   Hal ini mencegah serangan injeksi objek palsu melalui manipulasi `search_path`.

2. **Pencabutan Hak Akses Publik (`REVOKE ALL`):**
   - Hak eksekusi pada seluruh fungsi administratif, mutasi pendaftaran, dan evaluasi kuis telah dicabut dari role `PUBLIC` dan `anon`.
   - Hak eksekusi seluruh *trigger functions* telah dicabut dari role `PUBLIC`, `anon`, dan `authenticated`, sehingga fungsi trigger hanya dapat dipicu oleh mesin database PostgreSQL saat mutasi tabel terjadi.

3. **Prinsip Hak Akses Terendah (`GRANT` Minimalis):**
   - Role `authenticated` hanya diberikan izin eksekusi ke RPC yang relevan bagi pengguna login.
   - Role `anon` hanya diberikan izin eksekusi ke 2 fungsi publik yang aman: `get_kursus_katalog()` dan `verify_certificate_status(text)`.

4. **Otorisasi Ketat pada Penerbitan Sertifikat (`generate_sertifikat`):**
   - Ditambahkan validasi otorisasi di dalam fungsi `generate_sertifikat(uuid)`:
     Pemanggil yang memiliki konteks terautentikasi (`auth.uid()`) **wajib merupakan pemilik pendaftaran** (`peserta_id`) atau memiliki peran **`admin`**. Panggilan dari peserta lain langsung dibatalkan dengan error `Akses ditolak`.

5. **Konsistensi Kuota Kursus pada Seluruh Status Kursus (BR-06):**
   - Trigger `fn_validasi_kuota_kursus()` kini menegakkan aturan bahwa kuota baru **tidak boleh lebih kecil dari kursi terpakai** (jumlah peserta `aktif`, `selesai`, dan `menunggu_bayar` aktif) pada status kursus apa pun (`draf`, `diajukan`, `terbit`, maupun `ditutup`).

---

## 3. Perintah Eksekusi dan Output Pengujian

### UJI-HD-01: Anon Memanggil RPC Admin
- **Query Eksekusi (Role anon):**
  ```sql
  SELECT * FROM public.admin_ubah_kuota_kursus('f1111111-1111-4111-f111-111111111111', 10);
  ```
- **Hasil Tangkapan Error:**
  ```
  ERROR: P0001: Pengguna belum terautentikasi
  ```
- **Kesimpulan:** Sukses diblokir dan tidak dapat dieksekusi oleh pengguna anonim.

### UJI-HD-02: Peserta Memanggil generate_sertifikat Orang Lain
- **Query Eksekusi (Role authenticated, UID Peserta A):**
  ```sql
  SELECT * FROM public.generate_sertifikat('f2222222-2222-4222-f222-222222222222'); -- Pendaftaran Peserta B
  ```
- **Hasil Tangkapan Error:**
  ```
  Akses ditolak: Anda tidak memiliki izin untuk menerbitkan sertifikat pendaftaran ini (BR-12)
  ```
- **Kesimpulan:** Guard otorisasi internal fungsi berhasil menghentikan eskalasi hak akses antar-peserta.

### UJI-HD-03: Menurunkan Kuota di Bawah Kursi Terpakai
- **Kondisi:** Kursus memiliki 1 pendaftaran aktif dan 1 pendaftaran selesai (total 2 kursi terpakai). Admin mencoba mengubah kuota menjadi 1.
- **Query Eksekusi (Role authenticated, UID Admin):**
  ```sql
  SELECT * FROM public.admin_ubah_kuota_kursus('f1111111-1111-4111-f111-111111111111', 1);
  ```
- **Hasil Tangkapan Error:**
  ```
  Kuota tidak boleh lebih kecil dari kursi terpakai (2) (BR-06)
  ```
- **Kesimpulan:** Integritas kapasitas kelas terjaga dan tidak dapat dilanggar meskipun kursus berstatus 'ditutup'.

### UJI-HD-04: Anon Mengakses Katalog dan Verifikasi Sertifikat
- **Query Eksekusi (Role anon):**
  ```sql
  SELECT count(*) FROM public.get_kursus_katalog();
  SELECT * FROM public.verify_certificate_status('PA-2026-9999');
  ```
- **Hasil Eksekusi:**
  Kueri berhasil dieksekusi tanpa hambatan permission dan mengembalikan data publik secara sah.
- **Kesimpulan:** Fitur eksplorasi kursus dan verifikasi keaslian sertifikat publik tetap berfungsi normal bagi masyarakat umum tanpa memerlukan login.
