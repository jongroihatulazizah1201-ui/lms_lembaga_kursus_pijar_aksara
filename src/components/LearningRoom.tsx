'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tandaiMateriDibacaAction, getSignedPdfUrlAction } from '@/app/belajar/actions';
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
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface ModulItem {
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

interface Props {
  kursusSlug: string;
  kursusJudul: string;
  pendaftaranId: string;
  modules: ModulItem[];
  initialUrutan?: number;
}

export default function LearningRoom({
  kursusSlug,
  kursusJudul,
  pendaftaranId,
  modules,
  initialUrutan,
}: Props) {
  const router = useRouter();

  // Tentukan modul aktif awal: jika tidak ditentukan, pilih modul pertama yang 'terbuka', atau modul 1
  const defaultModul = modules.find(m => m.status_akses === 'terbuka') || modules[0];
  const [activeUrutan, setActiveUrutan] = useState<number>(initialUrutan || defaultModul?.urutan || 1);

  const [loadingAction, setLoadingAction] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeModule = modules.find(m => m.urutan === activeUrutan) || modules[0];
  const isLocked = activeModule?.status_akses === 'terkunci';
  const isPassed = activeModule?.status_akses === 'lulus';
  const isRead = !!activeModule?.materi_dibaca_pada;

  // Handle pindah modul
  const handleSelectModule = (urutan: number) => {
    const target = modules.find(m => m.urutan === urutan);
    if (target?.status_akses === 'terkunci') {
      setFeedbackMsg({
        type: 'error',
        text: `Modul ${urutan} masih terkunci. Anda harus lulus kuis modul sebelumnya terlebih dahulu (BR-08).`,
      });
      return;
    }
    setActiveUrutan(urutan);
    setFeedbackMsg(null);
    setPdfUrl(null);
  };

  // Handle Tandai Materi Sudah Dibaca (BR-08)
  const handleMarkAsRead = async () => {
    if (!activeModule) return;
    setLoadingAction(true);
    setFeedbackMsg(null);

    const res = await tandaiMateriDibacaAction(pendaftaranId, activeModule.modul_id, kursusSlug);
    setLoadingAction(false);

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

  // Handle Unduh PDF via Signed URL 60 menit (BR Bagian 10 Poin 4)
  const handleDownloadPdf = async () => {
    if (!activeModule?.lampiran_path) return;
    setDownloadingPdf(true);

    const res = await getSignedPdfUrlAction(activeModule.lampiran_path);
    setDownloadingPdf(false);

    if (res?.success && res.signedUrl) {
      setPdfUrl(res.signedUrl);
      window.open(res.signedUrl, '_blank');
    } else {
      alert('Gagal mengambil tautan unduh dokumen PDF.');
    }
  };

  // Helper untuk embed YouTube jika ada video_url
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

  return (
    <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation Bar */}
      <section style={{
        backgroundColor: 'rgba(18, 26, 43, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 0',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: '74px',
        zIndex: 40
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/kursus-saya"
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={15} />
              <span>Kembali ke Kursus Saya</span>
            </Link>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ruang Belajar & Kurikulum Berurutan
              </div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                {kursusJudul}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Modul {activeModule?.urutan} dari {modules.length}
            </span>
          </div>
        </div>
      </section>

      {/* Main Workspace Layout (Sidebar + Content Reader) */}
      <div className="container" style={{ flex: 1, padding: '32px 0 80px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '32px',
          alignItems: 'flex-start'
        }}>
          {/* Left Sidebar: Sequential Modules List (BR-08) */}
          <aside className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '160px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 700, margin: 0 }}>
                Daftar Modul
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                {modules.filter(m => m.status_akses === 'lulus').length}/{modules.length} Lulus
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '18px', lineHeight: 1.4 }}>
              Sesuai <strong>BR-08</strong>: Modul terbuka berurutan. Selesaikan materi & kuis untuk membuka modul berikutnya.
            </p>

            {/* Modules List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {modules.map((m) => {
                const isActive = m.urutan === activeUrutan;
                const mLocked = m.status_akses === 'terkunci';
                const mPassed = m.status_akses === 'lulus';

                return (
                  <button
                    key={m.modul_id}
                    onClick={() => handleSelectModule(m.urutan)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive
                        ? 'rgba(59, 130, 246, 0.16)'
                        : mLocked
                        ? 'rgba(255, 255, 255, 0.01)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        isActive
                          ? 'var(--primary)'
                          : mLocked
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      cursor: mLocked ? 'not-allowed' : 'pointer',
                      opacity: mLocked ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: mPassed
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isActive
                          ? 'var(--primary)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {m.urutan}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.86rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.judul}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={11} />
                          <span>{m.durasi_menit} menit</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div style={{ flexShrink: 0 }}>
                      {mPassed ? (
                        <CheckCircle2 size={16} color="#34d399" />
                      ) : mLocked ? (
                        <Lock size={15} color="var(--text-dim)" />
                      ) : (
                        <BookOpen size={15} color="#60a5fa" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Content Area: Material Reader */}
          <main style={{ minWidth: 0 }}>
            {feedbackMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'var(--danger-bg)',
                border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: feedbackMsg.type === 'success' ? '#34d399' : '#f87171',
                fontSize: '0.88rem',
                marginBottom: '24px'
              }}>
                {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {isLocked ? (
              /* Locked State Card (BR-08) */
              <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Lock size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '10px' }}>
                  Modul {activeModule.urutan} Masih Terkunci
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  Sesuai aturan bisnis <strong>BR-08</strong>, modul ini hanya akan terbuka setelah Anda menyelesaikan dan lulus kuis pada Modul {activeModule.urutan - 1}.
                </p>
                <button
                  onClick={() => handleSelectModule(activeModule.urutan - 1)}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', justifyContent: 'center' }}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Modul {activeModule.urutan - 1}</span>
                </button>
              </div>
            ) : (
              /* Unlocked Content View */
              <div className="glass-panel" style={{ padding: '36px' }}>
                {/* Module Heading */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Modul {activeModule.urutan}
                    </span>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', color: '#ffffff', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                      {activeModule.judul}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} />
                        Estimasi {activeModule.durasi_menit} Menit
                      </span>
                      <span>&bull;</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BookOpen size={14} />
                        Materi Bacaan Teks
                      </span>
                      {activeModule.video_url && (
                        <>
                          <span>&bull;</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Video size={14} color="#60a5fa" />
                            Video Pembelajaran
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isPassed ? (
                    <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                      <CheckCircle2 size={14} />
                      Kuis Modul Telah Lulus
                    </span>
                  ) : isRead ? (
                    <span className="badge badge-primary" style={{ padding: '6px 12px' }}>
                      <CheckCircle2 size={14} />
                      Materi Telah Dibaca
                    </span>
                  ) : null}
                </div>

                {/* Video Embed (if available) */}
                {embedUrl && (
                  <div style={{
                    marginBottom: '32px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={embedUrl}
                        title={activeModule.judul}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Text Material Content */}
                <div style={{
                  padding: '24px 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '32px'
                }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '16px' }}>
                    Isi Materi Pembelajaran
                  </h3>
                  <div style={{
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.85,
                    whiteSpace: 'pre-line'
                  }}>
                    {activeModule.isi_materi || 'Materi sedang disiapkan oleh instruktur.'}
                  </div>
                </div>

                {/* PDF Attachment Download Card (BR-08 & Non-Functional Point 4) */}
                {activeModule.lampiran_path && (
                  <div style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.94rem' }}>
                          Bahan Bacaan & Dokumen Modul (PDF)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Tautan unduh aman bertenggat waktu 60 menit (Kebutuhan Non-Fungsional Poin 4)
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', fontSize: '0.86rem', borderColor: 'var(--primary)', color: '#60a5fa' }}
                    >
                      <Download size={15} />
                      <span>{downloadingPdf ? 'Mengambil Tautan...' : 'Unduh File PDF'}</span>
                    </button>
                  </div>
                )}

                {/* Completion & Next Action Area (BR-08) */}
                <div style={{
                  padding: '28px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0 0 4px 0' }}>
                        Langkah Selanjutnya: Evaluasi Pemahaman
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: 0 }}>
                        {isPassed
                          ? 'Anda telah berhasil lulus kuis modul ini.'
                          : isRead
                          ? 'Materi telah selesai dibaca. Silakan mulai kuis modul di bawah ini.'
                          : 'Sesuai BR-08: Anda wajib menandai materi sudah dibaca sebelum dapat membuka kuis.'}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!isRead && !isPassed && (
                      <button
                        onClick={handleMarkAsRead}
                        disabled={loadingAction}
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', backgroundColor: '#3b82f6' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>{loadingAction ? 'Menandai...' : 'Tandai Materi Sudah Dibaca (BR-08)'}</span>
                      </button>
                    )}
                  </div>

                  {/* Quiz Action Button */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {isPassed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.86rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={16} />
                          Lulus Kuis Modul Ini
                        </span>
                        {activeModule.urutan < modules.length && (
                          <button
                            onClick={() => handleSelectModule(activeModule.urutan + 1)}
                            className="btn btn-primary"
                            style={{ padding: '10px 18px' }}
                          >
                            <span>Lanjut ke Modul {activeModule.urutan + 1}</span>
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    ) : isRead ? (
                      <Link
                        href={`/belajar/${kursusSlug}/kuis?modul=${activeModule.urutan}`}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', backgroundColor: '#10b981', fontSize: '0.96rem' }}
                      >
                        <Award size={18} />
                        <span>Mulai Kuis Modul {activeModule.urutan}</span>
                        <ArrowRight size={18} />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="btn"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-dim)',
                          cursor: 'not-allowed',
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem'
                        }}
                        title="Tandai materi sudah dibaca terlebih dahulu untuk membuka kuis (BR-08)"
                      >
                        <Lock size={16} />
                        <span>Kuis Modul Terkunci (Baca Materi Dahulu)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
