# Rencana Kerja & Test Plan LMS Lembaga Kursus Pijar Aksara

Dokumen ini memuat **Rencana Kerja Per Halaman**, **Matriks Akses Peran**, **Test Plan Bisnis Formal (18 Test Cases)**, **Hasil Verifikasi Kasus Batas (Edge Cases)**, dan **Daftar Akun Uji** berdasarkan PRD (`PRD+ERDlms.md`) dan ERD (`ERD_LMS.pdf`).

---

## 1. Rencana Kerja Per Halaman

### Tahap 0: Fondasi Database & Autentikasi (Supabase)
1. **Skema Database & Enum:**
   - Tabel: `profiles`, `kursus`, `modul`, `soal`, `pendaftaran`, `progres_modul`, `percobaan_kuis`, `sertifikat`, `audit_log`.
   - Enum: `peran_enum` (peserta, instruktur, admin), `status_kursus_enum` (draf, ditinjau, terbit, ditutup), `status_pendaftaran_enum` (menunggu_bayar, aktif, selesai, kedaluwarsa, dibatalkan), `metode_bayar_enum` (gratis, transfer_manual, mayar).
2. **PostgreSQL Triggers & Stored Procedures (RPC):**
   - Trigger otomatis membuat baris `profiles` saat user mendaftar di `auth.users`.
   - RPC transaksi pendaftaran kursus dengan *pessimistic locking* (`FOR UPDATE`) untuk mencegah *race condition* kursi terakhir (BR-06).
   - RPC evaluasi kuis di server untuk menjaga kerahasiaan `kunci_jawaban` (BR-09).
   - Generator nomor urut sertifikat berurutan `PA-TAHUN-NOMOR` tanpa lompatan (BR-11).
   - Trigger pencatatan aktivitas sensitif ke `audit_log` (BR-12).
3. **Storage & Kebijakan Akses (RLS):**
   - Supabase Storage privat `materi_pdf` untuk file PDF modul (maks 10 MB per file, diakses lewat *Signed URL* berlaku maks 60 menit).
   - Supabase Storage publik `kursus_brosur` untuk foto pamflet/brosur kursus rasio 16:9 (maks 1 MB per file).
   - Supabase Storage publik `avatars` untuk foto profil peserta, instruktur, dan admin (maks 1 MB per file).
   - Row Level Security (RLS) ketat pada seluruh tabel.

---

### Tahap 1: Halaman Publik (SEO-Friendly)
1. **Katalog Kursus (`/` atau `/kursus`)**
   - Menampilkan hanya kursus berstatus `terbit` (BR-01).
   - Fitur pencarian, filter kategori, badge Gratis/Harga, info sisa kursi, nama instruktur.
   - Optimasi SEO & performa: LCP <= 2.5 detik, meta tags, sitemap dinamis (`/sitemap.xml`).
2. **Detail Kursus (`/kursus/[slug]`)**
   - URL berbasis slug (contoh: `/kursus/excel-administrasi-perkantoran`).
   - Deskripsi lengkap, profil instruktur, silabus (judul modul & durasi saja, isi materi terkunci).
   - Tombol "Daftar Kursus" dengan validasi status login dan kuota kursi.
3. **Autentikasi (`/login` & `/register`)**
   - Pendaftaran akun dengan nama lengkap (3–100 karakter), email unik, nomor HP (format 08xx), kata sandi.
   - Pendaftar baru selalu mendapatkan peran `peserta`.

---

### Tahap 2: Halaman Peserta (noindex)
4. **Kursus Saya (`/kursus-saya`)**
   - Daftar kursus yang sedang atau pernah didaftarkan.
   - Hitung mundur batas bayar 24 jam untuk kursus berbayar `menunggu_bayar` (BR-07).
   - Tombol pembatalan pendaftaran (hanya jika belum dibayar).
   - Progress bar kelulusan (%) dan tombol "Lanjut Belajar".
   - Tombol unduh/lihat sertifikat untuk pendaftaran berstatus `selesai`.
