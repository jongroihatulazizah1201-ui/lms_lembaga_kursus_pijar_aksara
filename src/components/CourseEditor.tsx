'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateKursusAction,
  createModulAction,
  deleteModulAction,
  createSoalAction,
  deleteSoalAction,
} from '@/app/instruktur/actions';
import CourseStatusBadge from '@/components/CourseStatusBadge';
import InstructorCourseSubmitModal from '@/components/InstructorCourseSubmitModal';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Send,
  RotateCcw
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
  video_url: string | null;
  lampiran_path: string | null;
  durasi_menit: number;
  soal: Question[];
}

interface CourseData {
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
  modul: Module[];
}

interface Props {
  course: CourseData;
}

export default function CourseEditor({ course }: Props) {
  const router = useRouter();
  const isLocked = course.status !== 'draf';

  const [activeTab, setActiveTab] = useState<'modul' | 'info'>('modul');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // New Module Form State
  const [showAddModul, setShowAddModul] = useState(false);
  const [modulJudul, setModulJudul] = useState('');
  const [modulDurasi, setModulDurasi] = useState<number>(30);
  const [modulVideo, setModulVideo] = useState('');
  const [modulIsi, setModulIsi] = useState('');

  // New Question Form State per Module
  const [activeAddSoalModulId, setActiveAddSoalModulId] = useState<string | null>(null);
  const [soalPertanyaan, setSoalPertanyaan] = useState('');
  const [soalA, setSoalA] = useState('');
  const [soalB, setSoalB] = useState('');
  const [soalC, setSoalC] = useState('');
  const [soalD, setSoalD] = useState('');
  const [soalKunci, setSoalKunci] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Edit Course Info Form State
  const [editJudul, setEditJudul] = useState(course.judul);
  const [editKategori, setEditKategori] = useState(course.kategori);
  const [editRingkasan, setEditRingkasan] = useState(course.ringkasan || '');
  const [editDeskripsi, setEditDeskripsi] = useState(course.deskripsi || '');
  const [editHarga, setEditHarga] = useState<number>(course.harga);
  const [editKuota, setEditKuota] = useState<number>(course.kuota);
  const [editNilaiLulus, setEditNilaiLulus] = useState<number>(course.nilai_lulus);

  const sortedModules = [...(course.modul || [])].sort((a, b) => a.urutan - b.urutan);
  const totalModul = sortedModules.length;

  // 1. Tambah Modul Baru
  const handleAddModul = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const nextUrutan = totalModul + 1;
    setSubmittingAction(true);
    const res = await createModulAction({
      kursus_id: course.id,
      urutan: nextUrutan,
      judul: modulJudul,
      durasi_menit: modulDurasi,
      video_url: modulVideo || undefined,
      isi_materi: modulIsi,
    });
    setSubmittingAction(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setShowAddModul(false);
      setModulJudul('');
      setModulVideo('');
      setModulIsi('');
      setFeedbackMsg({ type: 'success', text: 'Modul baru berhasil ditambahkan.' });
      router.refresh();
    }
  };

  // 2. Hapus Modul
  const handleDeleteModul = async (modulId: string) => {
    if (isLocked) return;
    if (!confirm('Hapus modul ini beserta seluruh butir soal kuis di dalamnya?')) return;

    setSubmittingAction(true);
    const res = await deleteModulAction(modulId, course.id);
    setSubmittingAction(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({ type: 'success', text: 'Modul berhasil dihapus.' });
      router.refresh();
    }
  };

  // 3. Tambah Soal Kuis
  const handleAddSoal = async (modulId: string, currentSoalCount: number) => {
    if (isLocked) return;
    if (!soalPertanyaan.trim() || !soalA.trim() || !soalB.trim() || !soalC.trim() || !soalD.trim()) {
      alert('Pertanyaan dan seluruh opsi jawaban A, B, C, D wajib diisi.');
      return;
    }

    setSubmittingAction(true);
    const res = await createSoalAction({
      modul_id: modulId,
      kursus_id: course.id,
      urutan: currentSoalCount + 1,
      pertanyaan: soalPertanyaan,
      pilihan_a: soalA,
      pilihan_b: soalB,
      pilihan_c: soalC,
      pilihan_d: soalD,
      kunci_jawaban: soalKunci,
    });
    setSubmittingAction(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setActiveAddSoalModulId(null);
      setSoalPertanyaan('');
      setSoalA('');
      setSoalB('');
      setSoalC('');
      setSoalD('');
      setSoalKunci('A');
      setFeedbackMsg({ type: 'success', text: 'Butir soal kuis baru berhasil ditambahkan.' });
      router.refresh();
    }
  };

  // 4. Hapus Soal
  const handleDeleteSoal = async (soalId: string) => {
    if (isLocked) return;
    if (!confirm('Hapus butir soal kuis ini?')) return;

    setSubmittingAction(true);
    const res = await deleteSoalAction(soalId, course.id);
    setSubmittingAction(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({ type: 'success', text: 'Soal berhasil dihapus.' });
      router.refresh();
    }
  };

  // 5. Simpan Perubahan Info Dasar
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setSubmittingAction(true);
    const res = await updateKursusAction(course.id, {
      judul: editJudul,
      kategori: editKategori,
      ringkasan: editRingkasan,
      deskripsi: editDeskripsi,
      harga: editHarga,
      kuota: editKuota,
      nilai_lulus: editNilaiLulus,
    });
    setSubmittingAction(false);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({ type: 'success', text: 'Informasi dasar kursus berhasil diperbarui.' });
      router.refresh();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 text-slate-900">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/instruktur"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Kembali ke Dashboard Instruktur"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#843bab] uppercase tracking-wider">
                {course.kategori}
              </span>
              <CourseStatusBadge status={course.status} size="sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {course.judul}
            </h1>
          </div>
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 w-fit">
            <Lock size={14} className="text-[#843bab]" />
            <span>Konten Terkunci ({course.status}) &bull; BR-04</span>
          </div>
        )}
      </div>

      {/* Alert Notifikasi */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-2xl text-sm font-medium border shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* BR-02 Instruktur Course Submission Component */}
      <InstructorCourseSubmitModal
        courseId={course.id}
        courseTitle={course.judul}
        currentStatus={course.status}
        reviewNotes={course.catatan_tinjauan}
        modules={sortedModules}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('modul')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'modul'
              ? 'border-[#843bab] text-[#843bab]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Silabus & Bank Soal ({totalModul} Modul)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'border-[#843bab] text-[#843bab]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Informasi & Kuota Kursus
        </button>
      </div>

      {/* TAB 1: MODUL & BANK SOAL */}
      {activeTab === 'modul' && (
        <div className="space-y-6">
          {/* Header Action: Tambah Modul */}
          {!isLocked && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Modul Pembelajaran
              </h3>
              {!showAddModul && (
                <button
                  type="button"
                  onClick={() => setShowAddModul(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 shadow-sm transition-colors min-h-[40px] cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Tambah Modul {totalModul + 1}</span>
                </button>
              )}
            </div>
          )}

          {/* Form Tambah Modul Baru */}
          {showAddModul && !isLocked && (
            <form
              onSubmit={handleAddModul}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Tambah Modul {totalModul + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddModul(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Judul Modul *</label>
                    <input
                      type="text"
                      required
                      value={modulJudul}
                      onChange={(e) => setModulJudul(e.target.value)}
                      placeholder="Contoh: Pengenalan Aksara dan Kaidah Menulis"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Durasi (Menit)</label>
                    <input
                      type="number"
                      min={5}
                      value={modulDurasi}
                      onChange={(e) => setModulDurasi(parseInt(e.target.value || '30', 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">URL Video (Opsional)</label>
                  <input
                    type="url"
                    value={modulVideo}
                    onChange={(e) => setModulVideo(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Isi / Uraian Materi *</label>
                  <textarea
                    required
                    rows={5}
                    value={modulIsi}
                    onChange={(e) => setModulIsi(e.target.value)}
                    placeholder="Tuliskan materi pembelajaran lengkap yang wajib dibaca peserta (BR-08)..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModul(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 shadow-sm transition-colors min-h-[40px] cursor-pointer"
                >
                  {submittingAction ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          )}

          {/* Modules List */}
          {sortedModules.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Belum ada modul yang dibuat. Silakan tambahkan minimal 2 modul pembelajaran untuk memenuhi syarat pengajuan (BR-03).
            </div>
          ) : (
            sortedModules.map((modul) => {
              const soalList = modul.soal || [];
              const isAddSoalOpen = activeAddSoalModulId === modul.id;
              const hasMinQuestions = soalList.length >= 3 && soalList.length <= 20;

              return (
                <div
                  key={modul.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  {/* Module Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#843bab]">
                          Modul {modul.urutan}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-xs text-slate-500">
                          {modul.durasi_menit} Menit
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          hasMinQuestions ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {soalList.length} Soal (Syarat: 3-20)
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                        {modul.judul}
                      </h4>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteModul(modul.id)}
                        disabled={submittingAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors self-start sm:self-auto min-h-[36px]"
                        title="Hapus Modul"
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  {/* Isi Materi Preview */}
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="line-clamp-3">{modul.isi_materi}</p>
                  </div>

                  {/* Soal Kuis Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">
                        Bank Soal Kuis Evaluasi ({soalList.length})
                      </div>
                      {!isLocked && !isAddSoalOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddSoalModulId(modul.id);
                            setSoalPertanyaan('');
                            setSoalA('');
                            setSoalB('');
                            setSoalC('');
                            setSoalD('');
                            setSoalKunci('A');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#843bab] bg-[#843bab]/10 hover:bg-[#843bab]/20 transition-colors"
                        >
                          <Plus size={13} />
                          <span>Tambah Soal {soalList.length + 1}</span>
                        </button>
                      )}
                    </div>

                    {/* Form Tambah Soal */}
                    {isAddSoalOpen && !isLocked && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Tambah Butir Soal Nomor {soalList.length + 1}</span>
                          <button
                            type="button"
                            onClick={() => setActiveAddSoalModulId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            Batal
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700">Pertanyaan Soal *</label>
                          <textarea
                            rows={2}
                            value={soalPertanyaan}
                            onChange={(e) => setSoalPertanyaan(e.target.value)}
                            placeholder="Tuliskan pertanyaan evaluasi untuk modul ini..."
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-600">Pilihan A *</label>
                            <input
                              type="text"
                              value={soalA}
                              onChange={(e) => setSoalA(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#843bab]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-600">Pilihan B *</label>
                            <input
                              type="text"
                              value={soalB}
                              onChange={(e) => setSoalB(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#843bab]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-600">Pilihan C *</label>
                            <input
                              type="text"
                              value={soalC}
                              onChange={(e) => setSoalC(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#843bab]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-600">Pilihan D *</label>
                            <input
                              type="text"
                              value={soalD}
                              onChange={(e) => setSoalD(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#843bab]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">Kunci Jawaban:</span>
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSoalKunci(opt)}
                                className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                                  soalKunci === opt
                                    ? 'bg-[#ffdf0f] text-slate-900 shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddSoal(modul.id, soalList.length)}
                            disabled={submittingAction}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 shadow-sm transition-colors cursor-pointer"
                          >
                            {submittingAction ? 'Menyimpan...' : 'Simpan Soal'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Soal List Items */}
                    {soalList.length === 0 ? (
                      <div className="text-[11px] text-amber-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                        Modul ini belum memiliki butir soal kuis. Tambahkan minimal 3 soal agar memenuhi syarat pengajuan (BR-03).
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {soalList.map((q) => (
                          <div
                            key={q.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 relative group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-800">
                                {q.urutan}. {q.pertanyaan}
                              </span>
                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSoal(q.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                  title="Hapus Soal"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-0.5 pl-2">
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

                            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                              Kunci Jawaban: <strong className="text-emerald-700">{q.kunci_jawaban}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: INFORMASI & DETAIL KURSUS */}
      {activeTab === 'info' && (
        <form
          onSubmit={handleSaveInfo}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
        >
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Pengaturan Informasi Kursus
            </h3>
            <p className="text-xs text-slate-500">
              Perbarui rincian judul, kategori, deskripsi, harga, dan passing grade kelulusan kursus.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Judul Kursus *</label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={editJudul}
                onChange={(e) => setEditJudul(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Kategori Kursus *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={editKategori}
                  onChange={(e) => setEditKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Nilai Passing Grade (%) *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  disabled={isLocked}
                  value={editNilaiLulus}
                  onChange={(e) => setEditNilaiLulus(parseInt(e.target.value || '70', 10))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Harga Kursus (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  disabled={isLocked}
                  value={editHarga}
                  onChange={(e) => setEditHarga(parseInt(e.target.value || '0', 10))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">0 untuk gratis, atau Rp50.000 s/d Rp5.000.000 (BR-03)</span>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Kuota Peserta *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  disabled={isLocked}
                  value={editKuota}
                  onChange={(e) => setEditKuota(parseInt(e.target.value || '20', 10))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">1 s/d 100 peserta (BR-03)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Ringkasan Singkat</label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={editRingkasan}
                onChange={(e) => setEditRingkasan(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Deskripsi Lengkap Kursus</label>
              <textarea
                rows={5}
                disabled={isLocked}
                value={editDeskripsi}
                onChange={(e) => setEditDeskripsi(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-y"
              />
            </div>
          </div>

          {!isLocked && (
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={submittingAction}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 shadow-sm transition-colors min-h-[44px] cursor-pointer"
              >
                {submittingAction ? 'Menyimpan...' : 'Simpan Perubahan Informasi'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
