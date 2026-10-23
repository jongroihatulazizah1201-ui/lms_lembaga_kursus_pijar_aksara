'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Clock,
  User,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Shield,
  CreditCard,
  BookOpen,
  Filter,
  RotateCcw,
  X,
  Code,
  Layers,
  Activity,
  Settings,
} from 'lucide-react';

export interface AuditLogItem {
  id: string | number;
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
  const [filterCategory, setFilterCategory] = useState<string>('semua');
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Kategori Aksi
  const getActionCategory = (action: string) => {
    if (
      action.includes('kursus') ||
      action.includes('modul') ||
      action.includes('soal')
    ) {
      return 'kursus';
    }
    if (
      action.includes('pembayaran') ||
      action.includes('pendaftaran') ||
      action.includes('bayar')
    ) {
      return 'pendaftaran';
    }
    if (
      action.includes('peran') ||
      action.includes('status_pengguna') ||
      action.includes('user') ||
      action.includes('pengguna')
    ) {
      return 'pengguna';
    }
    return 'lainnya';
  };

  // Ringkasan Statistik
  const totalLogs = logs.length;
  const kursusLogsCount = logs.filter((l) => getActionCategory(l.aksi) === 'kursus').length;
  const pendaftaranLogsCount = logs.filter((l) => getActionCategory(l.aksi) === 'pendaftaran').length;
  const penggunaLogsCount = logs.filter((l) => getActionCategory(l.aksi) === 'pengguna').length;

  // Filter Data Log
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const actorName = log.pelaku?.nama_lengkap || '';
      const actorEmail = log.pelaku?.email || '';

      const matchesSearch =
        !q ||
        log.aksi.toLowerCase().includes(q) ||
        log.nama_tabel.toLowerCase().includes(q) ||
        (log.id_data && log.id_data.toLowerCase().includes(q)) ||
        actorName.toLowerCase().includes(q) ||
        actorEmail.toLowerCase().includes(q);

