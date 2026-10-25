'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Calendar,
  User,
  BookOpen,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { konfirmasiPembayaranAction, batalkanPendaftaranAction } from '@/app/admin/actions';
import { getSignedBuktiBayarUrlAction } from '@/app/kursus-saya/actions';

export interface RegistrationItem {
  id: string;
  status: 'menunggu_bayar' | 'aktif' | 'selesai' | 'kedaluwarsa' | 'dibatalkan';
  nominal: number;
  metode_bayar: 'gratis' | 'transfer_manual' | 'mayar';
  batas_bayar: string | null;
  bukti_bayar_path?: string | null;
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

  // Modal Konfirmasi Pembayaran State
  const [confirmModalReg, setConfirmModalReg] = useState<RegistrationItem | null>(null);

  // Modal Pembatalan Pendaftaran State
  const [cancelModalReg, setCancelModalReg] = useState<RegistrationItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Modal Lihat Bukti Pembayaran (Signed URL)
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<{
    isOpen: boolean;
    url: string | null;
    studentName?: string;
    courseTitle?: string;
  }>({
    isOpen: false,
    url: null,
  });

  const handleLihatBukti = async (reg: RegistrationItem) => {
    setLoadingProofId(reg.id);
    try {
      const res = await getSignedBuktiBayarUrlAction(reg.id);
      if (res.signedUrl) {
        setProofModal({
          isOpen: true,
          url: res.signedUrl,
          studentName: reg.peserta.nama_lengkap,
          courseTitle: reg.kursus.judul,
        });
      } else {
        alert(res.error || 'Gagal memuat bukti pembayaran.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat memuat bukti.');
    } finally {
      setLoadingProofId(null);
    }
  };

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

  // Ringkasan Statistik
  const totalPendaftaran = registrations.length;
  const menungguBayarCount = registrations.filter((r) => r.status === 'menunggu_bayar').length;
  const aktifCount = registrations.filter((r) => r.status === 'aktif').length;
  const selesaiCount = registrations.filter((r) => r.status === 'selesai').length;
  const totalNominalAktif = registrations
    .filter((r) => r.status === 'aktif' || r.status === 'selesai')
    .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

  // Filter Data Pendaftaran
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.peserta.nama_lengkap.toLowerCase().includes(q) ||
        r.peserta.email.toLowerCase().includes(q) ||
        (r.peserta.no_hp && r.peserta.no_hp.toLowerCase().includes(q)) ||
        r.kursus.judul.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'semua' || r.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, filterStatus]);

  // Action: Eksekusi Konfirmasi Pembayaran (menunggu_bayar -> aktif, BR-07)
  const handleExecuteKonfirmasi = async () => {
    if (!confirmModalReg) return;

    setLoadingId(confirmModalReg.id);
    setFeedbackMsg(null);
    const res = await konfirmasiPembayaranAction(confirmModalReg.id);
    setLoadingId(null);

    if (res?.error) {
      setFeedbackMsg({ type: 'error', text: res.error });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Pembayaran ${confirmModalReg.peserta.nama_lengkap} (${formatRupiah(confirmModalReg.nominal)}) berhasil dikonfirmasi. Status pendaftaran kini Aktif Belajar.`,
      });
      setConfirmModalReg(null);
      router.refresh();
    }
  };

  // Action: Eksekusi Batalkan Pendaftaran (BR-07)
  const handleExecuteBatal = async () => {
    if (!cancelModalReg) return;

    if (cancelReason.trim().length < 10) {
      setCancelError('Alasan pembatalan pendaftaran wajib diisi minimal 10 karakter sesuai ketentuan sistem.');
      return;
    }

    setLoadingId(cancelModalReg.id);
    setCancelError(null);
    const res = await batalkanPendaftaranAction(cancelModalReg.id, cancelReason);
    setLoadingId(null);

    if (res?.error) {
      setCancelError(res.error);
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Pendaftaran ${cancelModalReg.peserta.nama_lengkap} pada kursus "${cancelModalReg.kursus.judul}" berhasil dibatalkan.`,
      });
      setCancelModalReg(null);
      setCancelReason('');
      router.refresh();
    }
  };

  // Badge Status Pendaftaran
  const renderStatusBadge = (status: RegistrationItem['status']) => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif Belajar
          </span>
        );
      case 'menunggu_bayar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} className="text-amber-600" />
            Menunggu Bayar
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
            <CheckCircle2 size={12} className="text-[#843bab]" />
            Selesai
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} className="text-red-600" />
            Dibatalkan
          </span>
        );
      case 'kedaluwarsa':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
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
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
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

      {/* 1. STICKY TOP HEADER: Judul Halaman & Toolbar Pencarian/Filter Pendaftaran */}
      <div className="sticky top-[57px] lg:top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4 transition-all">
        {/* Judul Halaman */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard size={18} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Pendaftaran & Pembayaran (Konfirmasi, Batal)
              </h1>
              {menungguBayarCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                  {menungguBayarCount} Menunggu
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  {registrations.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama peserta, email, no HP, atau kursus..."
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

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'menunggu_bayar', label: 'Menunggu Bayar', count: menungguBayarCount },
            { id: 'aktif', label: 'Aktif Belajar' },
            { id: 'selesai', label: 'Selesai' },
            { id: 'dibatalkan', label: 'Dibatalkan' },
            { id: 'kedaluwarsa', label: 'Kedaluwarsa' },
          ].map((st) => {
            const isActive = filterStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#843bab] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{st.label}</span>
                {st.count !== undefined && st.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-[#ffdf0f] text-slate-900' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {st.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>

      {/* 2. KPI Cards Ringkasan Pendaftaran */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pendaftaran
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalPendaftaran}</div>
          <div className="text-xs text-slate-500 mt-1">Semua riwayat pendaftaran</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Perlu Konfirmasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{menungguBayarCount}</div>
          <div className="text-xs text-slate-500 mt-1">Status menunggu bayar</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Peserta Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{aktifCount}</div>
          <div className="text-xs text-slate-500 mt-1">Belajar di ruang kursus</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nominal Terverifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843bab] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
            {formatRupiah(totalNominalAktif)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{aktifCount + selesaiCount} transaksi berhasil</div>
        </div>
      </div>

      {/* 3. Tabel Pendaftaran & Pembayaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              Daftar Transaksi Pendaftaran
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#843bab]/10 text-[#843bab]">
              {filteredRegistrations.length} Data
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Aksi admin: konfirmasi manual atau batalkan pendaftaran
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[220px]">Peserta</th>
                <th className="py-3.5 px-4 min-w-[220px]">Kursus Vokasi</th>
                <th className="py-3.5 px-4 min-w-[150px]">Nominal & Metode</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Status</th>
                <th className="py-3.5 px-4 min-w-[170px]">Waktu & Batas</th>
                <th className="py-3.5 px-4 text-right min-w-[180px]">Aksi Admin</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <CreditCard size={24} />
                      </div>
                      <div className="font-bold text-slate-800 text-base">
                        Tidak Ada Data Pendaftaran
                      </div>
                      <p className="text-xs text-slate-500">
                        {searchQuery || filterStatus !== 'semua'
                          ? 'Tidak ada pendaftaran yang sesuai dengan filter atau kata kunci pencarian saat ini.'
                          : 'Belum ada pendaftaran kursus yang masuk ke dalam sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg, idx) => {
                  const isMenungguBayar = reg.status === 'menunggu_bayar';
                  const isAktif = reg.status === 'aktif';
                  const canCancel = isMenungguBayar || isAktif;

                  return (
                    <tr
                      key={reg.id}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center text-xs text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Peserta */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#843bab] to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                            {reg.peserta.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#843bab] transition-colors">
                              {reg.peserta.nama_lengkap}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Mail size={11} className="text-slate-400" />
                              <span>{reg.peserta.email}</span>
                            </div>
                            {reg.peserta.no_hp && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Phone size={10} className="text-slate-400" />
                                <span>{reg.peserta.no_hp}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kursus */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {reg.kursus.judul}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Harga Katalog: {reg.kursus.harga === 0 ? 'Gratis' : formatRupiah(reg.kursus.harga)}
                        </div>
                      </td>

                      {/* Nominal & Metode */}
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900">
                          {reg.nominal === 0 ? 'Gratis' : formatRupiah(reg.nominal)}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {reg.metode_bayar.replace('_', ' ')}
                          </span>

                          {reg.bukti_bayar_path ? (
                            <button
                              type="button"
                              onClick={() => handleLihatBukti(reg)}
                              disabled={loadingProofId === reg.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#843bab] border border-purple-200 transition-colors cursor-pointer"
                              title="Buka bukti pembayaran (Signed URL 60 menit)"
                            >
                              <FileText size={10} />
                              <span>{loadingProofId === reg.id ? 'Memuat...' : 'Bukti Bayar'}</span>
                            </button>
                          ) : reg.metode_bayar === 'transfer_manual' && reg.status === 'menunggu_bayar' ? (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Belum Unggah
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status Pendaftaran */}
                      <td className="py-4 px-4 text-center">
                        <div>{renderStatusBadge(reg.status)}</div>
                        {reg.alasan_batal && (
                          <div
                            className="text-[11px] text-red-600 mt-1 max-w-[160px] truncate mx-auto"
                            title={`Alasan Batal: "${reg.alasan_batal}"`}
                          >
                            Alasan: &ldquo;{reg.alasan_batal}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Waktu & Batas */}
                      <td className="py-4 px-4 text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="text-slate-400">Daftar:</span> {formatDate(reg.didaftarkan_pada)}
                        </div>
                        {isMenungguBayar && reg.batas_bayar && (
                          <div className="text-amber-700 font-semibold flex items-center gap-1">
                            <Clock size={11} className="text-amber-600" />
                            <span>Batas: {formatDate(reg.batas_bayar)}</span>
                          </div>
                        )}
                        {reg.dibayar_pada && (
                          <div className="text-emerald-700 font-medium">
                            <span className="text-slate-400">Lunas:</span> {formatDate(reg.dibayar_pada)}
                          </div>
                        )}
                      </td>

                      {/* Aksi Admin (Konfirmasi / Batal) */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Tombol Konfirmasi Pembayaran */}
                          {isMenungguBayar && (
                            <button
                              onClick={() => setConfirmModalReg(reg)}
                              disabled={loadingId === reg.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              title="Konfirmasi Pembayaran Manual"
                            >
                              <CheckCircle2 size={13} />
                              <span>Konfirmasi</span>
                            </button>
                          )}

                          {/* Tombol Batalkan Pendaftaran */}
                          {canCancel && (
                            <button
                              onClick={() => {
                                setCancelModalReg(reg);
                                setCancelReason('');
                                setCancelError(null);
                              }}
                              disabled={loadingId === reg.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Batalkan Pendaftaran"
                            >
                              <XCircle size={13} />
                              <span>Batal</span>
                            </button>
                          )}

                          {!canCancel && (
                            <span className="text-xs text-slate-400 italic">
                              Tidak ada aksi
                            </span>
                          )}
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
          4. MODAL KONFIRMASI PEMBAYARAN (menunggu_bayar -> aktif, BR-07)
         ========================================================================= */}
      {confirmModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Verifikasi pembayaran masuk dan aktifkan akses ruang belajar peserta.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Peserta:</span>
                <strong className="text-slate-900">{confirmModalReg.peserta.nama_lengkap}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kursus:</span>
                <strong className="text-slate-900 line-clamp-1">{confirmModalReg.kursus.judul}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <strong className="text-emerald-700 text-sm">
                  {confirmModalReg.nominal === 0 ? 'Gratis' : formatRupiah(confirmModalReg.nominal)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-semibold text-slate-700 uppercase">
                  {confirmModalReg.metode_bayar.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Setelah dikonfirmasi, status pendaftaran berubah menjadi <strong>Aktif Belajar</strong> dan peserta dapat segera mengakses modul, video, dan kuis.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalReg(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteKonfirmasi}
                disabled={loadingId === confirmModalReg.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingId === confirmModalReg.id ? 'Memproses...' : 'Ya, Konfirmasi Lunas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAL BATALKAN PENDAFTARAN (alasan wajib >= 10 karakter, BR-07)
         ========================================================================= */}
      {cancelModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Batalkan Pendaftaran
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pembatalan pendaftaran peserta pada kursus &ldquo;{cancelModalReg.kursus.judul}&rdquo;.
                </p>
              </div>
            </div>

            <div className="bg-red-50/60 rounded-2xl p-3.5 border border-red-200 text-xs text-red-800 leading-relaxed">
              <strong>Ketentuan Pembatalan:</strong> Pembatalan pendaftaran akan mengembalikan 1 kuota kursi kursus dan mencatat riwayat pembatalan ke Audit Log. Alasan pembatalan wajib diisi minimal 10 karakter.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alasan Pembatalan <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError(null);
                }}
                placeholder="Contoh: Bukti transfer tidak valid dan peserta tidak merespons konfirmasi dalam 24 jam..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <div className="flex justify-between items-center mt-1 text-[11px]">
                <span className={cancelReason.trim().length < 10 ? 'text-amber-600' : 'text-emerald-600'}>
                  {cancelReason.trim().length}/10 karakter minimal
                </span>
                {cancelError && <span className="text-red-600 font-semibold">{cancelError}</span>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalReg(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecuteBatal}
                disabled={loadingId === cancelModalReg.id || cancelReason.trim().length < 10}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingId === cancelModalReg.id ? 'Membatalkan...' : 'Batalkan Pendaftaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL LIHAT BUKTI PEMBAYARAN (SIGNED URL MAKSIMAL 60 MENIT)
         ========================================================================= */}
      {proofModal.isOpen && proofModal.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843bab] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bukti Pembayaran Transfer Manual
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {proofModal.studentName} &bull; {proofModal.courseTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofModal({ isOpen: false, url: null })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-purple-50/60 rounded-2xl p-3 border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#843bab] shrink-0" />
              <span>
                Tautan unduh aman (signed URL) ini hanya berlaku maksimal 60 menit dari Supabase Storage privat.
              </span>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              {proofModal.url.toLowerCase().includes('.pdf') ? (
                <div className="w-full text-center py-10 space-y-3">
                  <FileText size={48} className="mx-auto text-purple-600" />
                  <p className="text-sm font-bold text-slate-800">Dokumen PDF Bukti Transfer</p>
                  <a
                    href={proofModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#703291] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Buka PDF di Tab Baru</span>
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={proofModal.url}
                  alt="Bukti Transfer Pembayaran"
                  className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <a
                href={proofModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#843bab] font-bold text-xs transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Buka di Tab Baru</span>
              </a>
              <button
                type="button"
                onClick={() => setProofModal({ isOpen: false, url: null })}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
