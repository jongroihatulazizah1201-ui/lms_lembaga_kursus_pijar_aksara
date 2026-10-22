'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tandaiMateriDibacaAction, getSignedPdfUrlAction } from '@/app/belajar/actions';
import { getSoalKuisAction, submitKuisAction } from '@/app/belajar/kuis-actions';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Clock,
  FileText,
  Video,
  Download,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  Check,
  ChevronRight,
  Printer,
  XCircle,
  GraduationCap,
} from 'lucide-react';

export interface ModulItem {
  pendaftaran_id: string;
  kursus_id: string;
  kursus_judul: string;
  kursus_slug: string;
  modul_id: string;
  urutan: number;
  judul: string;
  durasi_menit: number;
  video_url: string | null;
  lampiran_path: string | null;
  isi_materi: string | null;
  status_akses: 'terbuka' | 'lulus' | 'terkunci';
  materi_dibaca_pada: string | null;
  lulus_pada: string | null;
}

export interface QuizAttemptItem {
  id: string;
  modul_id: string;
  nomor_percobaan: number;
  nilai: number;
  lulus: boolean;
  dibuat_pada: string;
}

interface QuestionItem {
  id: string;
  modul_id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
}

interface Props {
  kursusSlug: string;
  kursusJudul: string;
  pendaftaranId: string;
  modules: ModulItem[];
  quizAttempts: QuizAttemptItem[];
  certificate?: {
    id: string;
    nomor_sertifikat: string;
  } | null;
  initialUrutan?: number;
}

