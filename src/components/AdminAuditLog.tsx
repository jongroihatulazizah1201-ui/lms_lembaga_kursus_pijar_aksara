'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Clock,
  User,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  pelaku_id: string | null;
  aksi: string;
  nama_tabel: string;
  id_data: string | null;
  data_sebelum: any;
  data_sesudah: any;
  dibuat_pada: string;
  pelaku?: {
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
}

interface Props {
  logs: AuditLogItem[];
}

export default function AdminAuditLog({ logs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('semua');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'terbitkan_kursus':
        return <span className="badge badge-success">Terbitkan Kursus</span>;
      case 'kembalikan_kursus':
        return <span className="badge badge-warning">Kembalikan ke Draf</span>;
      case 'tutup_kursus':
        return <span className="badge badge-danger">Tutup Kursus</span>;
      case 'buka_kursus':
        return <span className="badge badge-info">Buka Kursus</span>;
      case 'ajukan_kursus':
        return <span className="badge badge-info">Ajukan Kursus</span>;
      case 'ubah_kuota_kursus':
        return <span className="badge badge-primary">Ubah Kuota</span>;
      case 'konfirmasi_pembayaran':
        return <span className="badge badge-success">Konfirmasi Bayar</span>;
      case 'batalkan_pendaftaran':
        return <span className="badge badge-danger">Batal Pendaftaran</span>;
      case 'ubah_peran_pengguna':
        return <span className="badge badge-warning">Ubah Peran</span>;
      case 'ubah_status_pengguna':
        return <span className="badge badge-danger">Ubah Status Akun</span>;
      default:
        return <span className="badge badge-dim">{action}</span>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'semua' || log.aksi === filterAction;
    const actorName = log.pelaku?.nama_lengkap || '';
    const actorEmail = log.pelaku?.email || '';
    const matchesSearch =
      log.aksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.nama_tabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div>
      {/* Search and Action Filter */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'semua', label: 'Semua Aksi' },
              { id: 'terbitkan_kursus', label: 'Terbitkan' },
              { id: 'kembalikan_kursus', label: 'Kembalikan' },
              { id: 'ubah_kuota_kursus', label: 'Kuota' },
              { id: 'konfirmasi_pembayaran', label: 'Konfirmasi Bayar' },
              { id: 'batalkan_pendaftaran', label: 'Batal Daftar' },
              { id: 'ubah_peran_pengguna', label: 'Peran Akun' },
            ].map((act) => (
              <button
                key={act.id}
                onClick={() => setFilterAction(act.id)}
                className={`btn ${filterAction === act.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {act.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="Cari aksi, tabel, atau pelaku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', fontSize: '0.86rem', height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <FileText size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '6px' }}>Tidak Ada Rekaman Audit Log</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Belum ada aktivitas mutasi sensitif yang tercatat atau sesuai dengan filter pencarian.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Waktu</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Pelaku</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Aksi (BR-12)</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Tabel & Data</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Waktu */}
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      <div style={{ color: '#ffffff', fontWeight: 500 }}>
                        {formatDate(log.dibuat_pada)}
                      </div>
                    </td>

                    {/* Pelaku */}
                    <td style={{ padding: '16px 20px' }}>
                      {log.pelaku ? (
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>
                            {log.pelaku.nama_lengkap}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {log.pelaku.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Sistem / Otomatis
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '16px 20px' }}>
                      {getActionBadge(log.aksi)}
                    </td>

                    {/* Tabel & ID Data */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                        <Database size={13} color="var(--primary)" />
                        <span style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                          {log.nama_tabel}
                        </span>
                      </div>
                      {log.id_data && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {log.id_data.substring(0, 18)}...
                        </div>
                      )}
                    </td>

                    {/* Rincian Perubahan */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="btn btn-outline"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      >
                        <span>{isExpanded ? 'Tutup' : 'Lihat Data'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {isExpanded && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          fontFamily: 'monospace'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#f87171' }}>[Data Sebelum]:</strong>
                            <pre style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', overflowX: 'auto' }}>
                              {JSON.stringify(log.data_sebelum, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <strong style={{ color: '#10b981' }}>[Data Sesudah]:</strong>
                            <pre style={{ margin: '4px 0 0 0', color: '#ffffff', overflowX: 'auto' }}>
                              {JSON.stringify(log.data_sesudah, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
