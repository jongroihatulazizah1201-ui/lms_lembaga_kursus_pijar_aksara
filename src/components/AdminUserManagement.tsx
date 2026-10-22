'use client';

import React, { useState, useMemo } from 'react';
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
  Calendar,
  Mail,
  Phone,
  RotateCcw,
  X,
  AlertTriangle,
  GraduationCap,
  PenTool,
  Check,
  ChevronDown,
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

  // Modal Ubah Peran State
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'peserta' | 'instruktur' | 'admin'>('peserta');

  // Modal Nonaktifkan / Aktifkan State
  const [statusModalUser, setStatusModalUser] = useState<UserItem | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Ringkasan Statistik
  const totalUsers = users.length;
  const totalPeserta = users.filter((u) => u.peran === 'peserta').length;
  const totalInstruktur = users.filter((u) => u.peran === 'instruktur').length;
  const totalAdmin = users.filter((u) => u.peran === 'admin').length;
  const totalNonaktif = users.filter((u) => !u.aktif).length;

  // Filter Data Pengguna
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.nama_lengkap.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.no_hp && u.no_hp.toLowerCase().includes(q));

      const matchesRole = filterRole === 'semua' || u.peran === filterRole;
      const matchesStatus =
        filterStatus === 'semua' ||
        (filterStatus === 'aktif' && u.aktif) ||
        (filterStatus === 'nonaktif' && !u.aktif);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  // Action: Eksekusi Ubah Peran (BR-12)
  const handleExecuteUbahPeran = async () => {
    if (!roleModalUser) return;

    if (roleModalUser.id === currentAdminId && selectedNewRole !== 'admin') {
      alert('Demi keamanan sistem, Admin tidak diizinkan menurunkan peran akunnya sendiri (BR-12).');
      return;
    }

    setLoadingId(roleModalUser.id);
    setFeedbackMsg(null);
    const res = await ubahPeranPenggunaAction(roleModalUser.id, selectedNewRole);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Peran akun "${roleModalUser.nama_lengkap}" berhasil diperbarui menjadi ${selectedNewRole.toUpperCase()} (BR-12).`,
      });
      setRoleModalUser(null);
      router.refresh();
    }
  };

  // Action: Eksekusi Ubah Status Aktif (BR-12)
  const handleExecuteToggleStatus = async () => {
    if (!statusModalUser) return;

    const newStatus = !statusModalUser.aktif;

    if (statusModalUser.id === currentAdminId && !newStatus) {
      alert('Admin tidak boleh menonaktifkan akunnya sendiri (BR-12).');
      return;
    }

    setLoadingId(statusModalUser.id);
    setFeedbackMsg(null);
    const res = await ubahStatusPenggunaAction(statusModalUser.id, newStatus);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Status akun "${statusModalUser.nama_lengkap}" berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Dinonaktifkan'} (BR-12).`,
      });
      setStatusModalUser(null);
      router.refresh();
    }
  };

  // Badge Peran
  const renderRoleBadge = (role: UserItem['peran']) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield size={12} className="text-rose-600" />
            Admin
          </span>
        );
      case 'instruktur':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
            <PenTool size={12} className="text-[#843bab]" />
            Instruktur
          </span>
        );
      case 'peserta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <GraduationCap size={12} className="text-blue-600" />
            Peserta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner Feedback */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-2xl text-sm font-medium border shadow-xs animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. KPI Cards Ringkasan Pengguna */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengguna
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalUsers}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalNonaktif > 0 ? `${totalNonaktif} dinonaktifkan` : 'Semua akun aktif'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Peserta Terdaftar
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-600">{totalPeserta}</div>
          <div className="text-xs text-slate-500 mt-1">Siswa vokasi aktif</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Instruktur Kursus
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843bab] flex items-center justify-center">
              <PenTool size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#843bab]">{totalInstruktur}</div>
          <div className="text-xs text-slate-500 mt-1">Pengajar & pembuat kursus</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administrator
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{totalAdmin}</div>
          <div className="text-xs text-slate-500 mt-1">Pengelola sistem LMS</div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengguna, email, atau no HP..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 focus:border-[#843bab] transition-all"
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

        {/* Filter Role & Status Dropdowns / Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'semua', label: 'Semua Peran' },
              { id: 'peserta', label: 'Peserta' },
              { id: 'instruktur', label: 'Instruktur' },
              { id: 'admin', label: 'Admin' },
            ].map((r) => {
              const isActive = filterRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setFilterRole(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#843bab] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#843bab]/20 cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Akun Aktif</option>
            <option value="nonaktif">Dinonaktifkan</option>
          </select>

          {/* Reset Button */}
          {(searchQuery || filterRole !== 'semua' || filterStatus !== 'semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterRole('semua');
                setFilterStatus('semua');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabel Kelola Akun & Peran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              Daftar Akun Pengguna
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#843bab]/10 text-[#843bab]">
              {filteredUsers.length} Pengguna
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Aksi admin: ubah peran akun atau nonaktifkan akses (BR-12)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[220px]">Nama Pengguna</th>
                <th className="py-3.5 px-4 min-w-[220px]">Email & Kontak</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Peran Akun</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Status Akun</th>
                <th className="py-3.5 px-4 min-w-[140px]">Bergabung</th>
                <th className="py-3.5 px-4 text-right min-w-[200px]">Aksi Admin</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users size={24} />
                      </div>
                      <div className="font-bold text-slate-800 text-base">
                        Tidak Ada Pengguna Ditemukan
                      </div>
                      <p className="text-xs text-slate-500">
                        {searchQuery || filterRole !== 'semua' || filterStatus !== 'semua'
                          ? 'Tidak ada akun yang sesuai dengan filter atau kata kunci pencarian saat ini.'
                          : 'Belum ada pengguna yang terdaftar di dalam sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isCurrentAdmin = u.id === currentAdminId;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center text-xs text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Nama Pengguna */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shadow-2xs shrink-0 ${
                              u.peran === 'admin'
                                ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                                : u.peran === 'instruktur'
                                ? 'bg-gradient-to-br from-[#843bab] to-purple-700'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}
                          >
                            {u.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2 group-hover:text-[#843bab] transition-colors">
                              <span>{u.nama_lengkap}</span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              ID: {u.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Kontak */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{u.email}</span>
                          </div>
                          {u.no_hp && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{u.no_hp}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Peran Akun */}
                      <td className="py-4 px-4 text-center">
                        {renderRoleBadge(u.peran)}
                      </td>

                      {/* Status Akun */}
                      <td className="py-4 px-4 text-center">
                        {u.aktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={11} className="text-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <X size={11} className="text-rose-600" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Tanggal Bergabung */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {formatDate(u.dibuat_pada)}
                      </td>

                      {/* Aksi Admin: Ubah Peran & Nonaktifkan */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Tombol Ubah Peran */}
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedNewRole(u.peran);
                            }}
                            disabled={loadingId === u.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-[#843bab] text-[#843bab] hover:text-white font-bold text-xs border border-purple-200/60 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            title="Ubah Peran Akun"
                          >
                            <Shield size={12} />
                            <span>Ubah Peran</span>
                          </button>

                          {/* Tombol Nonaktifkan / Aktifkan */}
                          <button
                            onClick={() => setStatusModalUser(u)}
                            disabled={loadingId === u.id || isCurrentAdmin}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs border shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.aktif
                                ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={isCurrentAdmin ? 'Tidak bisa menonaktifkan akun sendiri' : u.aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.aktif ? <UserX size={12} /> : <UserCheck size={12} />}
                            <span>{u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          4. MODAL UBAH PERAN PENGGUNA (BR-12)
         ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Ubah Peran Pengguna
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Atur hak akses akun &ldquo;{roleModalUser.nama_lengkap}&rdquo; di LMS Pijar Aksara.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Email Pengguna:</span>
                <strong className="text-slate-900">{roleModalUser.email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peran Saat Ini:</span>
                <span className="font-bold text-slate-800 uppercase">{roleModalUser.peran}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pilih Peran Baru:
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'peserta',
                    label: 'Peserta',
                    desc: 'Dapat mendaftar kursus, membaca modul, mengikuti kuis, dan memperoleh sertifikat.',
                  },
                  {
                    id: 'instruktur',
                    label: 'Instruktur',
                    desc: 'Dapat mengelola materi silabus, membuat kuis, dan melihat buku nilai kursus milik sendiri.',
                  },
                  {
                    id: 'admin',
                    label: 'Administrator',
                    desc: 'Akses penuh mengelola seluruh kursus, konfirmasi transaksi, akun pengguna, dan audit log.',
                  },
                ].map((r) => {
                  const isSelected = selectedNewRole === r.id;
                  return (
                    <label
                      key={r.id}
                      onClick={() => setSelectedNewRole(r.id as any)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50/60 border-[#843bab] ring-1 ring-[#843bab]'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="peran"
                        value={r.id}
                        checked={isSelected}
                        onChange={() => setSelectedNewRole(r.id as any)}
                        className="mt-0.5 text-[#843bab] focus:ring-[#843bab]"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{r.label}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteUbahPeran}
                disabled={loadingId === roleModalUser.id || selectedNewRole === roleModalUser.peran}
                className="px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#6c2e8f] text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingId === roleModalUser.id ? 'Menyimpan...' : 'Simpan Peran Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAL NONAKTIFKAN / AKTIFKAN AKUN PENGGUNA (BR-12)
         ========================================================================= */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  statusModalUser.aktif
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {statusModalUser.aktif ? <UserX size={24} /> : <UserCheck size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {statusModalUser.aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun Kembali'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Konfirmasi pengubahan status akses untuk akun &ldquo;{statusModalUser.nama_lengkap}&rdquo;.
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                statusModalUser.aktif
                  ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
              }`}
            >
              {statusModalUser.aktif ? (
                <>
                  <strong>Peringatan Nonaktif:</strong> Akun yang dinonaktifkan tidak akan dapat masuk ke sistem LMS, mengakses modul pembelajaran, maupun mengelola kursus sampai diaktifkan kembali oleh Administrator.
                </>
              ) : (
                <>
                  <strong>Pemulihan Akses:</strong> Akun akan dapat kembali masuk dan melanjutkan aktivitas belajar/mengajar seperti semula.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteToggleStatus}
                disabled={loadingId === statusModalUser.id}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 ${
                  statusModalUser.aktif
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loadingId === statusModalUser.id
                  ? 'Memproses...'
                  : statusModalUser.aktif
                  ? 'Ya, Nonaktifkan Akun'
                  : 'Ya, Aktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
