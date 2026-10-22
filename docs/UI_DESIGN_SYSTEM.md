# Aturan Desain & Tone Warna UI - LMS Pijar Aksara

Dokumen ini merupakan panduan dan aturan absolut untuk seluruh perancangan antarmuka (UI/UX) di LMS Pijar Aksara. Dibangun menggunakan **Next.js (App Router)**, **Tailwind CSS**, dan **Lucide React Icons**.

---

## 1. Skema Warna (Design Tokens & Tailwind Utilities)

| Elemen UI | Nilai Warna | Tailwind Class | Catatan Penggunaan |
|---|---|---|---|
| **Background Utama** | `#ffffff` | `bg-white` | Latar belakang bersih, modern, dan lapang |
| **Background Sekunder / Card** | `#f8fafc` / `#ffffff` | `bg-slate-50` / `bg-white` | Card konten, panel navigasi |
| **Teks Utama & Headings** | `#0f172a` / `#27272a` | `text-slate-900` / `text-zinc-800` | **DILARANG** menggunakan warna hitam pekat `#000000` |
| **Teks Sekunder / Muted** | `#64748b` | `text-slate-500` / `text-slate-600` | Deskripsi, metadata modul, durasi |
| **Warna Utama / CTA** | `#ffdf0f` | `bg-[#ffdf0f]` `hover:bg-[#eacb0d]` | Tombol utama, aksi pendaftaran, tombol kuis, CTA hero |
| **Teks pada Tombol CTA** | `#0f172a` | `text-slate-900 font-bold` | Selalu gunakan teks slate-900 gelap pada tombol kuning |
| **Warna Aksen & Highlight** | `#843bab` | `bg-[#843bab]` `text-[#843bab]` `border-[#843bab]` | Badge unggulan, highlight kategori, border aktif |
| **Border Card Aksen Halus** | `rgba(132, 59, 171, 0.3)` | `border border-[#843bab]/30` | Sudut melengkung `rounded-2xl` |

---

## 2. Struktur Layout & Responsivitas (Desktop & Mobile Android)

### A. Navigation Bar
1. **Desktop (`hidden md:flex`)**:
   - Sticky Header di bagian paling atas: `sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200`.
   - Logo Pijar Aksara dengan ikon `BookOpen` beraksen ungu `#843bab`.
   - Menu navigasi utama: Katalog Kursus, Kursus Saya (peserta), Kelola Kursus (instruktur), Panel Admin (admin).
   - Tombol Aksi: "Masuk / Daftar" atau User Profile Menu dengan tombol CTA kuning `bg-[#ffdf0f]`.

2. **Mobile Android Device (`md:hidden`)**:
   - **Top Bar Ringkas**: Header ringkas untuk logo Pijar Aksara di bagian atas.
   - **Fixed Bottom Navigation Bar**:
     - Posisi: `fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 z-50`.
     - Area sentuh ramah ibu jari (*thumb-friendly* min 48px).
     - Menu ikon:
       - **Katalog** (`BookOpen`) -> `/kursus`
       - **Belajar / Kursus Saya** (`GraduationCap` / `Award`) -> `/kursus-saya`
       - **Workspace Peran** (`FileText` / `ShieldCheck`) -> `/instruktur` atau `/admin` (sesuai peran)
       - **Profil / Akun** (`User`) -> Drawer / Modal profil

---

## 3. Komponen Hero & Katalog Kursus
- **Hero Section**:
  - Tampilan stack vertikal di mobile (`flex flex-col`), 2 kolom di desktop (`md:flex-row`).
  - Headline tebal berkelas, ringkasan deskripsi yang lapang, dan tombol CTA utama kuning `bg-[#ffdf0f]`.
- **Card Grid Katalog**:
  - Grid adaptif: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
  - Border ungu halus: `border border-[#843bab]/30`.
  - Sudut melengkung modern: `rounded-2xl`.
  - Label harga/gratis, sisa kursi, indikator progres belajar, dan tombol aksi kuning `bg-[#ffdf0f]`.

---

## 4. Halaman Modular yang Dibangun Bertahap
1. **Tahap 1: Fondasi Layout Global, Navbar Desktop & Bottom Nav Mobile, serta Halaman Katalog & Beranda**.
2. **Tahap 2: Halaman Detail Kursus & Alur Pendaftaran / Checkout**.
3. **Tahap 3: Ruang Belajar (Learning Space) & Antarmuka Pengerjaan Kuis Interaktif**.
4. **Tahap 4: Workspace Instruktur (Form Pembuatan Kursus, Modul, Materi, Soal, & Buku Nilai)**.
5. **Tahap 5: Panel Admin & Dashboard Analytics (Verifikasi Pembayaran, Audit Trail, & Chart Pendapatan)**.