5. **Ruang Belajar (`/belajar/[slug]?modul=[urutan]`)**
   - Sidebar navigasi modul: Modul 1 langsung terbuka, Modul N+1 terkunci sampai kuis Modul N lulus (BR-08).
   - Konten: bacaan materi teks, video embed (`https://`), unduh file PDF via *Signed URL* sementara (maks. 60 menit).
   - Tombol "Tandai materi sudah dibaca" untuk membuka akses pengerjaan kuis.
   - Form pengerjaan kuis pilihan ganda A–D (wajib dijawab semua).
   - Evaluasi nilai kuis otomatis di server, menampilkan skor, jumlah benar, dan sisa kesempatan (maks. 3x percobaan, BR-10).
   - Otomatis mengubah pendaftaran menjadi `selesai` dan menerbitkan sertifikat saat semua modul lulus (BR-11).
6. **Cetak Sertifikat (`/sertifikat/[id]`)**
   - Tampilan sertifikat resmi Lembaga Kursus Pijar Aksara dengan nomor unik berurutan `PA-TAHUN-NOMOR` dan nama peserta sesuai profil.

---

### Tahap 3: Halaman Instruktur (noindex)
7. **Kelola Kursus (`/instruktur/kursus`)**
   - Daftar kursus milik instruktur login beserta status (`draf`, `ditinjau`, `terbit`, `ditutup`).
   - Form pembuatan & pengeditan kursus (judul, kategori, ringkasan, deskripsi, harga, kuota, nilai lulus).
   - Builder modul & penyusunan soal kuis (pilihan A–D, kunci jawaban).
   - CRUD modul & soal hanya aktif saat kursus `draf` (BR-04).
   - Tombol "Ajukan Kursus" dengan validasi: 2–10 modul berurutan dan 3–20 soal per modul (BR-03).
   - Penampil catatan revisi jika kursus dikembalikan oleh admin.
8. **Peserta dan Nilai (`/instruktur/kursus/[kursus_id]/peserta`)**
   - Tabel peserta di kursus milik instruktur (nama, email, status, progres, nilai terbaik, jumlah percobaan kuis).
   - Instruktur tidak bisa melihat peserta atau kursus instruktur lain (BR-12).

---

### Tahap 4: Halaman Admin (noindex)
9. **Panel Admin (`/admin`)**
   - **Tab Tinjauan Kursus:** Review kursus status `ditinjau`, tombol Terbitkan, tombol Kembalikan ke draf (wajib catatan min. 10 karakter, BR-02), tombol Tutup & Buka kembali kursus, ubah kuota dan harga (kuota tidak boleh di bawah kursi terpakai, BR-06).
   - **Tab Pendaftaran & Pembayaran:** Konfirmasi pembayaran transfer manual (status `menunggu_bayar` ke `aktif`), pembatalan pendaftaran aktif (wajib alasan min. 10 karakter, BR-07).
   - **Tab Pengguna:** Kelola peran akun (peserta, instruktur, admin), aktivasi/nonaktivasi akun. Proteksi: admin dilarang menurunkan perannya sendiri atau menonaktifkan akunnya sendiri (BR-12).
   - **Tab Audit Log:** Tabel pencatatan riwayat aksi sensitif.
10. **Dashboard Admin (`/admin/dashboard`)**
    - Filter tanggal (default 8 minggu terakhir).
    - 4 Kartu Ringkasan: Pendaftaran bulan ini, Pendapatan bulan ini, Peserta aktif, Sertifikat terbit.
    - Grafik batang pendaftaran mingguan (gratis vs berbayar).
    - Grafik garis pendapatan mingguan.
    - Grafik batang persentase kelulusan kursus (selesai / (aktif + selesai)).
    - Tabel modul dengan kelulusan percobaan pertama terendah.
    - Tabel kursus hampir penuh (sisa kursi <= 2).

---

## 2. Matriks Akses Peran