export default function LearningRoom({
  kursusSlug,
  kursusJudul,
  pendaftaranId,
  modules,
  quizAttempts: initialAttempts,
  certificate,
  initialUrutan,
}: Props) {
  const router = useRouter();

  // Tentukan modul aktif default: modul pertama yang 'terbuka', atau modul 1
  const defaultModul = modules.find((m) => m.status_akses === 'terbuka') || modules[0];
  const [activeUrutan, setActiveUrutan] = useState<number>(initialUrutan || defaultModul?.urutan || 1);

  // Tab aktif: 'materi' (Materi Bacaan & Video) atau 'kuis' (Kuis Evaluasi)
  const [activeTab, setActiveTab] = useState<'materi' | 'kuis'>('materi');

  // State Aksi Materi & PDF
  const [loadingRead, setLoadingRead] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State Kuis
  const [questionsCache, setQuestionsCache] = useState<Record<string, QuestionItem[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [latestQuizResult, setLatestQuizResult] = useState<{
    nomor_percobaan: number;
    jumlah_soal: number;
    jumlah_benar: number;
    nilai: number;
    nilai_lulus: number;
    lulus: boolean;
    sisa_percobaan: number;
    semua_modul_selesai: boolean;
  } | null>(null);

  // Modul aktif saat ini
  const activeModule = modules.find((m) => m.urutan === activeUrutan) || modules[0];
  const isLocked = activeModule?.status_akses === 'terkunci';
  const isPassed = activeModule?.status_akses === 'lulus';
  const isRead = !!activeModule?.materi_dibaca_pada;

  // Riwayat percobaan kuis modul aktif
  const moduleAttempts = initialAttempts.filter((a) => a.modul_id === activeModule?.modul_id);
  const totalAttemptsMade = moduleAttempts.length;
  const highestScore = moduleAttempts.length > 0 ? Math.max(...moduleAttempts.map((a) => a.nilai)) : null;
  const sisaPercobaan = Math.max(0, 3 - totalAttemptsMade);

  // Ringkasan progres kursus
  const totalLulus = modules.filter((m) => m.status_akses === 'lulus').length;
  const progressPercent = Math.min(100, Math.round((totalLulus / modules.length) * 100));

  // Ambil soal kuis ketika user berpindah ke tab 'kuis'
  useEffect(() => {
    if (activeTab === 'kuis' && activeModule && !isLocked) {
      const modulId = activeModule.modul_id;
      if (!questionsCache[modulId]) {
        setLoadingQuestions(true);
        setQuizError(null);
        getSoalKuisAction(modulId).then((res) => {
          setLoadingQuestions(false);
          if (res?.error) {
            setQuizError(res.error);
          } else if (res?.soal) {
            setQuestionsCache((prev) => ({
              ...prev,
              [modulId]: res.soal,
            }));
          }
        });
      }
    }
  }, [activeTab, activeModule, isLocked, questionsCache]);

  // Handle pilih modul dari sidebar
  const handleSelectModule = (urutan: number) => {
    const target = modules.find((m) => m.urutan === urutan);
    if (target?.status_akses === 'terkunci') {
      setFeedbackMsg({
        type: 'error',
        text: `Modul ${urutan} masih terkunci. Anda harus menyelesaikan dan lulus kuis pada modul sebelumnya terlebih dahulu.`,
      });
      return;
    }
    setActiveUrutan(urutan);
    setActiveTab('materi');
    setFeedbackMsg(null);
    setQuizError(null);
    setLatestQuizResult(null);
    setAnswers({});
  };

  // Handle Tandai Materi Sudah Dibaca (BR-08)
  const handleMarkAsRead = async () => {
    if (!activeModule) return;
    setLoadingRead(true);
    setFeedbackMsg(null);

    const res = await tandaiMateriDibacaAction(pendaftaranId, activeModule.modul_id, kursusSlug);
    setLoadingRead(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: 'Materi berhasil ditandai sudah dibaca! Akses kuis untuk modul ini sekarang telah terbuka.',
      });
      router.refresh();
    }
  };

  // Handle Unduh Dokumen PDF (Signed URL 60 menit)
  const handleDownloadPdf = async () => {
    if (!activeModule?.lampiran_path) return;
    setDownloadingPdf(true);

    const res = await getSignedPdfUrlAction(activeModule.lampiran_path);
    setDownloadingPdf(false);

    if (res?.success && res.signedUrl) {
      window.open(res.signedUrl, '_blank');
    } else {
      alert('Gagal mengambil tautan unduh dokumen PDF.');
    }
  };

  // Handle Pilih Opsi Jawaban Kuis
  const handleSelectOption = (soalId: string, choice: string) => {
    setAnswers((prev) => ({
      ...prev,
      [soalId]: choice,
    }));
    setQuizError(null);
  };

  // Handle Submit Kuis
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError(null);

    const currentQuestions = questionsCache[activeModule.modul_id] || [];
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < currentQuestions.length) {
      setQuizError(`Harap jawab seluruh ${currentQuestions.length} soal kuis sebelum mengirimkan jawaban.`);
      return;
    }

    setSubmittingQuiz(true);
    const res = await submitKuisAction(pendaftaranId, activeModule.modul_id, answers, kursusSlug);
    setSubmittingQuiz(false);

    if (res?.error) {
      setQuizError(res.error);
    } else if (res?.hasil) {
      setLatestQuizResult(res.hasil);
      router.refresh();
    }
  };

  // Helper Embed YouTube
  const getEmbedVideoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  const embedUrl = getEmbedVideoUrl(activeModule?.video_url);
  const activeQuestions = questionsCache[activeModule?.modul_id] || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* =========================================================
          1. TOP STICKY APP BAR: Navigasi, Judul Kursus & Progres
         ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Bagian Kiri: Tombol Navigasi Kembali & Identitas Kursus */}
            <div className="flex items-center gap-3.5 min-w-0">
              <Link
                href="/kursus-saya"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition-all shrink-0 shadow-2xs"
                title="Kembali ke Kursus Saya"
              >
                <ArrowLeft size={16} />
                <span>Kursus Saya</span>
              </Link>

              <div className="hidden sm:block h-8 w-px bg-slate-200 shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#843bab] uppercase tracking-wider">
                    <GraduationCap size={13} />
                    Ruang Belajar Vokasi
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {kursusJudul}
                </h1>
              </div>
            </div>

            {/* Bagian Kanan: Kapsul Ringkasan Progres yang Proporsional & Rapi */}
            <div className="flex items-center gap-3.5 sm:gap-4 shrink-0 self-end md:self-auto bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">
                  {totalLulus} dari {modules.length} Modul Lulus
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Progres: <span className="text-[#843bab] font-bold">{progressPercent}%</span> Selesai
                </div>
              </div>

              {/* Progress Bar dengan lebar nyaman */}
              <div className="w-24 sm:w-36 h-2.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-[#843bab] to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {certificate?.id && (
                <Link
                  href={`/sertifikat/${pendaftaranId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all shrink-0 ml-1"
                >
                  <Award size={14} />
                  <span className="hidden sm:inline">Sertifikat</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. MAIN WORKSPACE: Sidebar (Daftar Modul) + Main Reader
         ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================
              KOLOM KIRI (SIDEBAR): DAFTAR MODUL (TERKUNCI / TERBUKA)
             ========================================================= */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={16} className="text-[#843bab]" />
                  <span>Daftar Modul</span>
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#843bab] border border-purple-200">
                  {totalLulus}/{modules.length} Lulus
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Modul terbuka berurutan. Selesaikan materi &amp; kuis untuk membuka modul berikutnya.
              </p>

              {/* List of Modules */}
              <div className="space-y-2">
                {modules.map((m) => {
                  const isActive = m.urutan === activeUrutan;
                  const mLocked = m.status_akses === 'terkunci';
                  const mPassed = m.status_akses === 'lulus';

                  // Ambil riwayat percobaan untuk modul ini
                  const attemptsForModul = initialAttempts.filter((a) => a.modul_id === m.modul_id);
                  const maxScore = attemptsForModul.length > 0 ? Math.max(...attemptsForModul.map((a) => a.nilai)) : null;

                  return (
                    <button
                      key={m.modul_id}
                      type="button"
                      onClick={() => handleSelectModule(m.urutan)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-purple-50/70 border-[#843bab] ring-1 ring-[#843bab]/30 shadow-xs'
                          : mLocked
                          ? 'bg-slate-50/60 border-slate-200/60 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Number badge / status icon */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            mPassed
                              ? 'bg-emerald-500 text-white'
                              : isActive
                              ? 'bg-[#843bab] text-white'
                              : mLocked
                              ? 'bg-slate-200 text-slate-400'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {mPassed ? <Check size={14} strokeWidth={3} /> : mLocked ? <Lock size={12} /> : m.urutan}
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`text-xs font-bold line-clamp-2 leading-snug ${
                              isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                            }`}
                          >
                            Modul {m.urutan}: {m.judul}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {m.durasi_menit} mnt
                            </span>
                            {mPassed && maxScore !== null && (
                              <span className="text-emerald-700 font-bold">
                                Nilai: {maxScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right indicator badge */}
                      <div className="shrink-0">
                        {mPassed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Lulus
                          </span>
                        ) : mLocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            Terkunci
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#843bab] border border-purple-200">
                            Aktif
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* =========================================================
              KOLOM KANAN (MAIN CONTENT): TAB MATERI & TAB KUIS
             ========================================================= */}
          <main className="lg:col-span-8 space-y-6">
            {/* Feedback Alert Banner */}
            {feedbackMsg && (
              <div
                className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-2xs ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {feedbackMsg.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMsg(null)}
                  className="text-xs font-bold hover:underline shrink-0 ml-3"
                >
                  Tutup
                </button>
              </div>
            )}

            {isLocked ? (
              /* =========================================================
                  KONTEN TERKUNCI
                 ========================================================= */
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Modul {activeModule.urutan} Masih Terkunci
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Sesuai aturan kurikulum vokasi berstandar industri, modul ini akan terbuka otomatis setelah Anda lulus kuis pada Modul {activeModule.urutan - 1}.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectModule(activeModule.urutan - 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Modul {activeModule.urutan - 1}</span>
                </button>
              </div>
            ) : (
              /* =========================================================
                  KONTEN TERBUKA / AKTIF (TAB MATERI & TAB KUIS)
                 ========================================================= */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Header Modul & Switcher Tab */}
                <div className="p-6 sm:p-8 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-md bg-[#843bab]/10 text-[#843bab] border border-[#843bab]/20">
                      Modul {activeModule.urutan}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Modul Telah Lulus
                        </span>
                      ) : isRead ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
                          <CheckCircle2 size={13} className="text-[#843bab]" />
                          Materi Telah Dibaca
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
                          Belum Ditandai Dibaca
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-4">
                    {activeModule.judul}
                  </h2>

                  {/* Navigasi Tab: 1. Materi & Video | 2. Kuis Evaluasi */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('materi')}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'materi'
                          ? 'bg-[#843bab] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                      }`}
                    >
                      <BookOpen size={16} />
                      <span>Materi &amp; Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('kuis')}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'kuis'
                          ? 'bg-[#843bab] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                      }`}
                    >
                      <Award size={16} />
                      <span>Kuis Evaluasi Modul</span>
                      {isPassed && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* =========================================================
                    TAB 1: MATERI, VIDEO & LAMPIRAN PDF
                   ========================================================= */}
                {activeTab === 'materi' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    {/* 1. Video Pembelajaran (Jika Tersedia) */}
                    {embedUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <Video size={15} className="text-[#843bab]" />
                          <span>Video Pembelajaran</span>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-video">
                          <iframe
                            src={embedUrl}
                            title={activeModule.judul}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full border-0"
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Isi Materi Teks */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <BookOpen size={15} className="text-[#843bab]" />
                        <span>Isi Materi Pelatihan</span>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {activeModule.isi_materi || 'Materi sedang disiapkan oleh instruktur.'}
                      </div>
                    </div>

                    {/* 3. Lampiran Dokumen PDF (Jika Tersedia) */}
                    {activeModule.lampiran_path && (
                      <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Bahan Bacaan &amp; Dokumen Modul (PDF)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Tautan unduh aman bertenggat waktu 60 menit.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={downloadingPdf}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {downloadingPdf ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Mengambil Tautan...</span>
                            </>
                          ) : (
                            <>
                              <Download size={15} />
                              <span>Unduh Dokumen PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* 4. Tombol "Tandai Materi Sudah Dibaca" & Navigasi Kuis */}
                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {isPassed
                            ? 'Evaluasi Modul Selesai'
                            : isRead
                            ? 'Materi Sudah Selesai Dibaca'
                            : 'Langkah Lanjutan: Evaluasi Kuis'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isPassed
                            ? 'Anda telah lulus kuis modul ini. Silakan lanjut ke modul berikutnya.'
                            : isRead
                            ? 'Materi telah ditandai dibaca. Anda dapat langsung membuka kuis modul.'
                            : 'Wajib menandai materi sudah dibaca untuk membuka akses pengerjaan kuis.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {!isRead && !isPassed ? (
                          <button
                            type="button"
                            onClick={handleMarkAsRead}
                            disabled={loadingRead}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                          >
                            {loadingRead ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Menandai...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Tandai Materi Sudah Dibaca</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('kuis')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                          >
                            <Award size={16} />
                            <span>{isPassed ? 'Buka Hasil Kuis' : 'Mulai Pengerjaan Kuis'}</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 2: KUIS, NILAI & SISA PERCOBAAN
                   ========================================================= */}
                {activeTab === 'kuis' && (
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Ringkasan Nilai & Sisa Percobaan Header */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Evaluasi Pemahaman
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          Kuis Objektif Modul {activeModule.urutan}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Passing grade minimal: <strong className="text-slate-800">70 poin</strong>. Maksimal 3 kali percobaan.
                        </p>
                      </div>

                      {/* Info Nilai & Sisa Percobaan Pill */}
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                          <div className="text-xs text-slate-500 font-medium">Nilai Terbaik</div>
                          <div className="text-base font-black text-slate-900">
                            {highestScore !== null ? `${highestScore}/100` : '-'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                          <div className="text-xs text-slate-500 font-medium">Sisa Percobaan</div>
                          <div
                            className={`text-base font-black ${
                              sisaPercobaan === 0
                                ? 'text-red-600'
                                : sisaPercobaan === 1
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {sisaPercobaan}x
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Jika Materi Belum Dibaca */}
                    {!isRead && !isPassed ? (
                      <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                          <Lock size={22} />
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          Kuis Masih Terkunci
                        </h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto">
                          Anda wajib membaca materi dan menekan tombol &quot;Tandai Materi Sudah Dibaca&quot; di tab Materi terlebih dahulu.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('materi')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#843bab] text-white text-xs font-bold"
                        >
                          <BookOpen size={14} />
                          <span>Buka Tab Materi &amp; Video</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Riwayat Hasil Submit Terbaru (Nilai & Status Lulus) */}
                        {latestQuizResult && (
                          <div
                            className={`p-6 rounded-2xl border space-y-3 shadow-xs ${
                              latestQuizResult.lulus
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-red-50 border-red-200 text-red-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {latestQuizResult.lulus ? (
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                  <Award size={20} />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                                  <XCircle size={20} />
                                </div>
                              )}
                              <div>
                                <h4 className="text-base font-black">
                                  {latestQuizResult.lulus
                                    ? 'Selamat! Anda Berhasil Lulus Kuis Modul Ini'
                                    : 'Belum Mencapai Nilai Minimal Kelulusan'}
                                </h4>
                                <p className="text-xs opacity-90">
                                  {latestQuizResult.lulus
                                    ? 'Nilai Anda memenuhi standar industri (passing grade 70).'
                                    : `Nilai Anda adalah ${latestQuizResult.nilai}. Silakan ulangi kuis setelah mempelajari materi.`}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                              <div className="p-2.5 rounded-lg bg-white/80 border border-current/20 text-center">
                                <div className="text-[11px] opacity-75 font-medium">Nilai Anda</div>
                                <div className="text-lg font-black">{latestQuizResult.nilai}</div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/80 border border-current/20 text-center">
                                <div className="text-[11px] opacity-75 font-medium">Soal Benar</div>
                                <div className="text-lg font-black">
                                  {latestQuizResult.jumlah_benar}/{latestQuizResult.jumlah_soal}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/80 border border-current/20 text-center">
                                <div className="text-[11px] opacity-75 font-medium">Percobaan Ke-</div>
                                <div className="text-lg font-black">{latestQuizResult.nomor_percobaan}</div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/80 border border-current/20 text-center">
                                <div className="text-[11px] opacity-75 font-medium">Sisa Percobaan</div>
                                <div className="text-lg font-black">{latestQuizResult.sisa_percobaan}x</div>
                              </div>
                            </div>

                            {/* Tombol Aksi Hasil */}
                            <div className="pt-3 flex items-center gap-3 flex-wrap">
                              {latestQuizResult.semua_modul_selesai ? (
                                <Link
                                  href={`/sertifikat/${pendaftaranId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                                >
                                  <Award size={15} />
                                  <span>Semua Modul Lulus! Buka Sertifikat</span>
                                  <Printer size={14} />
                                </Link>
                              ) : latestQuizResult.lulus && activeModule.urutan < modules.length ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectModule(activeModule.urutan + 1)}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                                >
                                  <span>Lanjut ke Modul {activeModule.urutan + 1}</span>
                                  <ArrowRight size={15} />
                                </button>
                              ) : null}

                              {!latestQuizResult.lulus && latestQuizResult.sisa_percobaan > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLatestQuizResult(null);
                                    setAnswers({});
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                                >
                                  <RotateCcw size={14} />
                                  <span>Coba Kuis Lagi</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Loading Soal */}
                        {loadingQuestions && (
                          <div className="p-12 text-center text-slate-500 space-y-3">
                            <Loader2 size={24} className="animate-spin text-[#843bab] mx-auto" />
                            <p className="text-xs">Memuat daftar soal kuis modul...</p>
                          </div>
                        )}

                        {/* Error Memuat Kuis */}
                        {quizError && (
                          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{quizError}</span>
                          </div>
                        )}

                        {/* Daftar Soal Kuis */}
                        {!loadingQuestions && activeQuestions.length > 0 && (!latestQuizResult || !latestQuizResult.lulus) && (
                          <form onSubmit={handleSubmitQuiz} className="space-y-6 pt-2">
                            {/* Batas Percobaan Tercapai Warning */}
                            {sisaPercobaan === 0 && !isPassed ? (
                              <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
                                <div className="font-bold text-sm flex items-center gap-2">
                                  <AlertCircle size={16} />
                                  <span>Batas Maksimal 3 Percobaan Tercapai</span>
                                </div>
                                <p className="text-xs leading-relaxed text-red-800">
                                  Anda telah menggunakan seluruh 3 kesempatan pengerjaan kuis pada modul ini. Hubungi instruktur atau tim Pijar Aksara jika Anda membutuhkan bimbingan materi lebih lanjut.
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-6">
                                  {activeQuestions.map((q, idx) => {
                                    const selectedChoice = answers[q.id];

                                    return (
                                      <div
                                        key={q.id}
                                        className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="w-6 h-6 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                          </div>
                                          <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                                            {q.pertanyaan}
                                          </p>
                                        </div>

                                        {/* Pilihan Jawaban A, B, C, D */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                          {(['A', 'B', 'C', 'D'] as const).map((choice) => {
                                            const choiceKey = `pilihan_${choice.toLowerCase()}` as keyof QuestionItem;
                                            const choiceText = q[choiceKey] as string;
                                            const isSelected = selectedChoice === choice;

                                            return (
                                              <button
                                                key={choice}
                                                type="button"
                                                onClick={() => handleSelectOption(q.id, choice)}
                                                className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                                                  isSelected
                                                    ? 'bg-purple-50/80 border-[#843bab] text-[#843bab] ring-1 ring-[#843bab] font-bold shadow-2xs'
                                                    : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                                                }`}
                                              >
                                                <div
                                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    isSelected
                                                      ? 'bg-[#843bab] text-white'
                                                      : 'bg-slate-200 text-slate-600'
                                                  }`}
                                                >
                                                  {choice}
                                                </div>
                                                <span className="leading-snug">{choiceText}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Submit Quiz Footer Bar */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="text-xs text-slate-600">
                                    Terjawab:{' '}
                                    <strong className="text-slate-900">
                                      {Object.keys(answers).length} dari {activeQuestions.length} soal
                                    </strong>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={submittingQuiz || Object.keys(answers).length < activeQuestions.length}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                                  >
                                    {submittingQuiz ? (
                                      <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Menilai Kuis Otomatis...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 size={16} />
                                        <span>Kirim &amp; Nilai Jawaban Kuis</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            )}
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