      const category = getActionCategory(log.aksi);
      const matchesCategory =
        filterCategory === 'semua' || category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchQuery, filterCategory]);

  const toggleExpand = (logId: string | number) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  // Badge Aksi
  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'terbitkan_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Terbitkan Kursus
          </span>
        );
      case 'kembalikan_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Kembalikan ke Draf
          </span>
        );
      case 'tutup_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            Tutup Kursus
          </span>
        );
      case 'buka_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Buka Kursus
          </span>
        );
      case 'ajukan_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
            Ajukan Kursus
          </span>
        );
      case 'ubah_kuota_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Ubah Kuota
          </span>
        );
      case 'ubah_harga_kursus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Ubah Harga
          </span>
        );
      case 'konfirmasi_pembayaran':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Konfirmasi Bayar
          </span>
        );
      case 'batalkan_pendaftaran':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            Batal Pendaftaran
          </span>
        );
      case 'ubah_peran_pengguna':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Ubah Peran
          </span>
        );
      case 'ubah_status_pengguna':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            Ubah Status Akun
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STICKY TOP HEADER: Judul Halaman & Toolbar Pencarian/Filter Audit Log */}
      <div className="sticky top-[57px] lg:top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4 transition-all">
        {/* Judul Halaman */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-2xs">
              <Settings size={18} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Audit Log Sistem
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                {logs.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aksi, nama pelaku, email, atau tabel..."
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 focus:border-[#843bab] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'semua', label: 'Semua Kategori' },
              { id: 'kursus', label: 'Kursus', count: kursusLogsCount },
              { id: 'pendaftaran', label: 'Pendaftaran', count: pendaftaranLogsCount },
              { id: 'pengguna', label: 'Pengguna', count: penggunaLogsCount },
            ].map((cat) => {
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.count !== undefined && cat.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-[#ffdf0f] text-slate-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}

            {(searchQuery || filterCategory !== 'semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('semua');
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 transition-colors cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI Cards Ringkasan Audit Log */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Log Aktivitas
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalLogs}</div>
          <div className="text-xs text-slate-500 mt-1">Audit trail aktivitas sistem</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aktivitas Kursus
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843bab] flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#843bab]">{kursusLogsCount}</div>
          <div className="text-xs text-slate-500 mt-1">Siklus terbit & revisi</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transaksi & Bayar
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{pendaftaranLogsCount}</div>
          <div className="text-xs text-slate-500 mt-1">Konfirmasi & pembatalan</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Manajemen Akun
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{penggunaLogsCount}</div>
          <div className="text-xs text-slate-500 mt-1">Peran & status pengguna</div>
        </div>
      </div>

      {/* 3. Tabel Riwayat Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              Riwayat Aktivitas & Perubahan Data
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#843bab]/10 text-[#843bab]">
              {filteredLogs.length} Catatan
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Immutable Audit Trail sesuai standar integritas sistem
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[170px]">Waktu Kejadian</th>
                <th className="py-3.5 px-4 min-w-[200px]">Pelaku Aksi</th>
                <th className="py-3.5 px-4 min-w-[170px]">Jenis Aksi</th>
                <th className="py-3.5 px-4 min-w-[150px]">Target Data</th>
                <th className="py-3.5 px-4 text-right min-w-[100px]">Rincian</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileText size={24} />
                      </div>
                      <div className="font-bold text-slate-800 text-base">
                        Tidak Ada Catatan Log Ditemukan
                      </div>
                      <p className="text-xs text-slate-500">
                        {searchQuery || filterCategory !== 'semua'
                          ? 'Tidak ada log aktivitas yang cocok dengan kriteria pencarian saat ini.'
                          : 'Belum ada rekaman audit log di sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasChanges = log.data_sebelum || log.data_sesudah;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-purple-50/20 transition-colors ${
                          isExpanded ? 'bg-purple-50/30' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-4 px-4 text-center text-xs text-slate-400 font-semibold">
                          {idx + 1}
                        </td>

                        {/* Waktu */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {formatDate(log.dibuat_pada)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            #{log.id}
                          </div>
                        </td>

                        {/* Pelaku */}
                        <td className="py-4 px-4">
                          {log.pelaku ? (
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{log.pelaku.nama_lengkap}</span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-50 text-[#843bab] uppercase">
                                  {log.pelaku.peran}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {log.pelaku.email}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic">
                              Sistem Otomatis
                            </div>
                          )}
                        </td>

                        {/* Jenis Aksi */}
                        <td className="py-4 px-4">
                          {renderActionBadge(log.aksi)}
                        </td>

                        {/* Target Data */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800">
                            <Database size={12} className="text-slate-400" />
                            <span>{log.nama_tabel}</span>
                          </div>
                          {log.id_data && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {String(log.id_data).substring(0, 8)}...
                            </div>
                          )}
                        </td>

                        {/* Tombol Rincian / Expand */}
                        <td className="py-4 px-4 text-right">
                          {hasChanges ? (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Lihat Diff'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              -
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diff Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={6} className="p-5">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                  <Code size={14} className="text-[#843bab]" />
                                  <span>Rincian Perubahan Data (Snapshot Audit)</span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Log ID: {log.id}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                {/* Data Sebelum */}
                                <div className="space-y-1.5">
                                  <div className="font-sans font-bold text-red-700 text-[11px] flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    Data Sebelum (Old State)
                                  </div>
                                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-60">
                                    {log.data_sebelum
                                      ? JSON.stringify(log.data_sebelum, null, 2)
                                      : '// Data null / rekaman baru dibuat'}
                                  </pre>
                                </div>

                                {/* Data Sesudah */}
                                <div className="space-y-1.5">
                                  <div className="font-sans font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Data Sesudah (New State)
                                  </div>
                                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-60">
                                    {log.data_sesudah
                                      ? JSON.stringify(log.data_sesudah, null, 2)
                                      : '// Data null / rekaman dihapus'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