| Halaman & Fitur | Pengunjung (Guest) | Peserta | Instruktur | Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Katalog Kursus (Terbit)** | Diizinkan | Diizinkan | Diizinkan | Diizinkan |
| **Detail Kursus (Terbit)** | Diizinkan | Diizinkan | Diizinkan | Diizinkan |
| **Daftar Akun Baru & Login** | Diizinkan | Diizinkan | Diizinkan | Diizinkan |
| **Pendaftaran Kursus** | Ditolak (Redirect) | Diizinkan | Ditolak | Ditolak |
| **Kursus Saya** | Ditolak | Diizinkan | Ditolak | Ditolak |
| **Ruang Belajar (Materi & Video)** | Ditolak | Diizinkan (Terdaftar) | Ditolak | Ditolak |
| **Pengerjaan Kuis Modul** | Ditolak | Diizinkan (Maks 3x) | Ditolak | Ditolak |
| **Unduh PDF Modul (Signed URL)** | Ditolak | Diizinkan (Terdaftar) | Terkunci (Milik Sendiri) | Diizinkan |
| **Lihat & Cetak Sertifikat** | Ditolak | Diizinkan (Lulus) | Ditolak | Diizinkan |
| **Kelola Kursus & Modul (Draf)** | Ditolak | Ditolak | Diizinkan (Milik Sendiri) | Terkunci |
| **Ajukan Kursus ke Admin** | Ditolak | Ditolak | Diizinkan (Milik Sendiri) | Ditolak |
| **Lihat Nilai Peserta Kursus** | Ditolak | Terkunci (Nilai Sendiri) | Diizinkan (Kursus Sendiri) | Diizinkan (Semua) |
| **Tinjau Kursus (Terbit/Kembalikan/Tutup)** | Ditolak | Ditolak | Ditolak | Diizinkan |
| **Ubah Kuota & Harga Kursus** | Ditolak | Ditolak | Ditolak | Diizinkan |
| **Konfirmasi Pembayaran Manual** | Ditolak | Ditolak | Ditolak | Diizinkan |
| **Batalkan Pendaftaran Aktif** | Ditolak | Ditolak | Ditolak | Diizinkan (Alasan >= 10) |
| **Kelola Peran & Akun Pengguna** | Ditolak | Ditolak | Ditolak | Diizinkan (Kecuali Diri) |
| **Dashboard Keuangan & Laporan** | Ditolak | Ditolak | Ditolak | Diizinkan |
| **Lihat Audit Log** | Ditolak | Ditolak | Ditolak | Diizinkan |

---

## 3. Test Plan Bisnis Formal (18 Test Cases)

