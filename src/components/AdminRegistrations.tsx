'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  HelpCircle,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';
import { konfirmasiPembayaranAction, batalkanPendaftaranAction } from '@/app/admin/actions';

export interface RegistrationItem {
  id: string;
  status: 'menunggu_bayar' | 'aktif' | 'selesai' | 'kedaluwarsa' | 'dibatalkan';
  nominal: number;
  metode_bayar: 'gratis' | 'transfer_manual' | 'mayar';
  batas_bayar: string | null;
  dibayar_pada: string | null;
  dikonfirmasi_oleh: string | null;
  alasan_batal: string | null;
  didaftarkan_pada: string;
  kursus: {
    id: string;
    judul: string;
    slug: string;
    harga: number;
  };
  peserta: {
    id: string;
    nama_lengkap: string;
    email: string;
    no_hp: string | null;
  };
}

interface Props {
  registrations: RegistrationItem[];
}

export default function AdminRegistrations({ registrations }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Pembatalan Pendaftaran Aktif State
  const [cancelModalReg, setCancelModalReg] = useState<RegistrationItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: RegistrationItem['status']) => {
    switch (status) {
      case 'aktif':
        return <span className="badge badge-success">Aktif</span>;
      case 'menunggu_bayar':
        return <span className="badge badge-warning">Menunggu Bayar</span>;
      case 'selesai':
        return <span className="badge badge-info">Selesai</span>;
      case 'dibatalkan':
        return <span className="badge badge-danger">Dibatalkan</span>;
      case 'kedaluwarsa':
        return <span className="badge badge-dim">Kedaluwarsa</span>;
      default:
        return <span className="badge badge-dim">{status}</span>;
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesStatus = filterStatus === 'semua' || r.status === filterStatus;
    const matchesSearch =
      r.peserta.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.peserta.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.kursus.judul.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Action: Konfirmasi Pembayaran (menunggu_bayar -> aktif, BR-07)
  const handleKonfirmasiPembayaran = async (reg: RegistrationItem) => {
    if (!confirm(`Konfirmasi pembayaran sebesar ${formatRupiah(reg.nominal)} untuk peserta "${reg.peserta.nama_lengkap}" pada kursus "${reg.kursus.judul}"?`)) {
      return;
    }

    setLoadingId(reg.id);
    setFeedbackMsg(null);
    const res = await konfirmasiPembayaranAction(reg.id);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({ type: 'success', text: `Pembayaran ${reg.peserta.nama_lengkap} berhasil dikonfirmasi. Status pendaftaran kini Aktif (BR-07).` });
      router.refresh();
    }
  };

  // Action: Batalkan Pendaftaran (aktif / menunggu_bayar -> dibatalkan, BR-07)
  const handleBatalkanPendaftaran = async () => {
    if (!cancelModalReg) return;

    if (cancelModalReg.status === 'aktif' && cancelReason.trim().length < 10) {
      setCancelError('Alasan pembatalan pendaftaran aktif minimal 10 karakter (BR-07).');
      return;
    }

    setLoadingId(cancelModalReg.id);
    setCancelError(null);
    const res = await batalkanPendaftaranAction(cancelModalReg.id, cancelReason);
    setLoadingId(null);

    if (res?.error) {
      setCancelError(res.error);
    } else {
      setFeedbackMsg({ type: 'success', text: `Pendaftaran ${cancelModalReg.peserta.nama_lengkap} berhasil dibatalkan.` });
      setCancelModalReg(null);
      setCancelReason('');
      router.refresh();
    }
  };

  return (
    <div>
      {/* Alert Banner Feedback */}
      {feedbackMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.92rem'
        }}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Filter Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'semua', label: 'Semua Status' },
              { id: 'menunggu_bayar', label: 'Menunggu Bayar' },
              { id: 'aktif', label: 'Aktif' },
              { id: 'selesai', label: 'Selesai' },
              { id: 'dibatalkan', label: 'Dibatalkan' },
              { id: 'kedaluwarsa', label: 'Kedaluwarsa' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`btn ${filterStatus === st.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="Cari peserta, email, kursus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', fontSize: '0.86rem', height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Table of Registrations */}
      {filteredRegistrations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <CreditCard size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '6px' }}>Tidak Ada Data Pendaftaran</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Tidak ditemukan pendaftaran yang cocok dengan filter atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Peserta</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Kursus</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Nominal & Metode</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Waktu / Batas</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr
                  key={reg.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Peserta */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                      {reg.peserta.nama_lengkap}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {reg.peserta.email}
                    </div>
                    {reg.peserta.no_hp && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        HP: {reg.peserta.no_hp}
                      </div>
                    )}
                  </td>

                  {/* Kursus */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#ffffff', fontWeight: 500 }}>
                      {reg.kursus.judul}
                    </div>
                  </td>

                  {/* Nominal & Metode */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>
                      {reg.nominal === 0 ? 'Gratis' : formatRupiah(reg.nominal)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      {reg.metode_bayar.replace('_', ' ')}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '16px 20px' }}>
                    {getStatusBadge(reg.status)}
                    {reg.alasan_batal && (
                      <div style={{ fontSize: '0.76rem', color: '#f87171', marginTop: '4px', maxWidth: '200px' }}>
                        Alasan: &ldquo;{reg.alasan_batal}&rdquo;
                      </div>
                    )}
                  </td>

                  {/* Waktu / Batas */}
                  <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <div>Daftar: {formatDate(reg.didaftarkan_pada)}</div>
                    {reg.status === 'menunggu_bayar' && reg.batas_bayar && (
                      <div style={{ color: '#fbbf24', marginTop: '2px' }}>
                        Batas: {formatDate(reg.batas_bayar)}
                      </div>
                    )}
                    {reg.dibayar_pada && (
                      <div style={{ color: '#10b981', marginTop: '2px' }}>
                        Dibayar: {formatDate(reg.dibayar_pada)}
                      </div>
                    )}
                  </td>

                  {/* Aksi Admin */}
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Konfirmasi Pembayaran untuk status menunggu_bayar */}
                      {reg.status === 'menunggu_bayar' && (
                        <button
                          onClick={() => handleKonfirmasiPembayaran(reg)}
                          disabled={loadingId === reg.id}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#10b981' }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Konfirmasi</span>
                        </button>
                      )}

                      {/* Batalkan Pendaftaran untuk status aktif atau menunggu_bayar */}
                      {(reg.status === 'aktif' || reg.status === 'menunggu_bayar') && (
                        <button
                          onClick={() => {
                            setCancelModalReg(reg);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          disabled={loadingId === reg.id}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}
                        >
                          <XCircle size={13} />
                          <span>Batalkan</span>
                        </button>
                      )}

                      {/* Status terminal info */}
                      {['selesai', 'dibatalkan', 'kedaluwarsa'].includes(reg.status) && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Status Final
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pembatalan Pendaftaran (BR-07) */}
      {cancelModalReg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <XCircle size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                Batalkan Pendaftaran
              </h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Anda akan membatalkan pendaftaran <strong style={{ color: '#ffffff' }}>{cancelModalReg.peserta.nama_lengkap}</strong> pada kursus <strong style={{ color: '#ffffff' }}>{cancelModalReg.kursus.judul}</strong>.
            </p>

            {cancelModalReg.status === 'aktif' && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.82rem',
                color: '#f87171',
                marginBottom: '16px'
              }}>
                <strong>Aturan Bisnis BR-07:</strong> Pembatalan pendaftaran yang sudah <em>aktif</em> wajib menyertakan alasan minimal 10 karakter.
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Alasan Pembatalan:
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Contoh: Permintaan pembatalan dari peserta karena jadwal bentrok dengan tugas kantor."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError(null);
                }}
                style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>{cancelReason.trim().length} karakter (minimal 10)</span>
                {cancelReason.trim().length >= 10 && <span style={{ color: '#10b981' }}>&check; Memenuhi syarat BR-07</span>}
              </div>
              {cancelError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px' }}>
                  {cancelError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setCancelModalReg(null)}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                Kembali
              </button>
              <button
                onClick={handleBatalkanPendaftaran}
                disabled={loadingId === cancelModalReg.id || (cancelModalReg.status === 'aktif' && cancelReason.trim().length < 10)}
                className="btn btn-danger"
                style={{ padding: '8px 20px', fontSize: '0.88rem' }}
              >
                {loadingId === cancelModalReg.id ? 'Memproses...' : 'Konfirmasi Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
