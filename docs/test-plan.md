# Rencana Kerja & Test Plan LMS Lembaga Kursus Pijar Aksara

Dokumen ini memuat **Rencana Kerja Per Halaman**, **Matriks Akses Peran**, **Test Plan Bisnis**, dan **Daftar Akun Uji** berdasarkan PRD (`PRD+ERDlms.md`) dan ERD (`ERD_LMS.pdf`).

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
   - Supabase Storage privat `materi-lampiran` untuk file PDF modul (maks 10 MB per file, diakses lewat *Signed URL* berlaku maks 60 menit).
   - Row Level Security (RLS) ketat pada seluruh tabel.

---

### Tahap 1: Halaman Publik (SEO-Friendly)
1. **Katalog Kursus (`/` atau `/kursus`)**
   - Menampilkan hanya kursus berstatus `terbit` (BR-01).
   - Fitur pencarian, filter kategori, badge Gratis/Harga, info sisa kursi, nama instruktur.
   - Optimasi SEO & performa: LCP $\le$ 2.5 detik, meta tags, sitemap dinamis (`/sitemap.xml`).
2. **Detail Kursus (`/kursus/[slug]`)**
   - URL berbasis slug (contoh: `/kursus/excel-administrasi-perkantoran`).
   - Deskripsi lengkap, profil instruktur, silabus (judul modul & durasi saja, isi materi terkunci).
   - Tombol "Daftar Kursus" dengan validasi status login dan kuota kursi.
3. **Autentikasi (`/login` & `/register`)**
   - Pendaftaran akun dengan nama lengkap (3–100 karakter), email unik, nomor HP (format 08xx), kata sandi.
   - Pendaftar baru selalu mendapatkan peran `peserta`.

---

### Tahap 2: Halaman Peserta (`noindex`)
4. **Kursus Saya (`/kursus-saya`)**
   - Daftar kursus yang sedang atau pernah didaftarkan.
   - Hitung mundur batas bayar 24 jam untuk kursus berbayar `menunggu_bayar` (BR-07).
   - Tombol pembatalan pendaftaran (hanya jika belum dibayar).
   - Progress bar kelulusan (%) dan tombol "Lanjut Belajar".
   - Tombol unduh/lihat sertifikat untuk pendaftaran berstatus `selesai`.
5. **Ruang Belajar (`/belajar/[pendaftaran_id]/modul/[urutan]`)**
   - Sidebar navigasi modul: Modul 1 langsung terbuka, Modul $N+1$ terkunci sampai kuis Modul $N$ lulus (BR-08).
   - Konten: bacaan materi teks, video embed (`https://`), unduh file PDF via *Signed URL* sementara.
   - Tombol "Tandai materi sudah dibaca" untuk membuka akses pengerjaan kuis.
   - Form pengerjaan kuis pilihan ganda A–D (wajib dijawab semua).
   - Evaluasi nilai kuis otomatis di server, menampilkan skor, jumlah benar, dan sisa kesempatan (maks. 3x percobaan, BR-10).
   - Otomatis mengubah pendaftaran menjadi `selesai` dan menerbitkan sertifikat saat semua modul lulus (BR-11).
6. **Cetak Sertifikat (`/sertifikat/[nomor_sertifikat]`)**
   - Tampilan sertifikat resmi Lembaga Kursus Pijar Aksara dengan nomor unik berurutan `PA-TAHUN-NOMOR`.

---

### Tahap 3: Halaman Instruktur (`noindex`)
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

### Tahap 4: Halaman Admin (`noindex`)
9. **Panel Admin (`/admin`)**
   - **Tab Tinjauan Kursus:** Review kursus status `ditinjau`, tombol Terbitkan, tombol Kembalikan ke draf (wajib catatan min. 10 karakter, BR-02), tombol Tutup & Buka kembali kursus, ubah kuota dan harga (kuota tidak boleh di bawah kursi terpakai, BR-06).
   - **Tab Pendaftaran & Pembayaran:** Konfirmasi pembayaran transfer manual (status `menunggu_bayar` $\rightarrow$ `aktif`), pembatalan pendaftaran aktif (wajib alasan min. 10 karakter, BR-07).
   - **Tab Pengguna:** Kelola peran akun (peserta, instruktur, admin), aktivasi/nonaktivasi akun. Proteksi: admin dilarang menurunkan perannya sendiri atau menonaktifkan akunnya sendiri (BR-12).
   - **Tab Audit Log:** Tabel pencatatan riwayat aksi sensitif.