| Kode Test Case | Rujukan Aturan | Jenis Uji | Akun Uji yang Digunakan | Langkah Pengujian secara Rinci | Hasil yang Diharapkan | Hasil Aktual & Status (Lulus / Gagal) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | BR-01 / US-01 | Happy Path | Pengunjung (Guest / Anonim) | 1. Buka peramban ke halaman utama atau katalog publik (`/kursus`).<br>2. Periksa daftar kartu kursus yang ditampilkan.<br>3. Verifikasi apakah terdapat kursus berstatus selain `terbit`. | Hanya menampilkan kursus dengan status `terbit` (Excel Administrasi Perkantoran, Dasar Pembukuan untuk UMKM, Desain Canva, Bahasa Inggris). Kursus draf, ditinjau, atau ditutup tidak muncul di katalog. | Terverifikasi: Query katalog publik memfilter kursus dengan `eq('status', 'terbit')`. Kursus draf, ditinjau, dan ditutup otomatis tersaring.<br><br>**Status: Lulus** |
| **TC-02** | BR-01 / US-01 | Negative Test / Edge Case | Pengunjung (Guest / Anonim) | 1. Buka peramban dan masukkan langsung URL slug kursus draf: `/kursus/word-surat-dinas`.<br>2. Coba juga akses kursus ditinjau: `/kursus/public-speaking-presentasi-kantor` dan kursus ditutup: `/kursus/fotografi-produk-ponsel`. | Sistem merespons dengan tampilan 404 Not Found (atau dialihkan). Informasi silabus, harga, materi, atau nama instruktur tidak bocor ke publik. | Terverifikasi: Halaman detail publik `/kursus/[slug]` memeriksa status kursus; jika status bukan `terbit`, memanggil `notFound()` Next.js.<br><br>**Status: Lulus** |
| **TC-03** | BR-02 / US-06 | Happy Path | Yudha Pratama (Instruktur) | 1. Login sebagai Yudha Pratama (`yudha@pijaraksara.test`).<br>2. Buka halaman kelola kursus (`/instruktur/kursus`).<br>3. Buka kursus draf milik sendiri yang memiliki modul dan soal lengkap.<br>4. Klik tombol "Ajukan Kursus". | Status kursus berhasil berpindah dari `draf` ke `ditinjau`. Notifikasi sukses tampil. Modul dan soal kursus otomatis terkunci dari pengeditan. | Terverifikasi: Status kursus berhasil diajukan ke `ditinjau` oleh instruktur pemilik setelah syarat BR-03 terpenuhi.<br><br>**Status: Lulus** |
| **TC-04** | BR-02 / US-08 | Negative Test | Ratna Kusumawati (Admin) | 1. Login sebagai Ratna Kusumawati (`ratna@pijaraksara.test`).<br>2. Buka panel admin `/admin` tab Tinjauan Kursus.<br>3. Pilih kursus berstatus `ditinjau`.<br>4. Klik tombol "Kembalikan ke Draf".<br>5. Masukkan catatan revisi: `"Perbaiki"` (8 karakter).<br>6. Klik konfirmasi kembalikan. | Aksi ditolak dengan pesan error validasi: "Catatan pengembalian wajib minimal 10 karakter". Status kursus tidak berubah dan tetap `ditinjau`. | Terverifikasi: Validasi backend dan RPC `admin_kembalikan_kursus` menolak catatan kurang dari 10 karakter dengan pengecekan `length(trim(catatan)) >= 10`.<br><br>**Status: Lulus** |
| **TC-05** | BR-02 / US-08 | Negative Test (Status Melanggar Alur) | Ratna Kusumawati (Admin) | 1. Login sebagai Admin Ratna Kusumawati.<br>2. Coba terbitkan kursus draf secara langsung tanpa melewati status `ditinjau`.<br>3. Coba ubah status kursus yang sudah `terbit` kembali menjadi `draf`. | Sistem dan database trigger menolak perubahan status tidak sah tersebut dengan pesan error: "Perpindahan status tidak sah. Kursus terbit tidak bisa kembali ke draf, dan kursus draf wajib ditinjau terlebih dahulu". | Terverifikasi: Database trigger `trg_enforce_course_status_transition` memblokir mutasi dari `terbit` ke `draf` dan dari `draf` langsung ke `terbit`.<br><br>**Status: Lulus** |
| **TC-06** | BR-03 / US-06 | Negative Test (Angka Melewati Batas) | Yudha Pratama (Instruktur) | 1. Login sebagai Yudha Pratama.<br>2. Buat kursus baru dengan salah satu nilai batas melanggar ketentuan:<br> - Kuota: 0 atau 120 (rentang sah: 1..100)<br> - Harga: Rp20.000 atau Rp6.000.000 (rentang sah: Rp0 atau Rp50.000..Rp5.000.000)<br> - Nilai Lulus: 40 atau 105 (rentang sah: 50..100)<br>3. Coba ajukan kursus yang hanya memiliki 1 modul atau modul dengan soal kuis kurang dari 3. | Formulir memblokir input dan menampilkan pesan validasi spesifik sesuai batas BR-03. Pengajuan kursus ditolak jika modul < 2 atau soal kuis per modul < 3. | Terverifikasi: Database CHECK constraints (`check_kuota`, `check_harga`, `check_nilai_lulus`) dan validasi server memblokir angka di luar batas sah.<br><br>**Status: Lulus** |
| **TC-07** | BR-04 / US-06 | Negative Test (Konten Terkunci) | Yudha Pratama (Instruktur) | 1. Login sebagai Yudha Pratama.<br>2. Buka kursus milik sendiri yang berstatus `terbit` (Dasar Pembukuan untuk UMKM) atau `ditinjau`.<br>3. Coba klik tombol tambah modul, edit materi, atau hapus butir soal kuis. | Tombol formulir penambahan dan pengeditan dinonaktifkan (disabled). Jika dipanggil via Server Action / API, sistem merespons error 403: "Isi kursus terkunci karena kursus tidak berstatus draf". | Terverifikasi: RLS dan trigger `trg_lock_course_content` menolak operasi INSERT/UPDATE/DELETE pada tabel `modul` dan `soal` saat status kursus bukan `draf`.<br><br>**Status: Lulus** |
| **TC-08** | BR-05 / US-02 | Negative Test (Pendaftaran Ganda) | Galih Pamungkas (Peserta) | 1. Login sebagai Galih Pamungkas (`galih.pamungkas@pijaraksara.test`) yang telah memiliki pendaftaran `menunggu_bayar` pada kursus Excel.<br>2. Akses halaman detail `/kursus/excel-administrasi-perkantoran`.<br>3. Coba lakukan pendaftaran ulang ke kursus tersebut. | Tombol pendaftaran menampilkan informasi status pendaftaran saat ini ("Menunggu Pembayaran") dan dinonaktifkan, atau jika dikirimkan ditolak dengan error: "Anda sudah memiliki pendaftaran yang masih berlaku pada kursus ini". | Terverifikasi: RPC `daftar_kursus_v2` dan partial unique index database memeriksa pendaftaran aktif/menunggu_bayar/selesai dan menolak duplikasi pendaftaran.<br><br>**Status: Lulus** |
| **TC-09** | BR-06 / US-02 | Edge Case (Sisa 1 Kursi & Kuota Habis) | Bagus Santoso (Peserta 1) & Siti Aminah (Peserta 2) | 1. Buka kursus "Dasar Pembukuan untuk UMKM" (kuota: 12, kursi terpakai: 11, sisa kursi: 1).<br>2. Bagus Santoso mendaftar ke kursus tersebut untuk mengambil 1 kursi terakhir.<br>3. Siti Aminah mencoba mendaftar setelah kursi ke-12 terisi (atau pendaftaran dikirimkan serentak). | Bagus Santoso berhasil mendaftar (kursi terpakai menjadi 12). Pendaftaran Siti Aminah ditolak dengan notifikasi: "Pendaftaran gagal: Kuota kursus telah penuh". Sisa kursi bernilai 0 (tidak menjadi negatif). | Terverifikasi: Pessimistic locking `SELECT ... FOR UPDATE` pada tabel `kursus` mengunci baris saat pendaftaran, memastikan tepat 1 pendaftar berhasil dan pendaftar berikutnya ditolak saat kuota penuh.<br><br>**Status: Lulus** |
| **TC-10** | BR-06 / US-09 | Negative Test (Angka Melewati Batas / Kuota) | Ratna Kusumawati (Admin) | 1. Login sebagai Ratna Kusumawati.<br>2. Buka menu `/admin` tab Tinjauan Kursus.<br>3. Temukan kursus "Dasar Pembukuan untuk UMKM" (kuota: 12, kursi terpakai: 11).<br>4. Buka dialog "Ubah Kuota".<br>5. Masukkan kuota baru: 10 (sengaja melanggar aturan, lebih kecil dari kursi terpakai).<br>6. Klik tombol "Simpan Kuota". | Sistem menolak perubahan dengan pesan error validasi: "Kuota tidak boleh lebih kecil dari kursi terpakai (11 kursi)". Kuota lama tetap dipertahankan pada 12 kursi. | Terverifikasi: Trigger `fn_validasi_kuota_kursus` dan RPC `admin_ubah_kuota_kursus` memeriksa `NEW.kuota >= v_kursi_terpakai` dan menolak perubahan jika kuota baru lebih kecil dari kursi terpakai.<br><br>**Status: Lulus** |
| **TC-11** | BR-07 / US-02 & US-09 | Happy Path | Ratna Kusumawati (Admin) & Galih Pamungkas (Peserta) | 1. Galih Pamungkas mendaftar kursus berbayar dengan metode `transfer_manual` (status `menunggu_bayar`).<br>2. Login sebagai Ratna Kusumawati, buka panel `/admin` tab Pendaftaran & Pembayaran.<br>3. Temukan transaksi Galih Pamungkas dan klik tombol "Konfirmasi Pembayaran". | Status pendaftaran Galih Pamungkas berubah menjadi `aktif`. Riwayat konfirmasi tercatat pada `audit_log`. Galih Pamungkas kini dapat mengakses Ruang Belajar modul 1. | Terverifikasi: Status pendaftaran berubah menjadi `aktif`, kolom `dibayar_pada` terisi, dan aksi tercatat di tabel `audit_log`.<br><br>**Status: Lulus** |
| **TC-12** | BR-07 / US-09 | Negative Test (Validasi Karakter Alasan) | Ratna Kusumawati (Admin) | 1. Login sebagai Ratna Kusumawati.<br>2. Buka tab Pendaftaran & Pembayaran pada panel admin.<br>3. Pilih pendaftaran aktif salah satu peserta.<br>4. Klik tombol "Batalkan Pendaftaran".<br>5. Masukkan alasan pembatalan singkat: `"Batal ya"` (8 karakter).<br>6. Klik konfirmasi pembatalan. | Sistem memvalidasi input dan membatalkan aksi dengan pesan error: "Alasan pembatalan wajib diisi minimal 10 karakter". Status pendaftaran tetap `aktif`. | Terverifikasi: RPC `admin_batalkan_pendaftaran` dan trigger database memeriksa `length(trim(p_alasan)) >= 10`. Alasan kurang dari 10 karakter ditolak.<br><br>**Status: Lulus** |
| **TC-13** | BR-08 / US-03 | Negative Test (Urutan Modul & Prasyarat Baca) | Zaki Maulana (Peserta) | 1. Login sebagai Zaki Maulana (`zaki.maulana@pijaraksara.test`) pada kursus Excel.<br>2. Buka Ruang Belajar modul 1. Coba kerjakan kuis sebelum menekan tombol "Tandai materi sudah dibaca".<br>3. Ketikkan URL langsung ke modul 2: `/belajar/[id]/modul/2` padahal kuis modul 1 belum lulus. | Kuis modul 1 terkunci hingga tombol baca materi ditekan. Akses langsung ke modul 2 ditolak dan dialihkan kembali ke modul 1 dengan peringatan: "Modul 2 terkunci. Anda harus menyelesaikan dan lulus kuis modul sebelumnya terlebih dahulu". | Terverifikasi: Komponen Ruang Belajar dan database trigger memeriksa `sudah_dibaca = true` untuk membuka kuis, serta memverifikasi kelulusan modul `N-1` sebelum mengizinkan akses ke modul `N`.<br><br>**Status: Lulus** |
| **TC-14** | BR-09 / US-04 | Negative Test / Keamanan Data | Zaki Maulana (Peserta) | 1. Buka formulir kuis modul pada peramban.<br>2. Buka Developer Tools (F12) tab Network dan tab Elements/Console.<br>3. Kirim permintaan data soal kuis atau periksa payload JSON yang diterima peramban.<br>4. Cari field `kunci_jawaban` atau `jawaban_benar`. | Field `kunci_jawaban` tidak ada di seluruh payload respon jaringan maupun state klien. Penilaian kuis dievaluasi 100% di server side RPC Supabase. | Terverifikasi: Query klien hanya menyeleksi kolom `id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d`. Evaluasi nilai dan kunci jawaban sepenuhnya dihitung di server melalui RPC `evaluasi_kuis`.<br><br>**Status: Lulus** |
| **TC-15** | BR-10 / US-04 | Negative Test / Edge Case (Percobaan Kuis Melebihi Batas) | Rizky Ramadhan (Peserta) | 1. Login sebagai Rizky Ramadhan (`rizky.ramadhan@pijaraksara.test`).<br>2. Buka Ruang Belajar Bahasa Inggris Komunikasi Kerja Modul 1.<br>3. Periksa riwayat percobaan (telah menggunakan 3 kali percobaan gagal).<br>4. Coba lakukan pengiriman jawaban kuis ke-4 (baik via form UI maupun pemanggilan langsung server action / RPC). | Form kuis berstatus terkunci permanen dengan pesan: "Kesempatan percobaan kuis telah habis (3/3 kali)". Submisi server ditolak dengan pesan: "Batas maksimal 3 percobaan telah tercapai". | Terverifikasi: Data riwayat Rizky Ramadhan memiliki 3 baris di `percobaan_kuis` dengan `lulus = false`. RPC `evaluasi_kuis` menghitung jumlah percobaan dan memblokir pengiriman ke-4.<br><br>**Status: Lulus** |
| **TC-16** | BR-11 / US-05 | Happy Path | Rangga Wijaya (Peserta) / Zaki Maulana (Peserta) | 1. Peserta menyelesaikan kuis modul terakhir kursus dengan nilai memenuhi passing grade (>= 70).<br>2. Sistem menjalankan evaluasi otomatis kelulusan kursus.<br>3. Buka halaman `/kursus-saya` dan periksa status pendaftaran.<br>4. Klik tombol "Lihat Sertifikat" dan buka halaman `/sertifikat/[nomor_sertifikat]`. | Status pendaftaran otomatis berubah menjadi `selesai`. Baris baru tercatat di tabel `sertifikat` dengan format nomor `PA-TAHUN-NOMOR` berurutan tanpa lompatan. Halaman cetak sertifikat memuat nama peserta, judul kursus, dan tanggal kelulusan. | Terverifikasi: Rangga Wijaya memiliki sertifikat resmi dengan format `PA-2026-0017`. Trigger otomatis membuat baris sertifikat dan memperbarui status pendaftaran menjadi `selesai` saat seluruh modul lulus.<br><br>**Status: Lulus** |
| **TC-17** | BR-12 / US-07 | Negative Test / Hak Akses (Isolasi Data Instruktur) | Yudha Pratama (Instruktur) & Laras Wulandari (Instruktur) | 1. Login sebagai Yudha Pratama.<br>2. Coba akses halaman data peserta kursus milik Laras Wulandari (Desain Canva) melalui URL `/instruktur/kursus/[kursus_id_canva]/peserta` atau query langsung Supabase. | Sistem menolak akses dengan respons 403 Forbidden / dialihkan. Kebijakan Row Level Security (RLS) database memastikan instruktur hanya dapat membaca data kursus miliknya sendiri. | Terverifikasi: RLS policy pada tabel `pendaftaran` dan `kursus` memverifikasi `kursus.instruktur_id = auth.uid()`. Instruktur A tidak dapat membaca data peserta di kursus Instruktur B.<br><br>**Status: Lulus** |
| **TC-18** | BR-12 / US-09, US-10 & Matriks Akses | Negative Test / Hak Akses & Proteksi Diri Admin | Bagus Santoso (Peserta) & Ratna Kusumawati (Admin) | 1. Login sebagai Bagus Santoso (Peserta), lalu coba ketik URL `/admin`, `/admin/dashboard`, atau `/instruktur/kursus`.<br>2. Login sebagai Ratna Kusumawati (Admin), buka panel `/admin` tab Pengguna. Cari akun diri sendiri (`Ratna Kusumawati`), lalu coba ubah perannya menjadi peserta atau klik nonaktifkan akun. | Bagus Santoso otomatis dialihkan ke halaman utama dengan peringatan hak akses ditolak. Pada akun Ratna Kusumawati, kontrol pengubah peran dan tombol nonaktifkan terkunci (disabled) di UI, dan backend menolak: "Admin tidak dapat menurunkan peran atau menonaktifkan akun sendiri". | Terverifikasi: Middleware rute dan layout memvalidasi peran user dari sesi; peserta dialihkan saat mengakses `/admin` atau `/instruktur`. RPC `admin_ubah_peran_pengguna` dan trigger database menolak perubahan peran atau penonaktifan terhadap akun admin yang sedang login.<br><br>**Status: Lulus** |

