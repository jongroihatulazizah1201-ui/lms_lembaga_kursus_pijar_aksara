'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  ChevronDown,
  Phone,
  Mail
} from 'lucide-react';

interface ModuleItem {
  id: string;
  urutan: number;
  judul: string;
}

interface ParticipantModuleScore {
  modul_id: string;
  urutan: number;
  lulus: boolean;
  nilai_terbaik: number | null;
  jumlah_percobaan: number;
}

interface ParticipantData {
  pendaftaran_id: string;
  peserta_id: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  status_pendaftaran: string;
  didaftarkan_pada: string;
  modul_lulus_count: number;
  nilai_per_modul: ParticipantModuleScore[];
}

interface GradebookData {
  kursus_id: string;
  judul_kursus: string;
  slug: string;
  kategori: string;
  modul: ModuleItem[];
  peserta: ParticipantData[];
}

interface CourseSummary {
  id: string;
  judul: string;
  status: string;
}

interface Props {
  initialData: GradebookData;
  instructorCourses: CourseSummary[];
}

export default function InstructorGradebook({ initialData, instructorCourses }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  const { modul, peserta, judul_kursus, kursus_id } = initialData;
  const totalModul = modul.length;

  // Filter Peserta
  const filteredParticipants = peserta.filter((p) => {
    const matchesSearch =
      p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'semua' || p.status_pendaftaran === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistik Ringkasan
  const totalPeserta = peserta.length;
  const pesertaAktif = peserta.filter((p) => p.status_pendaftaran === 'aktif').length;
  const pesertaSelesai = peserta.filter((p) => p.status_pendaftaran === 'selesai').length;
  const totalLulusPersen = totalPeserta > 0 ? Math.round((pesertaSelesai / totalPeserta) * 100) : 0;

  const handleSelectCourse = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/instruktur/nilai?kursus=${e.target.value}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <span className="badge badge-success"><CheckCircle2 size={11} /> Aktif</span>;
      case 'selesai':
        return <span className="badge badge-primary"><Award size={11} /> Selesai</span>;
      case 'menunggu_bayar':
        return <span className="badge badge-warning"><Clock size={11} /> Menunggu</span>;
      case 'dibatalkan':
        return <span className="badge badge-danger"><XCircle size={11} /> Batal</span>;
      case 'kedaluwarsa':
        return <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>Kedaluwarsa</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '96px' }}>
      {/* Top Header & Course Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/instruktur" className="btn btn-outline" style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary">REKAPITULASI NILAI</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>BR-12 Isolasi Instruktur</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', color: '#ffffff', margin: '4px 0 0 0' }}>
              Peserta & Nilai Kuis
            </h1>
          </div>
        </div>

        {/* Dropdown Pemilih Kursus Milik Instruktur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Pilih Kursus:</label>
          <select
            value={kursus_id}
            onChange={handleSelectCourse}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#162032',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {instructorCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.judul} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ringkasan Kursus (PRD Bagian 9) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>{totalPeserta}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
            Total Pendaftar
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{pesertaAktif}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
            Peserta Aktif Belajar
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>{pesertaSelesai}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
            Telah Lulus & Dapat Sertifikat
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{totalLulusPersen}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
            Tingkat Kelulusan
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama peserta atau email..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={15} color="var(--text-dim)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#162032',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.86rem'
            }}
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif Belajar</option>
            <option value="selesai">Selesai</option>
            <option value="menunggu_bayar">Menunggu Bayar</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Main Gradebook Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 700 }}>Peserta</th>
                <th style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 700 }}>Kontak (HP / Email)</th>
                <th style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 700, minWidth: '150px' }}>Progres Belajar</th>
                {modul.map((m) => (
                  <th key={m.id} style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Modul {m.urutan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={4 + totalModul} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    Tidak ada data peserta yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const progresPercent = totalModul > 0 ? Math.round((p.modul_lulus_count / totalModul) * 100) : 0;

                  return (
                    <tr
                      key={p.pendaftaran_id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {/* Nama Peserta */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.nama_lengkap}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Daftar: {new Date(p.didaftarkan_pada).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* Kontak Peserta (BR-12) */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          <Mail size={12} color="var(--text-dim)" />
                          <span>{p.email}</span>
                        </div>
                        {p.no_hp && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '3px' }}>
                            <Phone size={12} />
                            <span>{p.no_hp}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        {getStatusBadge(p.status_pendaftaran)}
                      </td>

                      {/* Progres Belajar (BR-11) */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>{p.modul_lulus_count}/{totalModul} Lulus</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>{progresPercent}%</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progresPercent}%`,
                            height: '100%',
                            backgroundColor: progresPercent === 100 ? '#10b981' : 'var(--primary)',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </td>

                      {/* Kolom Nilai per Modul (BR-12) */}
                      {modul.map((m) => {
                        const scoreInfo = p.nilai_per_modul?.find((score) => score.modul_id === m.id);

                        if (!scoreInfo || scoreInfo.jumlah_percobaan === 0) {
                          return (
                            <td key={m.id} style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-dim)' }}>
                              -
                            </td>
                          );
                        }

                        const isPassed = scoreInfo.lulus;

                        return (
                          <td key={m.id} style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                            }}>
                              <span style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: isPassed ? '#34d399' : '#f87171'
                              }}>
                                {scoreInfo.nilai_terbaik ?? 0}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                {scoreInfo.jumlah_percobaan}x coba
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
