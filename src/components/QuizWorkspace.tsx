'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitKuisAction } from '@/app/belajar/kuis-actions';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Lock
} from 'lucide-react';

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
  modulId: string;
  modulUrutan: number;
  modulJudul: string;
  nilaiLulus: number;
  totalModul: number;
  riwayatPercobaanCount: number;
  alreadyPassed: boolean;
  questions: QuestionItem[];
}

export default function QuizWorkspace({
  kursusSlug,
  kursusJudul,
  pendaftaranId,
  modulId,
  modulUrutan,
  modulJudul,
  nilaiLulus,
  totalModul,
  riwayatPercobaanCount,
  alreadyPassed,
  questions,
}: Props) {
  const router = useRouter();

  // State jawaban peserta { [soal_id]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State hasil kuis setelah dinilai oleh server
  const [resultData, setResultData] = useState<{
    nomor_percobaan: number;
    jumlah_soal: number;
    jumlah_benar: number;
    nilai: number;
    nilai_lulus: number;
    lulus: boolean;
    sisa_percobaan: number;
    semua_modul_selesai: boolean;
  } | null>(null);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const currentAttemptNumber = riwayatPercobaanCount + 1;
  const isAttemptLimitReached = riwayatPercobaanCount >= 3;

  const handleSelectOption = (soalId: string, choice: string) => {
    setAnswers(prev => ({
      ...prev,
      [soalId]: choice,
    }));
    setErrorMsg(null);
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // BR-09: Semua soal wajib dijawab
    if (!isAllAnswered) {
      setErrorMsg(`Semua soal wajib dijawab. Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal.`);
      return;
    }

    setSubmitting(true);
    const res = await submitKuisAction(pendaftaranId, modulId, answers, kursusSlug);
    setSubmitting(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.hasil) {
      setResultData(res.hasil);
    }
  };

  // 1. Tampilan jika modul ini sudah lulus sebelumnya (BR-10)
  if (alreadyPassed) {
    return (
      <div className="container" style={{ padding: '64px 16px', maxWidth: '640px' }}>
        <div className="glass-panel" style={{ padding: '48px 36px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '8px' }}>
            Modul Ini Sudah Lulus!
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Sesuai aturan bisnis <strong>BR-10</strong>: Setelah lulus, kuis modul ini tidak bisa dikerjakan lagi. Anda dapat melanjutkan ke modul berikutnya atau meninjau materi kembali.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {modulUrutan < totalModul ? (
              <Link
                href={`/belajar/${kursusSlug}?modul=${modulUrutan + 1}`}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <span>Lanjut ke Modul {modulUrutan + 1}</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                href="/kursus-saya"
                className="btn btn-primary"
                style={{ padding: '12px 24px', backgroundColor: '#10b981' }}
              >
                <Award size={18} />
                <span>Lihat Sertifikat di Kursus Saya</span>
              </Link>
            )}

            <Link
              href={`/belajar/${kursusSlug}?modul=${modulUrutan}`}
              className="btn btn-outline"
              style={{ padding: '12px 20px' }}
            >
              <BookOpen size={16} />
              <span>Kembali ke Materi Modul</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tampilan jika batas percobaan kuis telah habis (3 kali gagal, BR-10)
  if (isAttemptLimitReached && !resultData) {
    return (
      <div className="container" style={{ padding: '64px 16px', maxWidth: '640px' }}>
        <div className="glass-panel" style={{ padding: '48px 36px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Lock size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '8px' }}>
            Batas Percobaan Kuis Telah Habis
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Sesuai aturan bisnis <strong>BR-10</strong>: Setiap modul paling banyak <strong>3 percobaan kuis</strong> per pendaftaran. Anda telah menggunakan ketiga kesempatan tersebut. Silakan hubungi admin atau instruktur untuk bimbingan lebih lanjut.
          </p>

          <Link
            href={`/belajar/${kursusSlug}?modul=${modulUrutan}`}
            className="btn btn-primary"
            style={{ padding: '12px 24px', justifyContent: 'center' }}
          >
            <BookOpen size={16} />
            <span>Kembali ke Ruang Belajar</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '96px' }}>
      {/* Top Banner Quiz Header */}
      <section style={{
        backgroundColor: 'rgba(18, 26, 43, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 0',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: '74px',
        zIndex: 30
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href={`/belajar/${kursusSlug}?modul=${modulUrutan}`}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={15} />
              <span>Materi Modul</span>
            </Link>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kuis Evaluasi Pemahaman &bull; Modul {modulUrutan}
              </div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                {modulJudul}
              </h2>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              Percobaan {currentAttemptNumber} dari 3 (BR-10)
            </span>
            <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              Standar Lulus &ge; {nilaiLulus} (BR-09)
            </span>
          </div>
        </div>
      </section>

      {/* Main Form Content */}
      <div className="container" style={{ maxWidth: '820px', paddingTop: '36px' }}>
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.9rem',
            marginBottom: '24px'
          }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitQuiz}>
          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Status Pengerjaan:
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isAllAnswered ? '#34d399' : '#60a5fa' }}>
              {answeredCount} dari {totalQuestions} Soal Terjawab
            </span>
          </div>

          {/* List of Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '36px' }}>
            {questions.map((soal) => {
              const selectedChoice = answers[soal.id];
              const options = [
                { key: 'A', text: soal.pilihan_a },
                { key: 'B', text: soal.pilihan_b },
                { key: 'C', text: soal.pilihan_c },
                { key: 'D', text: soal.pilihan_d },
              ];

              return (
                <div
                  key={soal.id}
                  className="glass-panel"
                  style={{
                    padding: '28px',
                    border: selectedChoice ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* Question Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: selectedChoice ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      flexShrink: 0
                    }}>
                      {soal.urutan}
                    </div>
                    <div style={{ fontSize: '1.05rem', color: '#ffffff', lineHeight: 1.6, fontWeight: 500 }}>
                      {soal.pertanyaan}
                    </div>
                  </div>

                  {/* 4 Options A, B, C, D */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '46px' }}>
                    {options.map((opt) => {
                      const isSelected = selectedChoice === opt.key;

                      return (
                        <label
                          key={opt.key}
                          onClick={() => handleSelectOption(soal.id, opt.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.3)'}`,
                            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {opt.key}
                          </div>
                          <span style={{ fontSize: '0.94rem', color: isSelected ? '#ffffff' : 'var(--text-muted)', lineHeight: 1.5 }}>
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action Bar */}
          <div className="glass-panel" style={{
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
              Sesuai <strong>BR-09</strong>: Penilaian dilakukan langsung di server. Kunci jawaban tidak pernah dibocorkan.
            </div>

            <button
              type="submit"
              disabled={submitting || !isAllAnswered}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                backgroundColor: isAllAnswered ? '#10b981' : undefined
              }}
            >
              {submitting ? (
                <span>Menilai Jawaban di Server...</span>
              ) : (
                <>
                  <span>Kirim Jawaban Kuis</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Result Popup (BR-09, BR-10, BR-11) */}
      {resultData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 15, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '40px 32px',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Success or Fail Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: resultData.lulus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: resultData.lulus ? '#34d399' : '#f87171',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {resultData.lulus ? <Award size={40} /> : <XCircle size={40} />}
            </div>

            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px' }}>
              {resultData.lulus ? 'Selamat! Anda Dinyatakan Lulus' : 'Belum Mencapai Nilai Kelulusan'}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px' }}>
              {resultData.lulus
                ? 'Pemahaman Anda telah memenuhi standar kompetensi kursus ini.'
                : `Nilai minimum untuk lulus adalah ${resultData.nilai_lulus}. Anda dapat mengulang kuis setelah membaca kembali materi.`}
            </p>

            {/* Score Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '28px'
            }}>
              <div style={{
                padding: '16px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: resultData.lulus ? '#34d399' : '#f87171' }}>
                  {resultData.nilai}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Nilai Kuis (BR-09)
                </div>
              </div>

              <div style={{
                padding: '16px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
                  {resultData.jumlah_benar}/{resultData.jumlah_soal}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Jawaban Benar
                </div>
              </div>

              <div style={{
                padding: '16px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
                  {resultData.sisa_percobaan}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Sisa Percobaan (BR-10)
                </div>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resultData.semua_modul_selesai ? (
                /* Course Completed & Certificate Ready (BR-11) */
                <Link
                  href="/kursus-saya"
                  className="btn btn-primary"
                  style={{ padding: '14px', justifyContent: 'center', backgroundColor: '#10b981' }}
                >
                  <Award size={18} />
                  <span>Semua Modul Selesai! Lihat Sertifikat</span>
                </Link>
              ) : resultData.lulus ? (
                /* Passed & More Modules Available */
                <Link
                  href={`/belajar/${kursusSlug}?modul=${modulUrutan + 1}`}
                  className="btn btn-primary"
                  style={{ padding: '14px', justifyContent: 'center' }}
                >
                  <span>Lanjut ke Modul {modulUrutan + 1}</span>
                  <ArrowRight size={18} />
                </Link>
              ) : resultData.sisa_percobaan > 0 ? (
                /* Failed but Has Remaining Attempts */
                <button
                  onClick={() => {
                    setResultData(null);
                    setAnswers({});
                    router.refresh();
                  }}
                  className="btn btn-primary"
                  style={{ padding: '14px', justifyContent: 'center', backgroundColor: '#f59e0b' }}
                >
                  <RotateCcw size={16} />
                  <span>Ulangi Kuis Modul ({resultData.sisa_percobaan} Kesempatan Tersisa)</span>
                </button>
              ) : (
                /* Failed and Attempts Exhausted (BR-10) */
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.84rem'
                }}>
                  Percobaan kuis untuk modul ini telah habis (3/3).
                </div>
              )}

              <Link
                href={`/belajar/${kursusSlug}?modul=${modulUrutan}`}
                className="btn btn-outline"
                style={{ padding: '12px', justifyContent: 'center' }}
              >
                <span>Kembali ke Halaman Materi</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
