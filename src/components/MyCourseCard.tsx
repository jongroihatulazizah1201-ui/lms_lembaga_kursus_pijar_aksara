'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { batalkanPendaftaranAction } from '@/app/kursus/actions';
import { formatRupiah } from './CourseCard';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Award,
  BookOpen,
  Building,
  QrCode,
  CreditCard
} from 'lucide-react';

interface Props {
  enrollment: {
    id: string;
    status: string;
    nominal: number;
    metode_bayar: string;
    batas_bayar: string | null;
    didaftarkan_pada: string;
    mayar_invoice_id: string | null;
    kursus: {
      id: string;
      judul: string;
      slug: string;
      kategori: string;
      harga: number;
      instruktur_nama: string;
      total_modul: number;
    };
    modul_lulus: number;
  };
}

export default function MyCourseCard({ enrollment }: Props) {
  const { kursus, status, nominal, batas_bayar, modul_lulus, id } = enrollment;
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Perhitungan progres kelulusan (BR-11)
  const totalModul = kursus.total_modul || 1;
  const progressPercent = Math.min(100, Math.round((modul_lulus / totalModul) * 100));

  // Live countdown timer untuk batas waktu bayar 24 jam (BR-07)
  useEffect(() => {
    if (status !== 'menunggu_bayar' || !batas_bayar) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(batas_bayar).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Waktu bayar telah habis');
        setIsExpired(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, batas_bayar]);

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pendaftaran ini? Kursi Anda akan dikembalikan ke kuota umum (BR-07).')) {
      return;
    }

    setCancelling(true);
    const res = await batalkanPendaftaranAction(id);
    setCancelling(false);

    if (res?.error) {
      alert(res.error);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'aktif':
        return <span className="badge badge-success"><CheckCircle2 size={13} /> Aktif Belajar</span>;
      case 'menunggu_bayar':
        return <span className="badge badge-warning"><Clock size={13} /> Menunggu Pembayaran</span>;
      case 'selesai':
        return <span className="badge badge-primary"><Award size={13} /> Selesai</span>;
      case 'dibatalkan':
        return <span className="badge badge-danger"><XCircle size={13} /> Dibatalkan</span>;
      case 'kedaluwarsa':
        return <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}><AlertCircle size={13} /> Kedaluwarsa</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '20px',
      position: 'relative'
    }}>
      {/* Header Info */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {kursus.kategori}
          </span>
          {getStatusBadge()}
        </div>

        <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '8px', lineHeight: 1.4 }}>
          {kursus.judul}
        </h3>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
          Instruktur: <span style={{ color: 'var(--text-muted)' }}>{kursus.instruktur_nama}</span>
        </div>

        {/* Progress Bar for Active / Selesai */}
        {(status === 'aktif' || status === 'selesai') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Progres Belajar (BR-11)</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{progressPercent}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, var(--primary), var(--accent))',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
              {modul_lulus} dari {totalModul} modul telah lulus
            </div>
          </div>
        )}

        {/* Payment Warning & Countdown for Menunggu Bayar (BR-07) */}
        {status === 'menunggu_bayar' && (
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sisa Batas Bayar 24 Jam:</span>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isExpired ? '#ef4444' : '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={14} />
                <span>{timeLeft || '24:00:00'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Nominal Tagihan:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)' }}>
                {formatRupiah(nominal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {status === 'aktif' && (
          <Link
            href={`/belajar/${kursus.slug}`}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px', justifyContent: 'center' }}
          >
            <BookOpen size={16} />
            <span>Lanjut Belajar</span>
            <ArrowRight size={16} />
          </Link>
        )}

        {status === 'menunggu_bayar' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.85rem',
                justifyContent: 'center',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171'
              }}
            >
              {cancelling ? 'Membatalkan...' : 'Batalkan (BR-07)'}
            </button>
            <Link
              href={`/kursus/${kursus.slug}`}
              className="btn btn-primary"
              style={{
                flex: 1.3,
                padding: '10px',
                fontSize: '0.85rem',
                justifyContent: 'center',
                backgroundColor: '#f59e0b'
              }}
            >
              <span>Bayar Sekarang</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        )}

        {status === 'selesai' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={`/belajar/${kursus.slug}`}
              className="btn btn-outline"
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              Review Materi
            </Link>
            <Link
              href={`/sertifikat/${id}`}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem', justifyContent: 'center', backgroundColor: '#10b981' }}
            >
              <Award size={16} />
              <span>Sertifikat</span>
            </Link>
          </div>
        )}

        {(status === 'dibatalkan' || status === 'kedaluwarsa') && (
          <Link
            href={`/kursus/${kursus.slug}`}
            className="btn btn-outline"
            style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.88rem' }}
          >
            <span>Daftar Kembali (BR-05)</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
