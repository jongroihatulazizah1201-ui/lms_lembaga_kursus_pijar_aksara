'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ajukanKursusAction } from '@/app/instruktur/actions';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: string;
  urutan: number;
}

interface Module {
  id: string;
  urutan: number;
  judul: string;
  soal?: Question[];
}

interface CourseSubmitProps {
  courseId: string;
  courseTitle: string;
  currentStatus: string;
  reviewNotes: string | null;
  modules: Module[];
}

export default function InstructorCourseSubmitModal({
  courseId,
  courseTitle,
  currentStatus,
  reviewNotes,
  modules,
}: CourseSubmitProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validasi BR-03 & BR-02
  const sortedModules = [...(modules || [])].sort((a, b) => a.urutan - b.urutan);
  const totalModul = sortedModules.length;
  const isModulCountValid = totalModul >= 2 && totalModul <= 10;

  // Cek urutan 1..N tanpa celah
  let isSequenceValid = totalModul > 0;
  for (let i = 0; i < totalModul; i++) {
    if (sortedModules[i].urutan !== i + 1) {
      isSequenceValid = false;
      break;
    }
  }

  // Cek soal per modul 3..20
  const invalidModules = sortedModules.filter((m) => {
    const qCount = m.soal?.length || 0;
    return qCount < 3 || qCount > 20;
  });
  const isQuestionsValid = totalModul >= 2 && invalidModules.length === 0;

  const isEligibleToSubmit =
    currentStatus === 'draf' &&
    isModulCountValid &&
    isSequenceValid &&
    isQuestionsValid;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await ajukanKursusAction(courseId);
    setIsSubmitting(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Kursus berhasil diajukan untuk ditinjau oleh Admin lembaga.');
      setIsOpen(false);
      router.refresh();
    }
  };

  // Jika status bukan draf, tampilkan status informasi yang sesuai
  if (currentStatus !== 'draf') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm">
        <div className="flex items-center gap-2.5 text-slate-800 font-semibold mb-1">
          {currentStatus === 'ditinjau' ? (
            <>
              <Clock size={16} className="text-amber-600" />
              <span>Kursus Sedang Ditinjau Admin</span>
            </>
          ) : currentStatus === 'terbit' ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Kursus Telah Terbit di Katalog</span>
            </>
          ) : (
            <>
              <Lock size={16} className="text-red-600" />
              <span>Kursus Sedang Ditutup</span>
            </>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {currentStatus === 'ditinjau'
            ? 'Kursus telah diajukan ke tim pengelola. Sesuai BR-04, seluruh modul dan soal terkunci dari penyuntingan selama masa evaluasi.'
            : currentStatus === 'terbit'
            ? 'Kursus berstatus terbit dan aktif di katalog publik. Sesuai BR-02, kursus yang telah terbit tidak dapat dikembalikan ke draf.'
            : 'Kursus ditutup oleh admin. Pendaftaran baru dinonaktifkan.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Pengajuan Kursus (BR-02)</h3>
          <p className="text-xs text-slate-500">Ajukan kursus dari status draf ke ditinjau untuk diverifikasi admin.</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
          Status: Draf
        </span>
      </div>

      {/* Catatan Pengembalian Admin (Jika ada revisi sebelumnya) */}
      {reviewNotes && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
            <RotateCcw size={14} className="text-amber-700 shrink-0" />
            <span>Catatan Revisi dari Admin Pengelola:</span>
          </div>
          <p className="text-slate-700 italic pl-5 leading-relaxed">&ldquo;{reviewNotes}&rdquo;</p>
          <div className="mt-2 pl-5 text-[11px] text-amber-800">
            Pastikan Anda telah memperbaiki modul/soal sesuai catatan di atas sebelum mengajukan kembali.
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-800">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Checklist Kesiapan Pengajuan (BR-03) */}
      <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="font-semibold text-slate-800 flex items-center justify-between">
          <span>Syarat Kelayakan Pengajuan (BR-03):</span>
          <span className={isEligibleToSubmit ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
            {isEligibleToSubmit ? 'Siap Diajukan' : 'Belum Memenuhi'}
          </span>
        </div>

        <ul className="space-y-1.5 pt-1 text-slate-600">
          <li className="flex items-center gap-2">
            {isModulCountValid ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={14} className="text-red-500 shrink-0" />
            )}
            <span>
              Jumlah modul kursus: <strong>{totalModul}</strong> (Syarat: 2 s.d. 10 modul)
            </span>
          </li>

          <li className="flex items-center gap-2">
            {isSequenceValid ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={14} className="text-red-500 shrink-0" />
            )}
            <span>Urutan nomor modul terurut sempurna dari 1 hingga {totalModul || 1} tanpa celah</span>
          </li>

          <li className="flex items-start gap-2">
            {isQuestionsValid ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span>Setiap modul wajib memiliki 3 s.d. 20 butir soal kuis evaluasi</span>
              {invalidModules.length > 0 && (
                <div className="text-[11px] text-red-600 mt-0.5">
                  Modul belum lengkap: {invalidModules.map((m) => `Modul ${m.urutan} (${m.soal?.length || 0} soal)`).join(', ')}
                </div>
              )}
            </div>
          </li>
        </ul>
      </div>

      {/* Tombol Aksi Pengajuan */}
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={!isEligibleToSubmit || isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-colors min-h-[48px] ${
            isEligibleToSubmit
              ? 'bg-[#ffdf0f] text-slate-900 hover:bg-[#eacb0d] shadow-sm cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          <Send size={16} />
          <span>Ajukan Kursus untuk Ditinjau Admin</span>
        </button>

        {!isEligibleToSubmit && (
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Tombol pengajuan akan aktif secara otomatis setelah semua syarat modul dan soal kuis terpenuhi.
          </p>
        )}
      </div>

      {/* Modal Konfirmasi Pengajuan */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-full bg-[#ffdf0f]/30 flex items-center justify-center shrink-0">
                <Send size={20} className="text-slate-900" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Konfirmasi Pengajuan Kursus</h4>
                <p className="text-xs text-slate-500">Aturan Bisnis BR-02 & BR-04</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
              <p>
                Anda akan mengajukan kursus <strong>&ldquo;{courseTitle}&rdquo;</strong> ke tahap <strong>Ditinjau</strong>.
              </p>
              <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <Lock size={15} className="text-[#843bab] shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Perhatian:</strong> Sesuai aturan BR-04, setelah kursus diajukan, seluruh materi modul dan bank soal akan <strong>terkunci</strong> dan tidak dapat diedit selama masa peninjauan oleh admin lembaga.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-[#ffdf0f] text-slate-900 hover:bg-[#eacb0d] shadow-sm transition-colors min-h-[44px] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Ya, Ajukan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