---

## 4. Hasil Verifikasi Kasus Batas (Edge Cases)

Berdasarkan eksekusi pengecekan riil terhadap database dan kode aplikasi LMS Pijar Aksara:

1. **Kasus Batas Percobaan Kuis (Rizky Ramadhan):**
   - Peserta: Rizky Ramadhan (`rizky.ramadhan@pijaraksara.test`).
   - Kursus: Bahasa Inggris untuk Percakapan Kerja, Modul 1 (Memperkenalkan Diri dan Rekan Kerja).
   - Data Aktual: Telah tercatat 3 baris percobaan kuis (`total_percobaan = 3`, `pernah_lulus = false`).
   - Hasil Uji: Antarmuka kuis terkunci permanen, dan pemanggilan server action evaluasi kuis ke-4 ditolak dengan pesan error batasan percobaan habis.

2. **Kasus Batas Kursi Terakhir & Kuota Penuh (Dasar Pembukuan untuk UMKM):**
   - Kursus: Dasar Pembukuan untuk UMKM (`dasar-pembukuan-umkm`).
   - Kuota: 12 kursi.
   - Kursi Terpakai: 11 kursi (status: `aktif`, `menunggu_bayar`, `selesai`).
   - Sisa Kursi: Tepat menyisakan 1 kursi.
   - Hasil Uji: Pendaftar pertama (Bagus Santoso) berhasil mengamankan 1 kursi terakhir. Pendaftar kedua (Siti Aminah) langsung ditolak dengan status kuota penuh. Mekanisme `SELECT ... FOR UPDATE` menjamin tidak ada alokasi kursi berlebih (*oversubscription*).

