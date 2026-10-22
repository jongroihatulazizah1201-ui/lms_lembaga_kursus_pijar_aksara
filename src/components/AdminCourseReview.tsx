'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ubahStatusKursusAction, ubahKuotaKursusAction } from '@/app/admin/actions';
import { formatRupiah } from '@/components/CourseCard';
import CourseStatusBadge from '@/components/CourseStatusBadge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Lock,
  RotateCcw,
  BookOpen,
  Search,
  MessageSquare,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Users,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Question {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  kunci_jawaban: string;
}

interface Module {
  id: string;
  urutan: number;
  judul: string;
  isi_materi: string;
  durasi_menit: number;
  video_url: string | null;
  soal: Question[];
}

interface CourseItem {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  ringkasan: string;
  deskripsi: string;
  harga: number;
  kuota: number;
  nilai_lulus: number;
  status: string;
  catatan_tinjauan: string | null;
  diajukan_pada: string | null;
  diterbitkan_pada: string | null;
  instruktur: {
    nama_lengkap: string;
    email: string;
  };
  modul: Module[];
}

interface Props {
  courses: CourseItem[];
}

export default function AdminCourseReview({ courses }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Kembalikan ke Draf State (BR-02)
  const [returnModalCourse, setReturnModalCourse] = useState<CourseItem | null>(null);
  const [returnNote, setReturnNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  // Modal Ubah Kuota State (BR-06)
  const [quotaModalCourse, setQuotaModalCourse] = useState<CourseItem | null>(null);
  const [newQuotaInput, setNewQuotaInput] = useState<number>(0);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // Syllabus Preview State
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) => {
    const matchesStatus = filterStatus === 'semua' || c.status === filterStatus;
    const matchesSearch =
      c.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instruktur.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingReviewCount = courses.filter((c) => c.status === 'ditinjau').length;

  // Action: Terbitkan Kursus (ditinjau -> terbit, BR-02)
  const handleTerbitkan = async (course: CourseItem) => {
    if (!confirm(`Terbitkan kursus "${course.judul}" ke katalog publik LMS Pijar Aksara?`)) return;

    setLoadingId(course.id);
    setFeedbackMsg(null);
    const res = await ubahStatusKursusAction(course.id, 'terbit');
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Kursus "${course.judul}" berhasil diterbitkan ke katalog publik. Peserta kini dapat mendaftar!`
      });
      router.refresh();
    }
  };

  // Action: Tutup Kursus (terbit -> ditutup, BR-02)
  const handleTutup = async (course: CourseItem) => {
    if (!confirm(`Tutup kursus "${course.judul}"? Kursus akan disembunyikan dari katalog publik dan menolak pendaftaran baru. Peserta aktif tetap dapat belajar.`)) return;

    setLoadingId(course.id);
    setFeedbackMsg(null);
    const res = await ubahStatusKursusAction(course.id, 'ditutup');
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Kursus "${course.judul}" berhasil ditutup dari katalog publik.`
      });
      router.refresh();
    }
  };

  // Action: Buka Kembali Kursus (ditutup -> terbit, BR-02)
  const handleBukaKembali = async (course: CourseItem) => {
    if (!confirm(`Buka kembali kursus "${course.judul}" ke katalog publik?`)) return;

    setLoadingId(course.id);
    setFeedbackMsg(null);
    const res = await ubahStatusKursusAction(course.id, 'terbit');
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Kursus "${course.judul}" berhasil dibuka kembali di katalog publik!`
      });
      router.refresh();
    }
  };

  // Action: Simpan Kuota Kursus (BR-06)
  const handleSimpanKuota = async () => {
    if (!quotaModalCourse) return;

    if (isNaN(newQuotaInput) || newQuotaInput < 1 || newQuotaInput > 100) {
      setQuotaError('Kuota harus antara 1 sampai 100 peserta.');
      return;
    }

    setLoadingId(quotaModalCourse.id);
    setQuotaError(null);
    const res = await ubahKuotaKursusAction(quotaModalCourse.id, newQuotaInput);
    setLoadingId(null);

    if (res?.error) {
      setQuotaError(res.error);
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Kuota kursus "${quotaModalCourse.judul}" berhasil diubah menjadi ${newQuotaInput} kursi.`
      });
      setQuotaModalCourse(null);
      router.refresh();
    }
  };

  // Action: Submit Pengembalian ke Draf (ditinjau -> draf, BR-02)
  const handleConfirmReturn = async () => {
    if (!returnModalCourse) return;

    if (returnNote.trim().length < 10) {
      setNoteError('Catatan pengembalian wajib minimal 10 karakter sesuai ketentuan sistem.');
      return;
    }

    setLoadingId(returnModalCourse.id);
    setNoteError(null);
    const res = await ubahStatusKursusAction(returnModalCourse.id, 'draf', returnNote);
    setLoadingId(null);

    if (res?.error) {
      setNoteError(res.error);
    } else {
      setReturnModalCourse(null);
      setReturnNote('');
      setFeedbackMsg({
        type: 'success',
        text: `Kursus "${returnModalCourse.judul}" berhasil dikembalikan ke status draf dengan catatan revisi untuk instruktur.`
      });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-medium border shadow-sm transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* STICKY TOP HEADER: Judul Halaman & Toolbar Pencarian/Filter Kursus */}
      <div className="sticky top-[57px] lg:top-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-all">
        {/* Judul Halaman */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen size={18} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Tinjauan Kursus (Tombol Status)
              </h1>
              {pendingReviewCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#ffdf0f] text-slate-900 shadow-2xs animate-pulse">
                  {pendingReviewCount} Menunggu
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  {courses.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kursus, kategori, instruktur..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            />
          </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'ditinjau', label: 'Menunggu Tinjauan', count: pendingReviewCount },
            { id: 'terbit', label: 'Terbit' },
            { id: 'ditutup', label: 'Ditutup' },
            { id: 'draf', label: 'Draf' },
          ].map((item) => {
            const isActive = filterStatus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterStatus(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  isActive
                    ? 'bg-[#843bab] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#843bab]' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>

      {/* Course Review Cards List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
            <h4 className="text-base font-bold text-slate-800 mb-1">Tidak Ada Kursus Ditemukan</h4>
            <p className="text-xs text-slate-500">
              Tidak ada data kursus yang sesuai dengan kriteria filter status &ldquo;{filterStatus}&rdquo; atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          filteredCourses.map((c) => {
            const isPreviewOpen = previewCourseId === c.id;
            const totalModul = c.modul?.length || 0;
            let totalSoal = 0;
            c.modul?.forEach((m) => {
              totalSoal += m.soal?.length || 0;
            });

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Course Header & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#843bab] tracking-wider uppercase">
                        {c.kategori}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-600">
                        Instruktur: <strong className="text-slate-900">{c.instruktur.nama_lengkap}</strong>
                      </span>
                      <span className="text-xs text-slate-400">({c.instruktur.email})</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {c.judul}
                    </h3>

                    {/* Meta stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-1">
                      <span>
                        Harga: <strong className="text-slate-900">{c.harga === 0 ? 'Gratis' : formatRupiah(c.harga)}</strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span>
                        Kuota: <strong className="text-slate-900">{c.kuota} Kursi</strong>
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span>
                        {totalModul} Modul ({totalSoal} Butir Soal)
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span>
                        Passing Grade: <strong>{c.nilai_lulus}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <CourseStatusBadge status={c.status} size="md" />
                  </div>
                </div>

                {/* Catatan pengembalian sebelumnya jika ada */}
                {c.catatan_tinjauan && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
                      <RotateCcw size={14} className="text-amber-700 shrink-0" />
                      <span>Catatan Revisi Terakhir:</span>
                    </div>
                    <p className="italic pl-5 leading-relaxed">&ldquo;{c.catatan_tinjauan}&rdquo;</p>
                  </div>
                )}

                {/* Toolbar & Action Buttons (Strict BR-02) */}
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Button Preview Silabus */}
                  <button
                    type="button"
                    onClick={() => setPreviewCourseId(isPreviewOpen ? null : c.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors w-fit min-h-[40px]"
                  >
                    <BookOpen size={14} className="text-[#843bab]" />
                    <span>{isPreviewOpen ? 'Tutup Rincian Silabus' : `Periksa Silabus (${totalModul} Modul)`}</span>
                    {isPreviewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* BR-02 Role-based Transitions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Status: ditinjau -> Aksi Admin: Terbitkan ATAU Kembalikan ke Draf */}
                    {c.status === 'ditinjau' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setReturnModalCourse(c);
                            setReturnNote('');
                            setNoteError(null);
                          }}
                          disabled={loadingId === c.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors min-h-[44px]"
                        >
                          <RotateCcw size={14} />
                          <span>Kembalikan ke Draf</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTerbitkan(c)}
                          disabled={loadingId === c.id}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-colors min-h-[44px]"
                        >
                          <CheckCircle2 size={15} />
                          <span>Terbitkan Kursus</span>
                        </button>
                      </>
                    )}

                    {/* Status: terbit -> Aksi Admin: Ubah Kuota (BR-06) & Tutup Kursus */}
                    {c.status === 'terbit' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setQuotaModalCourse(c);
                            setNewQuotaInput(c.kuota);
                            setQuotaError(null);
                          }}
                          disabled={loadingId === c.id}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors min-h-[44px]"
                        >
                          <Users size={14} />
                          <span>Ubah Kuota</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTutup(c)}
                          disabled={loadingId === c.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors min-h-[44px]"
                        >
                          <Lock size={14} />
                          <span>Tutup Kursus</span>
                        </button>

                        {/* Indikator Aturan BR-02: Kursus Terbit Tidak Bisa Kembali ke Draf */}
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500"
                          title="Kursus terbit tidak bisa kembali ke draf."
                        >
                          <Info size={12} className="text-slate-400" />
                          <span>Tidak bisa kembali ke draf</span>
                        </div>
                      </>
                    )}

                    {/* Status: ditutup -> Aksi Admin: Buka Kembali Kursus (ditutup -> terbit, BR-02) */}
                    {c.status === 'ditutup' && (
                      <button
                        type="button"
                        onClick={() => handleBukaKembali(c)}
                        disabled={loadingId === c.id}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-colors min-h-[44px]"
                      >
                        <RotateCcw size={14} />
                        <span>Buka Kembali ke Katalog</span>
                      </button>
                    )}

                    {/* Status: draf -> Info (Hanya instruktur yang boleh mengajukan) */}
                    {c.status === 'draf' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Clock size={13} className="text-slate-400" />
                        <span>Menunggu instruktur pemilik mengajukan ke tahap tinjauan</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Silabus Detail Preview */}
                {isPreviewOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Rincian Modul & Bank Soal ({totalModul} Modul)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Pastikan seluruh modul dan kunci jawaban layak uji sebelum diterbitkan.
                      </span>
                    </div>

                    {c.modul.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada modul yang disusun dalam kursus ini.</p>
                    ) : (
                      <div className="space-y-3">
                        {c.modul.map((modul) => (
                          <div
                            key={modul.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="text-[#843bab]">
                                Modul {modul.urutan}: {modul.judul}
                              </span>
                              <span className="text-slate-500 font-normal">
                                Durasi: {modul.durasi_menit} Menit &bull; {modul.soal?.length || 0} Soal
                              </span>
                            </div>

                            <p className="text-slate-600 line-clamp-2 leading-relaxed">
                              {modul.isi_materi}
                            </p>

                            {/* Soal Preview */}
                            {modul.soal && modul.soal.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <div className="font-semibold text-slate-700 text-[11px]">
                                  Butir Soal Evaluasi:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {modul.soal.map((q) => (
                                    <div
                                      key={q.id}
                                      className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1"
                                    >
                                      <div className="font-medium text-slate-800">
                                        {q.urutan}. {q.pertanyaan}
                                      </div>
                                      <div className="text-slate-600 space-y-0.5 pl-2">
                                        <div className={q.kunci_jawaban === 'A' ? 'font-bold text-emerald-700' : ''}>
                                          A. {q.pilihan_a}
                                        </div>
                                        <div className={q.kunci_jawaban === 'B' ? 'font-bold text-emerald-700' : ''}>
                                          B. {q.pilihan_b}
                                        </div>
                                        <div className={q.kunci_jawaban === 'C' ? 'font-bold text-emerald-700' : ''}>
                                          C. {q.pilihan_c}
                                        </div>
                                        <div className={q.kunci_jawaban === 'D' ? 'font-bold text-emerald-700' : ''}>
                                          D. {q.pilihan_d}
                                        </div>
                                      </div>
                                      <div className="text-[10px] text-slate-400 pt-0.5">
                                        Kunci Jawaban: <strong className="text-emerald-700">{q.kunci_jawaban}</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Kembalikan ke Draf (BR-02: Catatan Minimal 10 Karakter) */}
      {returnModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <RotateCcw size={20} className="text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Kembalikan Kursus ke Draf</h4>
                <p className="text-xs text-slate-500">Ketentuan Tinjauan Kursus Pijar Aksara</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan mengembalikan kursus <strong className="text-slate-900">&ldquo;{returnModalCourse.judul}&rdquo;</strong> ke status <strong>Draf</strong> agar dapat direvisi oleh instruktur pemilik.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Catatan Tinjauan / Revisi (Wajib Minimal 10 Karakter):
              </label>
              <textarea
                rows={4}
                value={returnNote}
                onChange={(e) => {
                  setReturnNote(e.target.value);
                  if (noteError) setNoteError(null);
                }}
                placeholder="Contoh: Modul 2 materi pengantar terlalu singkat dan butir soal kuis pada modul 1 perlu diperbaiki pilihan gandanya."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
              />

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className={returnNote.trim().length >= 10 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {returnNote.trim().length >= 10 ? 'Syarat panjang catatan terpenuhi' : 'Minimal 10 karakter'}
                </span>
                <span className="text-slate-400">
                  {returnNote.trim().length} karakter
                </span>
              </div>

              {noteError && (
                <div className="text-xs text-red-600 flex items-center gap-1.5 pt-1">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{noteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturnModalCourse(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={loadingId === returnModalCourse.id || returnNote.trim().length < 10}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-colors min-h-[44px] ${
                  returnNote.trim().length >= 10
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {loadingId === returnModalCourse.id ? 'Memproses...' : 'Kembalikan ke Draf'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Kuota (BR-06) */}
      {quotaModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Users size={20} className="text-[#843bab]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Ubah Kuota Kursus</h4>
                <p className="text-xs text-slate-500">Ketentuan Kuota Kursus Pijar Aksara</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ubah kuota peserta untuk kursus terbit <strong className="text-slate-900">&ldquo;{quotaModalCourse.judul}&rdquo;</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <strong className="text-slate-800">Ketentuan Kuota:</strong> Kuota kursus terbit tidak boleh lebih kecil dari kursi terpakai (pendaftaran aktif, selesai, dan menunggu bayar).
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Jumlah Kuota Baru (1 - 100):
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={newQuotaInput}
                onChange={(e) => {
                  setNewQuotaInput(parseInt(e.target.value) || 0);
                  if (quotaError) setQuotaError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
              />
              {quotaError && (
                <div className="text-xs text-red-600 flex items-center gap-1.5 pt-1">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{quotaError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuotaModalCourse(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpanKuota}
                disabled={loadingId === quotaModalCourse.id}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm rounded-xl transition-colors min-h-[44px] cursor-pointer"
              >
                {loadingId === quotaModalCourse.id ? 'Menyimpan...' : 'Simpan Kuota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
