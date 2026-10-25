# Laporan Audit PRD & Implementasi Fitur Tahap 2: Halaman Peserta
**LMS Lembaga Kursus Pijar Aksara**

Dokumen ini merupakan laporan komprehensif audit kesesuaian produk, penyelesaian permasalahan teknis antarmuka (UI Fallback), sinkronisasi dokumentasi teknis, serta implementasi 4 (empat) fitur bernilai tambah untuk peserta didik berdasarkan dokumen acuan utama [PRD+ERDlms.md](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/PRD%2BERDlms.md) dan rencana uji [docs/test-plan.md](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/docs/test-plan.md).

---

## 1. Ruang Lingkup Audit

Audit difokuskan pada **Tahap 2: Halaman Peserta (noindex)** yang mencakup:
1. **Halaman Kursus Saya (`/kursus-saya`):** Pengelolaan status pendaftaran, batas waktu pembayaran 24 jam (BR-07), pembatalan tagihan belum bayar, pemantauan progres modul kelulusan, dan tautan akses belajar/sertifikat.
2. **Ruang Belajar (`/belajar/[slug]?modul=[urutan]`):** Navigasi modul berurutan (BR-08), pembacaan materi, pemutaran video embed, pengunduhan lampiran PDF privat melalui Signed URL (BR-08), serta penandaan materi telah dibaca.
3. **Ruang Evaluasi Kuis (`/belajar/[slug]/kuis`):** Pengerjaan kuis pilihan ganda A–D tanpa kebocoran kunci jawaban di sisi klien (BR-09), batasan maksimal 3 kali percobaan (BR-10), dan penilaian otomatis di sisi server.
4. **Halaman Sertifikat (`/sertifikat/[id]`):** Tampilan sertifikat resmi dengan penomoran unik berurutan `PA-TAHUN-NOMOR` (BR-11) yang diterbitkan secara otomatis setelah seluruh modul dinyatakan lulus.

---

## 2. Temuan Audit Awal & Identifikasi Permasalahan

Berdasarkan audit mendalam terhadap basis kode frontend dan skema basis data PostgreSQL Supabase, ditemukan 3 (tiga) catatan/isu minor sebelum implementasi fitur baru:

### 2.1. Inkonsistensi Visual UI Fallback Error Kuis dan Sertifikat
- **Lokasi Berkas:**
  - `src/app/belajar/[slug]/kuis/page.tsx`
  - `src/app/sertifikat/[id]/page.tsx`
- **Deskripsi Masalah:**
  Pada saat peserta menghadapi kondisi akses ditolak (misalnya modul belum terbuka, materi belum ditandai dibaca, atau sertifikat belum terbit), komponen menampilkan kartu modal dengan styling gelap lawas (`.glass-panel` dan inline style `color: #ffffff`). Hal ini bertentangan dengan desain utama aplikasi yang telah distandarisasi ke tema terang (*Tailwind Slate Light Theme*).
- **Dampak:** Pengalaman visual pengguna menjadi terganggu dan kontras teks tidak seragam dengan halaman bacaan ruang belajar utama.

### 2.2. Ketidaksinkronan Penamaan Storage Bucket di Test Plan
- **Lokasi Berkas:** `docs/test-plan.md` baris 20.
- **Deskripsi Masalah:**
  Pada dokumen test plan, bucket penyimpanan privat modul tertulis sebagai `materi-lampiran`. Sedangkan pada migrasi basis data SQL riil (`20261021000004_enforce_module_access_and_progress.sql`) dan Server Action `getSignedPdfUrlAction`, nama bucket aktual di Supabase Storage adalah `materi_pdf` (privat, batas 10 MB, tipe MIME `application/pdf`).
- **Dampak:** Berpotensi menimbulkan ambiguitas bagi tim penguji (QA) atau auditor teknis saat memverifikasi kebijakan RLS storage.

### 2.3. Perbedaan Format Rute URL Ruang Belajar di Test Plan
- **Lokasi Berkas:** `docs/test-plan.md` baris 47.
- **Deskripsi Masalah:**
  Test plan mencatat rute navigasi sebagai `/belajar/[pendaftaran_id]/modul/[urutan]`. Pada implementasi riil, aplikasi menggunakan format yang lebih bersih dan ramah pengguna `/belajar/[slug]?modul=[urutan]` di mana ID pendaftaran dan hak akses diverifikasi secara aman di server melalui fungsi RPC `get_ruang_belajar`.

---

## 3. Resolusi Permasalahan & Standarisasi UI (Opsi E)

Penyelesaian permasalahan teknis (Opsi E) dieksekusi terlebih dahulu sebelum fitur baru ditambahkan:

### 3.1. Standarisasi Fallback Halaman Kuis
Berkas [src/app/belajar/[slug]/kuis/page.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/app/belajar/%5Bslug%5D/kuis/page.tsx) diperbarui untuk 4 kondisi fallback:
1. **Akses Kuis Terbatas:** Menampilkan kartu putih dengan ikon peringatan merah, teks abu gelap terbaca jelas, serta tombol navigasi menuju detail kursus atau kursus saya.
2. **Modul Masih Terkunci:** Menampilkan ikon gembok dengan penegasan aturan bahwa modul sebelumnya harus diselesaikan terlebih dahulu.
3. **Materi Belum Selesai Dibaca:** Menampilkan ikon buku berwarna amber dengan ajakan untuk menandai materi terlebih dahulu (BR-08).
4. **Gagal Memuat Soal:** Menampilkan pesan galat yang elegan jika terdapat gangguan jaringan atau database.

### 3.2. Standarisasi Fallback Halaman Sertifikat
Berkas [src/app/sertifikat/[id]/page.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/app/sertifikat/%5Bid%5D/page.tsx) distandarisasi menggunakan wadah `min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50` dengan kartu `bg-white rounded-3xl border border-slate-200 shadow-sm`.

### 3.3. Pemutakhiran Dokumen Test Plan
Berkas [docs/test-plan.md](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/docs/test-plan.md) disinkronkan:
- Memperjelas 3 bucket Supabase Storage: `materi_pdf` (privat, 10 MB), `kursus_brosur` (publik, 1 MB), dan `avatars` (publik, 1 MB).
- Menyelaraskan format rute Ruang Belajar `/belajar/[slug]?modul=[urutan]` dan Cetak Sertifikat `/sertifikat/[id]`.
- **Hasil Komit Git:** `29ffb93` ("fix: standarisasi ui fallback kuis dan sertifikat serta sinkronisasi test-plan").

---

## 4. Implementasi Fitur Bernilai Tambah Peserta

Setelah seluruh permasalahan dasar teratasi, 4 (empat) fitur bernilai tambah diimplementasikan secara komprehensif:

### 4.1. Fitur Opsi A: Salin Tautan & Bagikan Sertifikat Kelulusan
- **Tujuan:** Memberikan kemudahan bagi peserta untuk melampirkan bukti kelulusan pada portofolio kerja, profil LinkedIn, maupun komunikasi profesional.
- **Implementasi:**
  - Berkas: [src/components/CertificateView.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/components/CertificateView.tsx)
  - Fitur:
    1. **Tombol Salin Tautan:** Menyalin URL sertifikat ke clipboard pengguna disertai umpan balik visual otomatis ("Tersalin" selama 3 detik).
    2. **Tombol Bagikan ke WhatsApp:** Membuka tautan berbagi dengan template pesan resmi kelulusan dari Lembaga Kursus Pijar Aksara beserta nomor sertifikat.
    3. **Tombol Bagikan ke LinkedIn:** Mengarahkan ke dialog *share-offsite* resmi LinkedIn.
  - Seluruh elemen aksi dibungkus dalam kelas `no-print` sehingga tidak mencemari hasil cetak fisik maupun berkas unduhan PDF.

### 4.2. Fitur Opsi B: Indikator Akumulasi Menit Belajar
- **Tujuan:** Memberikan visualisasi komitmen waktu belajar yang telah dicapai peserta dibandingkan total bobot materi kursus.
- **Implementasi:**
  - Berkas Kueri: [src/app/kursus-saya/page.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/app/kursus-saya/page.tsx)
  - Berkas Kartu: [src/components/MyCourseCard.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/components/MyCourseCard.tsx)
  - Berkas Ruang Belajar: [src/components/LearningRoom.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/components/LearningRoom.tsx)
  - Rincian Kalkulasi:
    - `total_durasi_menit`: Jumlah kumulatif kolom `durasi_menit` dari seluruh modul pada kursus terkait.
    - `durasi_selesai_menit`: Jumlah kumulatif menit dari modul-modul yang status kuisnya telah dinyatakan lulus (`progres_modul.lulus_pada IS NOT NULL`).
  - Ditampilkan secara rapi pada kartu kursus (contoh: *1 dari 4 modul selesai (45/180 mnt)*) serta pada bilah progres Ruang Belajar.