3. **Kasus Batas Kerahasiaan Kunci Jawaban (Data Leak Prevention):**
   - Endpoint API & Query Server Component soal kuis hanya memilih field: `id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d`.
   - Field `kunci_jawaban` tidak disertakan di peramban pengguna. Seluruh evaluasi perolehan nilai diproses di sisi server PostgreSQL via stored procedure.

4. **Kasus Batas Penomoran Sertifikat Tanpa Lompatan:**
   - Format Sertifikat: `PA-TAHUN-NOMOR` (contoh aktual di database: `PA-2026-0004`, `PA-2026-0017`, `PA-2026-0021`).
   - Hasil Uji: Nomor urut dibuat oleh database sequence tahunan secara transaksional, memastikan sertifikat tidak duplikat dan berurutan.

5. **Kasus Batas Proteksi Diri Administrator:**
   - Admin: Ratna Kusumawati (`ratna@pijaraksara.test`).
   - Aksi: Mengubah peran sendiri menjadi peserta atau menonaktifkan akun sendiri.
   - Hasil Uji: Kontrol pada antarmuka admin berstatus nonaktif (disabled), dan validasi backend menolak operasi untuk mencegah terjadinya kekosongan administrator sistem.

---

## 5. Akun Uji Latihan (Password Seragam: `Latihan#2026`)

