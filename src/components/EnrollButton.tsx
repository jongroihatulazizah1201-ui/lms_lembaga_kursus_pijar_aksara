'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { daftarKursusAction } from '@/app/kursus/actions';
import { formatRupiah } from './CourseCard';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Building,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';

interface Props {
  courseId: string;
  slug: string;
  harga: number;
  sisaKursi: number;
  initialEnrollment?: {
    id: string;
    status: string;
    batas_bayar?: string;
  } | null;
  isLoggedIn: boolean;
  userRole?: string | null;
}

export default function EnrollButton({
  courseId,
  slug,
  harga,
  sisaKursi,
  initialEnrollment,
  isLoggedIn,
  userRole,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState<'qris' | 'va' | 'transfer_manual'>('qris');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{
    status: string;
    paymentUrl: string | null;
    message: string;
  } | null>(null);

  const isFree = harga === 0;
  const isFull = sisaKursi <= 0;

  // 1. Jika pengguna belum login
  if (!isLoggedIn) {
    if (isFull) {
      return (
        <button
          disabled
          className="btn"
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-dim)',
            cursor: 'not-allowed',
            padding: '14px',
            justifyContent: 'center'
          }}
        >
          Pendaftaran Ditutup (Penuh)
        </button>
      );
    }
    return (
      <Link
        href={`/login?redirect=/kursus/${slug}`}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          justifyContent: 'center'
        }}
      >
        <span>Masuk untuk Mendaftar</span>
        <ArrowRight size={18} />
      </Link>
    );
  }

  // 2. Jika login tetapi perannya bukan Peserta (BR-05)
  if (userRole && userRole !== 'peserta') {
    return (
      <div style={{
        padding: '14px 16px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.84rem',
        color: '#fbbf24',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertCircle size={18} />
        <span>Anda masuk sebagai <strong>{userRole}</strong>. Hanya akun Peserta yang dapat mendaftar (BR-05).</span>
      </div>
    );
  }

  // 3. Jika sudah memiliki pendaftaran yang masih berlaku (BR-05)
  if (initialEnrollment) {
    if (initialEnrollment.status === 'aktif') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={15} />
            <span>Anda sudah terdaftar aktif di kursus ini</span>
          </div>
          <Link
            href={`/belajar/${slug}`}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
          >
            <span>Lanjut Belajar</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      );
    } else if (initialEnrollment.status === 'menunggu_bayar') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={15} />
            <span>Pendaftaran menunggu pembayaran</span>
          </div>
          <Link
            href="/kursus-saya"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center', backgroundColor: '#f59e0b' }}
          >
            <span>Lihat Tagihan & Bayar</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      );
    } else if (initialEnrollment.status === 'selesai') {
      return (
        <Link
          href="/kursus-saya"
          className="btn btn-outline"
          style={{ width: '100%', padding: '12px', justifyContent: 'center', borderColor: '#10b981', color: '#34d399' }}
        >
          <CheckCircle2 size={16} />
          <span>Kursus Selesai (Lihat Sertifikat)</span>
        </Link>
      );
    }
  }

  // 4. Jika kuota kursi penuh (BR-06)
  if (isFull) {
    return (
      <button
        disabled
        className="btn"
        style={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-dim)',
          cursor: 'not-allowed',
          padding: '14px',
          justifyContent: 'center'
        }}
      >
        Pendaftaran Ditutup (Penuh)
      </button>
    );
  }

  // Handle direct enrollment for free course or submit modal
  const handleEnroll = async (selectedMetode: string = 'gratis') => {
    setLoading(true);
    setError('');

    // Sesuai enum metode_bayar_enum: 'gratis', 'transfer_manual', 'mayar'
    const dbMetode = (selectedMetode === 'qris' || selectedMetode === 'va') ? 'mayar' : selectedMetode;

    const res = await daftarKursusAction(courseId, dbMetode);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccessData({
        status: res.status,
        paymentUrl: res.paymentUrl || null,
        message: res.message,
      });
      if (res.isFree) {
        setTimeout(() => {
          router.push('/kursus-saya');
        }, 1500);
      }
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {isFree ? (
        <button
          onClick={() => handleEnroll('gratis')}
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            justifyContent: 'center',
            backgroundColor: '#10b981'
          }}
        >
          {loading ? <span>Mendaftarkan...</span> : (
            <>
              <span>Daftar Kursus Gratis Ini</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            justifyContent: 'center'
          }}
        >
          <span>Daftar & Pilih Pembayaran</span>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Payment Selection Modal for Paid Courses */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button
              onClick={() => { setModalOpen(false); setSuccessData(null); setError(''); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Success State */}
            {successData ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
                  Pendaftaran Berhasil!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  {successData.message}
                </p>

                {successData.paymentUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <a
                      href={successData.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: '12px', justifyContent: 'center' }}
                    >
                      <span>Lanjut Bayar via Mayar</span>
                      <ExternalLink size={16} />
                    </a>
                    <Link
                      href="/kursus-saya"
                      className="btn btn-outline"
                      style={{ padding: '12px', justifyContent: 'center' }}
                    >
                      Ke Halaman Kursus Saya
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/kursus-saya"
                    className="btn btn-primary"
                    style={{ padding: '12px', width: '100%', justifyContent: 'center' }}
                  >
                    Buka Kursus Saya
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '6px' }}>
                  Pendaftaran Kursus Berbayar
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Pilih metode pembayaran yang Anda inginkan.
                </p>

                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.84rem',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Amount Summary */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Biaya:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {formatRupiah(harga)}
                  </span>
                </div>

                {/* Payment Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  <label
                    onClick={() => setMetodeBayar('qris')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: metodeBayar === 'qris' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${metodeBayar === 'qris' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <QrCode size={20} color={metodeBayar === 'qris' ? 'var(--primary)' : 'var(--text-dim)'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>QRIS (Gopay / OVO / Dana / BCA)</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pembayaran instan via scan barcode Mayar</div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'qris'}
                      onChange={() => setMetodeBayar('qris')}
                    />
                  </label>

                  <label
                    onClick={() => setMetodeBayar('va')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: metodeBayar === 'va' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${metodeBayar === 'va' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={20} color={metodeBayar === 'va' ? 'var(--primary)' : 'var(--text-dim)'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>Virtual Account Bank</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>BCA, Mandiri, BNI, BRI otomatis</div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'va'}
                      onChange={() => setMetodeBayar('va')}
                    />
                  </label>

                  <label
                    onClick={() => setMetodeBayar('transfer_manual')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: metodeBayar === 'transfer_manual' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${metodeBayar === 'transfer_manual' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <Building size={20} color={metodeBayar === 'transfer_manual' ? 'var(--primary)' : 'var(--text-dim)'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>Transfer Bank Manual</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Konfirmasi manual oleh staf admin Pijar Aksara</div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'transfer_manual'}
                      onChange={() => setMetodeBayar('transfer_manual')}
                    />
                  </label>
                </div>

                {/* BR-07 Notice */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '0.8rem',
                  color: '#fbbf24',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={16} />
                  <span>Sesuai <strong>BR-07</strong>: Pendaftaran berlaku selama <strong>24 jam</strong>. Jika tidak dibayar sebelum batas waktu, pendaftaran kedaluwarsa dan kursi kembali terbuka.</span>
                </div>

                {/* Submit Action */}
                <button
                  onClick={() => handleEnroll(metodeBayar)}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}
                >
                  {loading ? <span>Memproses Reservasi Kursi...</span> : (
                    <>
                      <span>Konfirmasi & Lanjut Bayar</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
