'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { ubahPeranPenggunaAction, ubahStatusPenggunaAction } from '@/app/admin/actions';

export interface UserItem {
  id: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  peran: 'peserta' | 'instruktur' | 'admin';
  aktif: boolean;
  dibuat_pada: string;
}

interface Props {
  users: UserItem[];
  currentAdminId: string;
}

export default function AdminUserManagement({ users, currentAdminId }: Props) {
  const router = useRouter();
  const [filterRole, setFilterRole] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: UserItem['peran']) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-danger">Admin</span>;
      case 'instruktur':
        return <span className="badge badge-warning">Instruktur</span>;
      case 'peserta':
        return <span className="badge badge-info">Peserta</span>;
      default:
        return <span className="badge badge-dim">{role}</span>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'semua' || u.peran === filterRole;
    const matchesStatus =
      filterStatus === 'semua' ||
      (filterStatus === 'aktif' && u.aktif) ||
      (filterStatus === 'nonaktif' && !u.aktif);
    const matchesSearch =
      u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.no_hp && u.no_hp.includes(searchQuery));
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Action: Ubah Peran (BR-12)
  const handleUbahPeran = async (user: UserItem, newRole: 'peserta' | 'instruktur' | 'admin') => {
    if (user.peran === newRole) return;

    if (user.id === currentAdminId && newRole !== 'admin') {
      alert('Admin tidak boleh menurunkan peran akunnya sendiri (BR-12).');
      return;
    }

    if (!confirm(`Ubah peran "${user.nama_lengkap}" dari ${user.peran} menjadi ${newRole}?`)) {
      return;
    }

    setLoadingId(user.id);
    setFeedbackMsg(null);
    const res = await ubahPeranPenggunaAction(user.id, newRole);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Peran ${user.nama_lengkap} berhasil diubah menjadi ${newRole} (BR-12).`
      });
      router.refresh();
    }
  };

  // Action: Ubah Status Aktif (BR-12)
  const handleToggleAktif = async (user: UserItem) => {
    const newStatus = !user.aktif;

    if (user.id === currentAdminId && !newStatus) {
      alert('Admin tidak boleh menonaktifkan akunnya sendiri (BR-12).');
      return;
    }

    const actionText = newStatus ? 'mengaktifkan kembali' : 'menonaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${actionText} akun "${user.nama_lengkap}"?`)) {
      return;
    }

    setLoadingId(user.id);
    setFeedbackMsg(null);
    const res = await ubahStatusPenggunaAction(user.id, newStatus);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Status akun ${user.nama_lengkap} berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'} (BR-12).`
      });
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
          {/* Role Filter & Status Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'semua', label: 'Semua Peran' },
              { id: 'peserta', label: 'Peserta' },
              { id: 'instruktur', label: 'Instruktur' },
              { id: 'admin', label: 'Admin' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setFilterRole(r.id)}
                className={`btn ${filterRole === r.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {r.label}
              </button>
            ))}

            <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

            {[
              { id: 'semua', label: 'Semua Status' },
              { id: 'aktif', label: 'Aktif' },
              { id: 'nonaktif', label: 'Nonaktif' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`btn ${filterStatus === s.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {s.label}
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
              placeholder="Cari nama, email, no HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', fontSize: '0.86rem', height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Table of Users */}
      {filteredUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Users size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '6px' }}>Tidak Ada Pengguna Ditemukan</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Pengguna</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Kontak</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Peran Saat Ini</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Status Akun</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Terdaftar</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Kelola Peran & Akses</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentAdminId;

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      backgroundColor: isSelf ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Pengguna */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>
                          {user.nama_lengkap}
                        </span>
                        {isSelf && (
                          <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                            Akun Anda
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {user.email}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td style={{ padding: '16px 20px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      {user.no_hp || <span style={{ color: 'var(--text-dim)' }}>-</span>}
                    </td>

                    {/* Peran Saat Ini */}
                    <td style={{ padding: '16px 20px' }}>
                      {getRoleBadge(user.peran)}
                    </td>

                    {/* Status Akun */}
                    <td style={{ padding: '16px 20px' }}>
                      {user.aktif ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                          <UserCheck size={14} /> Aktif
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                          <UserX size={14} /> Dinonaktifkan
                        </span>
                      )}
                    </td>

                    {/* Terdaftar */}
                    <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {formatDate(user.dibuat_pada)}
                    </td>

                    {/* Kelola Peran & Akses */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Selector Ubah Peran */}
                        {isSelf ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)'
                          }}>
                            <Lock size={12} />
                            <span>Terkunci (BR-12)</span>
                          </div>
                        ) : (
                          <select
                            value={user.peran}
                            onChange={(e) => handleUbahPeran(user, e.target.value as any)}
                            disabled={loadingId === user.id}
                            className="input-field"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              width: 'auto',
                              height: '32px'
                            }}
                          >
                            <option value="peserta">Peserta</option>
                            <option value="instruktur">Instruktur</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}

                        {/* Toggle Status Aktif / Nonaktif */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleAktif(user)}
                            disabled={loadingId === user.id}
                            className="btn"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              backgroundColor: user.aktif ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: user.aktif ? '#f87171' : '#10b981',
                              border: `1px solid ${user.aktif ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                            }}
                          >
                            {user.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
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