10. **Dashboard Admin (`/admin/dashboard`)**
    - Filter tanggal (default 8 minggu terakhir).
    - 4 Kartu Ringkasan: Pendaftaran bulan ini, Pendapatan bulan ini, Peserta aktif, Sertifikat terbit.
    - Grafik batang pendaftaran mingguan (gratis vs berbayar).
    - Grafik garis pendapatan mingguan.
    - Grafik batang persentase kelulusan kursus ($\frac{\text{selesai}}{\text{aktif} + \text{selesai}}$).
    - Tabel modul dengan kelulusan percobaan pertama terendah.
    - Tabel kursus hampir penuh (sisa kursi $\le 2$).

---

## 2. Matriks Akses Peran

| Halaman & Fitur | Pengunjung (Guest) | Peserta | Instruktur | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Katalog Kursus (Terbit)** | ✅ | ✅ | ✅ | ✅ |
| **Detail Kursus (Terbit)** | ✅ | ✅ | ✅ | ✅ |
| **Daftar Akun Baru & Login** | ✅ | ✅ | ✅ | ✅ |
| **Pendaftaran Kursus** | ❌ (Redirect) | ✅ | ❌ | ❌ |
| **Kursus Saya** | ❌ | ✅ | ❌ | ❌ |
| **Ruang Belajar (Materi & Video)** | ❌ | ✅ (Terdaftar) | ❌ | ❌ |
| **Pengerjaan Kuis Modul** | ❌ | ✅ (Maks 3x) | ❌ | ❌ |
| **Unduh PDF Modul (Signed URL)** | ❌ | ✅ (Terdaftar) | 🔒 (Milik sendiri) | ✅ |
| **Lihat & Cetak Sertifikat** | ❌ | ✅ (Lulus) | ❌ | ✅ |
| **Kelola Kursus & Modul (Draf)** | ❌ | ❌ | 🔒 (Milik sendiri) | ❌ (Terkunci) |
| **Ajukan Kursus ke Admin** | ❌ | ❌ | 🔒 (Milik sendiri) | ❌ |
| **Lihat Nilai Peserta Kursus** | ❌ | 🔒 (Nilai sendiri) | 🔒 (Kursus sendiri) | ✅ (Semua) |
| **Tinjau Kursus (Terbit/Kembalikan/Tutup)** | ❌ | ❌ | ❌ | ✅ |
| **Ubah Kuota & Harga Kursus** | ❌ | ❌ | ❌ | ✅ |
| **Konfirmasi Pembayaran Manual** | ❌ | ❌ | ❌ | ✅ |
| **Batalkan Pendaftaran Aktif** | ❌ | ❌ | ❌ | ✅ (Alasan $\ge 10$) |
| **Kelola Peran & Akun Pengguna** | ❌ | ❌ | ❌ | ✅ (Kecuali diri) |
| **Dashboard Keuangan & Laporan** | ❌ | ❌ | ❌ | ✅ |
| **Lihat Audit Log** | ❌ | ❌ | ❌ | ✅ |

---

## 3. Test Plan Bisnis (18 Test Cases)