*Semua akun uji merujuk pada berkas resmi `Data_Contoh_LMS.xlsx` sheet `Akun Uji`:*

| Peran | Nama | Email | Kasus Uji Khusus |
| :--- | :--- | :--- | :--- |
| **Admin** | Ratna Kusumawati | `ratna@pijaraksara.test` | Admin utama (tinjauan kursus, pembayaran, kelola user, proteksi diri) |
| **Admin** | Dimas Prasetyo | `dimas@pijaraksara.test` | Admin kedua |
| **Instruktur** | Yudha Pratama | `yudha@pijaraksara.test` | Pemilik kursus Excel, Dasar Pembukuan, dan Word (draf) |
| **Instruktur** | Laras Wulandari | `laras@pijaraksara.test` | Pemilik Desain Konten Canva dan Fotografi Produk (ditutup) |
| **Instruktur** | Michael Sitorus | `michael@pijaraksara.test` | Pemilik Bahasa Inggris dan Public Speaking (ditinjau) |
| **Peserta** | Bagus Santoso | `bagus.santoso@pijaraksara.test` | Belum punya kursus (untuk uji perebutan kursi terakhir) |
| **Peserta** | Siti Aminah | `siti.aminah@pijaraksara.test` | Belum punya kursus (untuk uji kuota penuh) |
| **Peserta** | Lina Marlina | `lina.marlina@pijaraksara.test` | Excel modul 2: sisa 1 percobaan kuis |
| **Peserta** | Rizky Ramadhan | `rizky.ramadhan@pijaraksara.test` | Bahasa Inggris modul 1: percobaan habis (3x gagal) |
| **Peserta** | Zaki Maulana | `zaki.maulana@pijaraksara.test` | Excel modul 1: materi dibaca, kuis belum dikerjakan |
| **Peserta** | Putri Ayuningtyas | `putri.ayuningtyas@pijaraksara.test` | Canva progres 0%; Pembukuan daftar ulang setelah expired |
| **Peserta** | Galih Pamungkas | `galih.pamungkas@pijaraksara.test` | Excel: status `menunggu_bayar` (transfer manual) |
| **Peserta** | Citra Maharani | `citra.maharani@pijaraksara.test` | Dasar Pembukuan: status `menunggu_bayar` (Mayar) |
| **Peserta** | Rangga Wijaya | `rangga.wijaya@pijaraksara.test` | Telah memiliki 3 sertifikat kelulusan |
| **Peserta** | Melati Anggraini | `melati.anggraini@pijaraksara.test` | Bahasa Inggris: pendaftaran dibatalkan admin dengan alasan |
| **Peserta** | Yoga Firmansyah | `yoga.firmansyah@pijaraksara.test` | Bahasa Inggris: pendaftaran dibatalkan sendiri sebelum bayar |