### 4.3. Fitur Opsi C: Banner Pengingat Batas Bayar Mendesak (< 6 Jam)
- **Tujuan:** Menghindarkan peserta dari kehilangan kuota kursi pada kursus berbayar populer akibat kelalaian melewati batas waktu 24 jam (BR-06 & BR-07).
- **Implementasi:**
  - Berkas: [src/components/MyCoursesClient.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/components/MyCoursesClient.tsx)
  - Logika: Mendeteksi pendaftaran dengan `status === 'menunggu_bayar'` dan selisih waktu `diff <= 6 * 60 * 60 * 1000` (kurang dari 6 jam).
  - Tampilan: Banner oranye-amber di area paling atas halaman Kursus Saya dengan ikon jam beranimasi, daftar nama kursus yang hampir kedaluwarsa, dan tombol pintas `Bayar Sekarang` yang langsung memfilter daftar kursus ke tab tagihan.

### 4.4. Fitur Opsi D: Pencarian Cepat Modul Pembelajaran di Sidebar
- **Tujuan:** Mempermudah peserta menavigasi modul-modul pembelajaran, terutama pada kursus dengan materi banyak (hingga 10 modul sesuai BR-03).
- **Implementasi:**
  - Berkas: [src/components/LearningRoom.tsx](file:///e:/WEB%20PROGRAM/CAPSTONE/LMS/src/components/LearningRoom.tsx)
  - Fitur:
    - Input pencarian cepat di atas daftar modul sidebar dengan ikon pencarian dan tombol reset silang.
    - Pemfilteran instan berdasarkan nomor modul atau kata kunci judul materi.
    - Penanganan status kosong (*"Tidak ada modul yang cocok..."*).
    - Menjaga keutuhan aturan bisnis BR-08 (modul yang terkunci tetap berstatus terkunci dan tidak dapat diakses secara ilegal).

- **Hasil Komit Git:** `511ffc1` ("feat: implementasi fitur tambahan peserta opsi a, b, c, dan d").

---

## 5. Matriks Kepatuhan Aturan Bisnis PRD

| Kode Aturan | Ketentuan PRD | Status Verifikasi | Catatan Implementasi |
| :--- | :--- | :--- | :--- |
| **BR-05** | Hanya peran Peserta yang dapat mendaftar; satu peserta satu pendaftaran aktif per kursus. | Terpenuhi | Dicek pada level RPC `daftar_kursus_berbayar` & `daftar_kursus_gratis`. |
| **BR-06** | Penguncian kursi (*pessimistic locking*) dan kuota tidak terlampaui. | Terpenuhi | SQL `SELECT kuota FROM kursus WHERE id = ... FOR UPDATE`. |
| **BR-07** | Batas bayar 24 jam; pembatalan hanya untuk tagihan belum bayar. | Terpenuhi | Live countdown di kartu + Banner mendesak (< 6 jam) + Modal batal. |
| **BR-08** | Materi berurutan; modul N+1 terkunci hingga kuis modul N lulus; tombol baca materi. | Terpenuhi | Diverifikasi di RPC `get_ruang_belajar`, `tandai_materi_dibaca`, dan UI filter sidebar. |
| **BR-09** | Kuis A–D; penilaian di server; kunci jawaban tidak dikirim ke browser. | Terpenuhi | RPC `get_soal_kuis` tidak memuat kolom `kunci_jawaban`; evaluasi di `submit_kuis`. |
| **BR-10** | Maksimal 3 kali percobaan kuis per modul. | Terpenuhi | Ditegakkan lewat trigger database `trg_kunci_kuis_tiga_kali` dan validasi UI. |
| **BR-11** | Penerbitan sertifikat berurutan `PA-TAHUN-NOMOR` saat seluruh modul lulus. | Terpenuhi | Diterbitkan otomatis via RPC `submit_kuis` + tombol cetak dan berbagi portofolio. |
| **BR-12** | Nilai dan data peserta bersifat privat (hanya peserta pemilik, instruktur pemilik, dan admin). | Terpenuhi | Ditegakkan melalui kebijakan RLS PostgreSQL pada tabel `pendaftaran`, `progres_modul`, dan `percobaan_kuis`. |

---

## 6. Verifikasi Teknis & Build

- **Status Kompilasi TypeScript:** Bersih (0 galat tipe).
- **Status Next.js Build:** Berhasil sempurna (Exit code `0`).
- **Seluruh 23 Rute Aplikasi:** Terkompilasi sukses (termasuk rute privat bertanda *noindex*).
- **Status Repositori:** Seluruh perubahan telah terdorong ke cabang `main` pada repositori GitHub dan dideploy otomatis oleh Netlify CI/CD.

---

## 7. Kesimpulan

Audit dan penambahan fitur pada Tahap 2 (Halaman Peserta) telah berhasil meningkatkan kualitas antarmuka, konsistensi desain, kecepatan navigasi materi, serta kegunaan sertifikat kelulusan bagi peserta Lembaga Kursus Pijar Aksara tanpa mengorbankan integritas keamanan data maupun batasan aturan bisnis PRD.