| ID Test | Kode Aturan | Kategori | Skenario Pengujian | Kondisi & Langkah | Kriteria Lulus (Ekspektasi) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | BR-01 | Positif | Tampilan Katalog Publik | Pengunjung membuka halaman `/kursus`. | Hanya menampilkan kursus status `terbit`. Kursus `draf`, `ditinjau`, atau `ditutup` tidak tampil. |
| **TC-02** | BR-01 | Negatif / Akses | Akses langsung URL kursus non-terbit | Pengunjung mengakses slug kursus status `draf` atau `ditinjau` lewat URL langsung. | Halaman merespons **404 Not Found** (info kursus tidak bocor). |
| **TC-03** | BR-02 | Positif | Pengajuan kursus oleh Instruktur | Instruktur pemilik mengajukan kursus draf yang memiliki modul & soal lengkap. | Status kursus berhasil berubah menjadi `ditinjau`. |
| **TC-04** | BR-02 | Negatif | Admin kembalikan kursus dengan catatan $<10$ karakter | Admin mengembalikan kursus ke draf dengan catatan revisi `"kurang"` (6 char). | Aksi ditolak dengan validasi bahwa catatan wajib minimal 10 karakter. |
| **TC-05** | BR-02, BR-04 | Negatif / Akses | Modifikasi konten kursus setelah diajukan | Instruktur atau Admin mencoba mengedit/menambah modul saat status `ditinjau` atau `terbit`. | Aksi ditolak (HTTP 403 / UI form disabled). Konten terkunci rapat. |
| **TC-06** | BR-03 | Negatif | Pengajuan kursus dengan modul/soal kurang | Instruktur mengajukan kursus dengan 1 modul atau modul dengan soal $<3$. | Sistem menolak pengajuan kursus sesuai aturan BR-03. |
| **TC-07** | BR-05 | Negatif | Pendaftaran ganda pada kursus yang sama | Peserta yang sudah punya pendaftaran aktif/menunggu bayar mendaftar lagi di kursus yang sama. | Pendaftaran ditolak; sistem menampilkan status pendaftaran yang sedang berjalan. |
| **TC-08** | BR-06 | Negatif / Konkurensi | Perebutan kursi terakhir secara bersamaan (*Race Condition*) | 2 peserta mendaftar secara bersamaan pada kursus yang menyisakan 1 kursi. | Tepat 1 peserta berhasil mendaftar, peserta lainnya ditolak karena kuota penuh. Sisa kursi tidak negatif. |
| **TC-09** | BR-06 | Negatif | Admin mengubah kuota di bawah kursi terpakai | Kursus memiliki 11 kursi terpakai. Admin mencoba mengubah kuota menjadi 10. | Form validasi menolak pembaruan kuota. |
| **TC-10** | BR-07 | Positif / Negatif | Batas waktu bayar kursus berbayar (24 Jam) | Peserta daftar kursus berbayar. Dibayar tepat waktu vs Dibiarkan lewat batas waktu. | Jika dikonfirmasi: status berubah `aktif`. Jika lewat batas 24 jam: status otomatis `kedaluwarsa` dan kursi kembali terbuka. |
| **TC-11** | BR-07 | Negatif | Pembatalan pendaftaran aktif tanpa alasan $\ge 10$ karakter | Admin membatalkan pendaftaran aktif dengan alasan `"batal"` (5 char). | Pembatalan ditolak. Wajib memasukkan alasan minimal 10 karakter. |
| **TC-12** | BR-08 | Negatif / Akses | Akses langsung Modul 2 sebelum Modul 1 lulus | Peserta membuka URL `/belajar/[id]/modul/2` padahal belum lulus kuis Modul 1. | Sistem mengunci modul 2 dan mengarahkan kembali ke modul sebelumnya. |
| **TC-13** | BR-08 | Negatif | Mengerjakan kuis sebelum menandai materi dibaca | Peserta mencoba mengerjakan kuis tanpa menekan tombol "Tandai materi sudah dibaca". | Kuis terkunci dan tidak bisa dikerjakan. |
| **TC-14** | BR-09 | Keamanan / Akses | Inspeksi Tab Network browser terhadap kunci jawaban | Peserta membuka form kuis dan memeriksa respons API di tab Network DevTools. | Kolom `kunci_jawaban` tidak ada sama sekali di payload data yang diterima browser. |
| **TC-15** | BR-10 | Negatif / Konkurensi | Pengiriman percobaan kuis ke-4 | Peserta yang sudah gagal 3 kali mencoba mengirim jawaban kuis kembali. | Sistem menolak percobaan kuis (batas maksimal 3 kali per modul tercapai). |
| **TC-16** | BR-11 | Positif | Kelulusan modul terakhir & penerbitan sertifikat | Peserta menyelesaikan dan lulus kuis modul terakhir. | Status pendaftaran otomatis `selesai` dan sertifikat terbit otomatis dengan format `PA-TAHUN-NOMOR`. |
| **TC-17** | BR-12 | Keamanan / Akses | Instruktur mengakses data peserta kursus instruktur lain | Instruktur A mencoba memanggil data peserta di kursus milik Instruktur B. | Sistem merespons **403 Forbidden** melalui Row Level Security database. |
| **TC-18** | BR-12 | Negatif / Akses | Admin menurunkan peran atau menonaktifkan dirinya sendiri | Admin mencoba mengubah perannya menjadi `peserta` atau menonaktifkan akun sendiri. | Sistem menolak aksi untuk mencegah kekosongan administrator. |

---

## 4. Akun Uji Latihan (Password Seragam: `Latihan#2026`)

*Semua akun uji merujuk pada berkas resmi `Data_Contoh_LMS.xlsx` sheet `Akun Uji`:*

| Peran | Nama | Email | Kasus Uji Khusus |
| :--- | :--- | :--- | :--- |
| **Admin** | Ratna Kusumawati | `ratna@pijaraksara.test` | Admin utama (tinjauan kursus, pembayaran, kelola user) |
| **Admin** | Dimas Prasetyo | `dimas@pijaraksara.test` | Admin kedua |
| **Instruktur** | Yudha Pratama | `yudha@pijaraksara.test` | Pemilik kursus Excel, Dasar Pembukuan, dan Word (draf) |
| **Instruktur** | Laras Wulandari | `laras@pijaraksara.test` | Pemilik Desain Konten Canva dan Fotografi (ditutup) |
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
