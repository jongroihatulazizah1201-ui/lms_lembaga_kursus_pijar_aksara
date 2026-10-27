'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Lock,
  Printer,
  ChevronDown,
  ExternalLink,
  BookCheck,
  Zap,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';

interface Props {
  userProfile: {
    nama_lengkap: string;
    email: string;
  };
}

type RuleTab = 'semua' | 'aturan_kuis' | 'alur_modul' | 'sertifikat' | 'pembayaran' | 'faq';

export default function CourseRulesClient({ userProfile }: Props) {
  const [activeTab, setActiveTab] = useState<RuleTab>('semua');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqList = [
    {
      q: 'Berapa standar nilai minimal kelulusan (passing grade) kuis?',
      a: 'Standar nilai kelulusan kuis ditentukan pada masing-masing kursus dalam rentang 50 hingga 100 dengan nilai bawaan 70. Jika perolehan nilai evaluasi Anda mencapai atau melampaui nilai kelulusan kursus tersebut, modul dinyatakan LULUS dan modul selanjutnya otomatis terbuka.',
    },
    {
      q: 'Berapa kali batas kesempatan mencoba kuis jika belum mencapai nilai lulus?',
      a: 'Setiap modul memiliki batas maksimal 3 kali percobaan kuis per pendaftaran. Jika belum lulus pada percobaan sebelumnya, Anda dapat mempelajari kembali materi sebelum mencoba lagi. Setelah lulus, kuis modul tersebut tidak dapat dikerjakan ulang.',
    },
    {
      q: 'Mengapa modul berikutnya masih terkunci dengan ikon gembok?',
      a: 'Kurikulum vokasi Pijar Aksara dirancang secara sekuensial (berurutan) demi menjamin fondasi keahlian yang kokoh. Anda wajib menyelesaikan membaca materi dan lulus kuis evaluasi pada modul sebelumnya sebelum modul berikutnya terbuka secara otomatis.',
    },
    {
      q: 'Kapan sertifikat kompetensi resmi diterbitkan?',
      a: 'Sertifikat kompetensi otomatis diterbitkan oleh sistem segera setelah Anda menuntaskan 100% modul dan seluruh kuis dinyatakan lulus. Anda dapat melihat, mengunduh file cetak PDF beresolusi tinggi, dan memverifikasi nomor registrasinya kapan saja.',
    },
    {
      q: 'Bagaimana cara mengakses sertifikat kelulusan saya?',
      a: 'Sertifikat kompetensi resmi bersifat privat dan dapat diakses eksklusif oleh peserta melalui menu Kursus Saya setelah menyelesaikan seluruh modul dan lulus kuis. Setiap sertifikat dilengkapi nomor registrasi unik berformat PA-TAHUN-NOMOR dan tanda tangan digital resmi.',
    },
    {
      q: 'Berapa lama batas waktu pembayaran setelah mendaftar kursus?',
      a: 'Setiap pendaftaran memiliki batas waktu pembayaran selama 24 jam. Jika melewati 24 jam belum diselesaikan, invoice otomatis kedaluwarsa untuk mengembalikan alokasi kuota kursi kepada calon peserta lainnya.',
    },
    {
      q: 'Apakah materi kursus yang sudah dibeli memiliki batas waktu kedaluwarsa akses?',
      a: 'Tidak ada batas waktu kedaluwarsa! Setelah status kursus aktif, Anda mendapatkan Akses Seumur Hidup (Lifetime Access) 24/7. Anda dapat kembali mempelajari materi, video, dan catatan modul kapan pun dibutuhkan.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-20 select-text">
      {/* =========================================================
          1. STICKY TOP TAB FILTER: Navigasi Cepat Aturan & Pedoman
         ========================================================= */}
      <nav className="sticky top-[57px] lg:top-0 z-30 w-full bg-white border-b border-slate-200 shadow-xs transition-all before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 sm:py-3 no-scrollbar text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'semua'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              Semua Pedoman
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('aturan_kuis')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'aturan_kuis'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Aturan Kuis &amp; Nilai</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alur_modul')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'alur_modul'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Lock size={14} />
              <span>Alur Modul Sekuensial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sertifikat')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'sertifikat'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Award size={14} />
              <span>Sertifikat &amp; QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pembayaran')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'pembayaran'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Clock size={14} />
              <span>Batas Bayar 24 Jam</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <HelpCircle size={14} />
              <span>FAQ Siswa</span>
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================
          2. HERO HEADER: Pedoman Akademik & Standar Vokasi
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50/50 border-b border-slate-200/80 pt-7 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-[11px] font-bold border border-[#843bab]/20 mb-2">
                <BookCheck size={13} className="text-[#843bab]" />
                <span>Pedoman Akademik &amp; Standar Kompetensi</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
                Aturan &amp; Pedoman Kursus Vokasi
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Panduan komprehensif standar penilaian kuis evaluasi, mekanisme modul bertingkat sekuensial, kebijakan alokasi pembayaran 24 jam, dan sertifikasi digital terverifikasi.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all"
              >
                <span>Dashboard Siswa</span>
              </Link>
              <Link
                href="/kursus-saya"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all"
              >
                <span>Kursus Saya</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. KONTEN PEDOMAN LENGKAP
         ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* =========================================================
            SECTION: ATURAN KUIS & NILAI
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'aturan_kuis') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Skala Penilaian &amp; Aturan Kuis Evaluasi
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Standar Kriteria Ketuntasan Minimal (KKM), skala predikat nilai, dan sistem remedial otomatis
                </p>
              </div>
            </div>

            {/* Penjelasan Passing Grade Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white">
                    Lulus Istimewa
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Skor &ge; 85%</span>
                </div>
                <h4 className="font-bold text-sm text-emerald-950 mb-1">
                  Sangat Memuaskan
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Menunjukkan pemahaman mendalam tanpa celah kesalahan. Modul tuntas dan modul berikutnya langsung terbuka.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#843bab] text-white">
                    Lulus Standar
                  </span>
                  <span className="text-xs font-bold text-[#843bab]">&ge; Nilai Lulus Kursus</span>
                </div>
                <h4 className="font-bold text-sm text-slate-950 mb-1">
                  Kompeten (Standar Vokasi)
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Mencapai KKM kursus (rentang 50–100, bawaan 70). Dinyatakan LULUS dan modul selanjutnya terbuka.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white">
                    Remedial
                  </span>
                  <span className="text-xs font-bold text-amber-800">&lt; Nilai Lulus Kursus</span>
                </div>
                <h4 className="font-bold text-sm text-slate-950 mb-1">
                  Belum Kompeten
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Perlu mengulang kuis. Disediakan kesempatan hingga 3 kali percobaan per modul untuk mencapai ketuntasan.
                </p>
              </div>
            </div>

            {/* Aturan 3 Kali Percobaan */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Info size={16} className="text-[#843bab]" />
                <span>Ketentuan Batas 3 Kali Percobaan &amp; Remedial</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#843bab] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span><strong>Percobaan Pertama:</strong> Uji pemahaman langsung setelah menyimak materi teori &amp; video tutorial.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#843bab] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span><strong>Percobaan Kedua (Remedial 1):</strong> Pelajari kembali catatan materi yang belum dikuasai sebelum mencoba kembali.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#843bab] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span><strong>Percobaan Ketiga (Remedial Terakhir):</strong> Batas kesempatan final untuk memenuhi syarat KKM modul.</span>
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION: ALUR PEMBELAJARAN SEKUENSIAL (BUKA KUNCI)
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'alur_modul') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Alur Pembelajaran Sekuensial &amp; Sistem Buka Kunci
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Setiap modul disusun bertingkat. Siswa tidak dapat melompati materi demi integritas pemahaman
                </p>
              </div>
            </div>

            {/* Diagram Alur 4 Langkah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#843bab] text-white flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Pelajari Materi Modul</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Baca artikel teori, panduan langkah demi langkah, dan tonton video tutorial instruktur hingga tuntas.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-bold text-[#843bab]">
                  Wajib Dibaca
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#843bab] text-white flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Buka Kuis Evaluasi</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setelah materi disimak, tombol kuis aktif. Masuki ruang kuis untuk menguji penguasaan konsep modul.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-bold text-[#843bab]">
                  Aktivasi Otomatis
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#843bab] text-white flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Lulus Kuis Modul</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Raih nilai kuis mencapai standar kelulusan kursus (standar bawaan 70). Tersedia maksimal 3 kali percobaan per modul.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-bold text-emerald-600">
                  Standar Kompetensi
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Modul Berikutnya Terbuka</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gembok modul selanjutnya terbuka secara instan. Lanjutkan penugasan belajar hingga modul terakhir!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200 text-[11px] font-bold text-[#843bab]">
                  Progres Bertambah
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-3 text-xs sm:text-sm">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Larangan Melompati Modul (Anti-Skip Policy):</strong> Sistem keamanan database Pijar Aksara mencegah akses langsung ke modul tingkat lanjut sebelum modul pendukungnya diselesaikan secara sah. Hal ini menjamin bahwa setiap lulusan benar-benar memiliki keterampilan vokasi yang utuh.
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION: SERTIFIKAT KOMPETENSI & VERIFIKASI QR
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'sertifikat') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <Award size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Standar Sertifikat Resmi &amp; Verifikasi Digital Anti-Pemalsuan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Sertifikat kompetensi resmi dengan nomor registrasi unik dan QR Code resmi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-[#843bab] shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Syarat Kelulusan 100%</h4>
                    <p className="mt-0.5">
                      Sertifikat resmi hanya terbit otomatis setelah <strong>seluruh modul</strong> dan <strong>seluruh kuis</strong> dalam silabus kursus lulus passing grade.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-[#843bab] shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Akses Privat Kursus Saya</h4>
                    <p className="mt-0.5">
                      Sertifikat resmi bersifat privat dan eksklusif bagi peserta yang bersangkutan. Akses sertifikat, nomor registrasi, dan QR code resmi tersedia langsung di menu Kursus Saya.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-[#843bab] shrink-0">
                    <Printer size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Cetak &amp; Unduh Bebas Seumur Hidup</h4>
                    <p className="mt-0.5">
                      Siswa dapat mengunduh dan mencetak sertifikat dalam format resolusi tinggi kapan saja dari halaman Sertifikat Saya tanpa biaya tambahan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mockup Preview Sertifikat */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border border-[#843bab]/30 shadow-xs space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Format Standar Institusi Vokasi</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  NOMOR REGISTRASI: PA-2026-0001
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-left space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sertifikat Kompetensi</div>
                  <div className="text-sm font-extrabold text-slate-900">Diberikan kepada: {userProfile.nama_lengkap}</div>
                  <div className="text-xs text-slate-600">Atas keberhasilan menuntaskan kurikulum vokasi praktis dengan predikat kompeten.</div>
                </div>
                <Link
                  href="/kursus-saya"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:underline"
                >
                  <span>Lihat di Halaman Kursus Saya</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION: BATAS WAKTU PEMBAYARAN & PEMBATALAN
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'pembayaran') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Batas Waktu Pembayaran (24 Jam) &amp; Kebijakan Akses
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Aturan alokasi kuota kursi, metode pembayaran resmi, dan ketentuan pembatalan pesanan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Clock size={16} className="text-amber-500" />
                  <span>Masa Kedaluwarsa 24 Jam</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah menekan tombol daftar, sistem mengunci kursi Anda selama 24 jam. Selesaikan pembayaran sebelum batas waktu berakhir agar pendaftaran tidak otomatis dibatalkan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Zap size={16} className="text-[#843bab]" />
                  <span>Metode Otomatis &amp; Manual</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dukungan pembayaran online instan via Mayar (QRIS, VA Bank) dan transfer manual bank BCA. Khusus transfer manual, admin memverifikasi bukti bayar dalam antrean operasional.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Akses Seumur Hidup (Lifetime)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah status pendaftaran aktif, Anda memiliki hak akses permanen ke seluruh materi bacaan, video instruktur, dan catatan modul tanpa biaya perpanjangan bulanan.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION: TANYA JAWAB UMUM (FAQ SISWA INTERAKTIF)
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'faq') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Tanya Jawab Umum &amp; Solusi Kendala Siswa (FAQ)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Jawaban cepat seputar pengerjaan modul, kuis evaluasi, kendala teknis, dan sertifikasi
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {faqList.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#843bab]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
