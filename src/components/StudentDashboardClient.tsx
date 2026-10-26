'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Target,
  Compass,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
  Lock,
  Unlock,
  Printer,
  ChevronDown,
  Search,
  Check,
  Flame,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { EnrollmentItem } from '@/components/MyCourseCard';

interface Props {
  initialCourses: EnrollmentItem[];
  userProfile: {
    nama_lengkap: string;
    email: string;
  };
}

type TabType =
  | 'semua'
  | 'skala_tugas'
  | 'aturan_kuis'
  | 'alur_modul'
  | 'sertifikat'
  | 'pembayaran'
  | 'faq';

export default function StudentDashboardClient({
  initialCourses,
  userProfile,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('semua');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filter kursus berdasarkan status
  const activeCourses = initialCourses.filter((c) => c.status === 'aktif');
  const completedCourses = initialCourses.filter((c) => c.status === 'selesai');
  const pendingCourses = initialCourses.filter((c) => c.status === 'menunggu_bayar');

  // Metrik Skala Penugasan Siswa
  const totalCourses = initialCourses.length;
  const activeCourseCount = activeCourses.length;
  const completedCourseCount = completedCourses.length;

  // Hitung total modul & kelulusan pada seluruh kursus aktif/selesai
  const accessibleCourses = initialCourses.filter(
    (c) => c.status === 'aktif' || c.status === 'selesai'
  );

  let totalTugasTerdaftar = 0;
  let totalTugasLulus = 0;
  let totalDurasiSemuaMenit = 0;
  let totalDurasiSelesaiMenit = 0;

  accessibleCourses.forEach((c) => {
    totalTugasTerdaftar += c.kursus.total_modul || 0;
    totalTugasLulus += c.modul_lulus || 0;
    totalDurasiSemuaMenit += c.kursus.total_durasi_menit || 0;
    totalDurasiSelesaiMenit += c.durasi_selesai_menit || 0;
  });

  const totalTugasPending = Math.max(0, totalTugasTerdaftar - totalTugasLulus);
  const skalaPersen =
    totalTugasTerdaftar > 0
      ? Math.round((totalTugasLulus / totalTugasTerdaftar) * 100)
      : 0;

  // Cari tugas/modul berikutnya yang aktif
  const currentActiveTaskCourse = activeCourses.find((c) => c.next_modul);
  const nextTask = currentActiveTaskCourse?.next_modul;

  // FAQ Items
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
          1. STICKY TOP TAB FILTER: Navigasi Cepat Panduan & Skala Belajar
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
              Semua Panduan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('skala_tugas')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'skala_tugas'
                  ? 'bg-[#843bab] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Compass size={14} />
              <span>Skala Penugasan</span>
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
          2. HERO HEADER: Dashboard Siswa & Pedoman Akademik
         ========================================================= */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50/50 border-b border-slate-200/80 pt-6 sm:pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Sapaan & Identitas */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-bold border border-[#843bab]/20 mb-2.5 shadow-2xs">
                <ShieldCheck size={13} className="text-[#843bab]" />
                <span>Pusat Kendali &amp; Pedoman Siswa</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight mb-2 leading-snug">
                Dashboard Siswa &amp; Aturan Belajar
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Halo, <span className="font-semibold text-slate-800">{userProfile.nama_lengkap}</span>! Pahami pedoman kelulusan, skala penilaian kuis berstandar industri, dan pantau skala pengerjaan penugasan belajar Anda secara real-time.
              </p>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/kursus-saya"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <GraduationCap size={16} />
                <span>Buka Kursus Saya</span>
              </Link>
              <Link
                href="/kursus"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all"
              >
                <BookOpen size={16} className="text-slate-500" />
                <span>Katalog Kursus</span>
              </Link>
            </div>
          </div>

          {/* =========================================================
              3. KARTU SKALA PENGERJAAN PENUGASAN SISWA (Real-Time Meter)
             ========================================================= */}
          {(activeTab === 'semua' || activeTab === 'skala_tugas') && (
            <div className="mt-8 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 shadow-2xs border border-purple-100">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Skala Pengerjaan Penugasan Siswa</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#843bab] border border-purple-200 uppercase tracking-wider">
                        Capaian Belajar
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Akumulasi progres penyelesaian materi dan kuis evaluasi pada seluruh kursus terdaftar
                    </p>
                  </div>
                </div>

                {/* Progress Summary Number */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">Total Kelulusan Modul</div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      <span className="text-emerald-600">{totalTugasLulus}</span> / {totalTugasTerdaftar} Modul
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-2xl text-base sm:text-lg font-black bg-gradient-to-r from-[#843bab] to-purple-600 text-white shadow-2xs">
                    {skalaPersen}%
                  </div>
                </div>
              </div>

              {/* Visual Meter Bar */}
              <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#843bab] via-purple-500 to-emerald-500 transition-all duration-700 shadow-2xs"
                  style={{ width: `${skalaPersen}%` }}
                />
              </div>

              {/* 4 Kartu Metrik Rinci */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-emerald-800 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Tugas Selesai</span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">
                      {totalTugasLulus} Modul
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700/80 font-medium mt-1">
                    Kuis lulus KKM kursus (&ge; nilai lulus)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-amber-800 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Belum Dikerjakan</span>
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-700">
                      {totalTugasPending} Modul
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-700/80 font-medium mt-1">
                    Perlu dipelajari / kuis
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-600 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Waktu Efektif</span>
                      <BookOpen size={16} className="text-slate-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-800">
                      {totalDurasiSelesaiMenit} Menit
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    Dari {totalDurasiSemuaMenit} menit materi
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[#843bab] mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Sertifikat Resmi</span>
                      <Award size={16} className="text-[#843bab]" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#843bab]">
                      {completedCourseCount} Diraih
                    </div>
                  </div>
                  <div className="text-[10px] text-[#843bab]/80 font-medium mt-1">
                    QR Code verifikasi aktif
                  </div>
                </div>
              </div>

              {/* Target Tugas Selanjutnya (Highlight Nudge) */}
              {currentActiveTaskCourse && nextTask && (
                <div className="mt-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50/40 border border-[#843bab]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#843bab] text-white shrink-0 mt-0.5 shadow-xs">
                      <Target size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          Target Tugas Selanjutnya Anda
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ffdf0f] text-slate-900 border border-amber-300">
                          Siap Dikerjakan
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                        Pada kursus <strong className="text-slate-900">{currentActiveTaskCourse.kursus.judul}</strong>: lanjutkan{' '}
                        <strong className="text-[#843bab]">
                          Modul {nextTask.urutan}: {nextTask.judul}
                        </strong>{' '}
                        ({nextTask.is_read ? 'Kuis Evaluasi Menunggu Dikerjakan' : 'Pelajari Materi & Video'}).
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/belajar/${currentActiveTaskCourse.kursus.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs whitespace-nowrap shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <span>Mulai Kerjakan Tugas</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          4. KONTEN UTAMA: ATURAN MAIN & PANDUAN LENGKAP
         ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* =========================================================
            SECTION: RINGKASAN ATURAN MAIN (ATURAN 1 SAMPAI 5)
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'aturan_kuis') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  1. Skala Penilaian &amp; Aturan Kuis Evaluasi
                </h3>
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
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                    Belum Lulus
                  </span>
                  <span className="text-xs font-bold text-amber-800">&lt; Nilai Lulus</span>
                </div>
                <h4 className="font-bold text-sm text-amber-950 mb-1">
                  Perlu Pengulangan (Maks. 3x)
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Siswa dapat mempelajari kembali materi dan mengulang kuis selama sisa kesempatan (maksimal 3 percobaan).
                </p>
              </div>
            </div>

            {/* Aturan Main Pengerjaan Kuis */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info size={16} className="text-[#843bab]" />
                <span>Ketentuan Penting Pengerjaan Kuis:</span>
              </h4>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Penilaian Aman di Server:</strong> Begitu tombol <em>&quot;Kirim Jawaban&quot;</em> ditekan, sistem server langsung menilai jawaban Anda. Kunci jawaban tidak pernah dikirim ke browser demi menjaga integritas evaluasi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Batas Maksimal 3 Percobaan:</strong> Setiap modul memiliki batas paling banyak 3 kali percobaan kuis per pendaftaran. Setelah lulus, modul tidak dapat dikerjakan ulang.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pengerjaan Mandiri:</strong> Kuis merupakan instrumen uji kompetensi resmi. Jawab seluruh soal secara mandiri untuk mengukur pemahaman nyata Anda.
                  </span>
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  2. Alur Pembelajaran Sekuensial &amp; Sistem Buka Kunci
                </h3>
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  3. Standar Sertifikat Resmi &amp; Verifikasi Digital Anti-Pemalsuan
                </h3>
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  4. Batas Waktu Pembayaran (24 Jam) &amp; Kebijakan Akses
                </h3>
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
                  Setelah menekan tombol daftar, Anda diberikan waktu 24 jam untuk menyelesaikan transaksi. Lewat dari 24 jam, pesanan dibatalkan otomatis demi menjaga kuota kursi kelas peserta lain.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Zap size={16} className="text-[#843bab]" />
                  <span>QRIS Mayar &amp; Transfer Bank</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mendukung QRIS Mayar otomatis (lunas dalam hitungan detik) dan Transfer Bank Manual (unggah bukti struk transfer). Akses kursus terbuka seketika pembayaran diverifikasi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Akses Seumur Hidup (Lifetime)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Begitu status pendaftaran aktif, Anda memiliki akses penuh ke materi, modul, catatan, dan kuis selama 24 jam sehari tanpa batas waktu kedaluwarsa.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-start gap-2.5">
              <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong>Kebijakan Pembatalan Mandiri:</strong> Anda dapat membatalkan pendaftaran secara mandiri selama status masih <em>&quot;Menunggu Pembayaran&quot;</em> melalui tombol <strong>Batalkan Pendaftaran</strong> di halaman Kursus Saya. Kursus yang sudah lunas tidak dapat dibatalkan.
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION: SKALA PENUGASAN SAYA (DAFTAR KURSUS SISWA)
           ========================================================= */}
        {(activeTab === 'semua' || activeTab === 'skala_tugas') && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    5. Daftar Kursus &amp; Rincian Skala Tugas Belajar
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Status kelulusan modul dan langkah belajar berikutnya pada masing-masing kursus Anda
                  </p>
                </div>
              </div>

              <Link
                href="/kursus-saya"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:underline"
              >
                <span>Kelola di Halaman Kursus Saya</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Jika ada kursus terdaftar */}
            {initialCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialCourses.map((c) => {
                  const courseProgress =
                    c.kursus.total_modul > 0
                      ? Math.round((c.modul_lulus / c.kursus.total_modul) * 100)
                      : 0;

                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              c.status === 'aktif'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'selesai'
                                ? 'bg-purple-50 text-[#843bab] border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {c.modul_lulus} / {c.kursus.total_modul} Modul Lulus
                          </span>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 line-clamp-1">
                          {c.kursus.judul}
                        </h4>
                        <div className="text-xs text-slate-500">
                          Instruktur: {c.kursus.instruktur_nama}
                        </div>

                        {/* Progress Bar Mini */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>Skala Modul Lulus</span>
                            <span className="font-bold text-slate-900">{courseProgress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#843bab] transition-all"
                              style={{ width: `${courseProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Callout Tugas Berikutnya */}
                        {c.status === 'aktif' && c.next_modul && (
                          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] text-slate-700 flex items-start gap-2">
                            <Target size={14} className="text-[#843bab] shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1 leading-snug">
                              <div className="font-bold text-slate-900 truncate">
                                Tugas Berikutnya: Modul {c.next_modul.urutan}
                              </div>
                              <div className="text-slate-600 truncate">{c.next_modul.judul}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tombol Aksi */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        {c.status === 'aktif' ? (
                          <Link
                            href={`/belajar/${c.kursus.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#843bab] hover:text-[#722f96]"
                          >
                            <span>Lanjut Belajar &amp; Kuis</span>
                            <ArrowRight size={13} />
                          </Link>
                        ) : c.status === 'selesai' ? (
                          <Link
                            href={`/sertifikat/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            <span>Lihat Sertifikat</span>
                            <Award size={13} />
                          </Link>
                        ) : (
                          <Link
                            href={`/kursus-saya/${c.id}/bayar`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                          >
                            <span>Selesaikan Pembayaran</span>
                            <ArrowRight size={13} />
                          </Link>
                        )}

                        <span className="text-[11px] text-slate-400">
                          {c.kursus.total_durasi_menit || 0} menit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State jika belum ada kursus */
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#843bab] flex items-center justify-center mx-auto">
                  <BookOpen size={24} />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Belum Ada Kursus yang Terdaftar
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Anda belum mendaftar kursus vokasi apa pun. Pilih kursus bersertifikat resmi yang sesuai dengan kebutuhan peningkatan keahlian Anda di katalog kursus kami.
                </p>
                <div className="pt-2">
                  <Link
                    href="/kursus"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all"
                  >
                    <span>Jelajahi Katalog Kursus Vokasi</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Tanya Jawab Umum &amp; Solusi Kendala Siswa (FAQ)
                </h3>
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
