'use client';

import React, { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfileAction } from '@/app/profil/actions';
import {
  User,
  Shield,
  ShieldCheck,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

interface ProfileData {
  id: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  peran: 'peserta' | 'instruktur' | 'admin';
  avatar_url: string | null;
  dibuat_pada: string;
}

interface Props {
  profile: ProfileData;
}

export default function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState(profile.nama_lengkap || '');
  const [nomorHp, setNomorHp] = useState(profile.no_hp || '');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRemoveAvatar, setIsRemoveAvatar] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Penanganan Pemilihan Berkas Foto Profil
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran (Maks 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto profil maksimal 1 MB.' });
      return;
    }

    // Validasi Tipe
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Harap pilih file gambar dengan format JPG, PNG, atau WebP.' });
      return;
    }

    setSelectedFile(file);
    setIsRemoveAvatar(false);
    setMessage(null);

    // Tampilkan pratinjau (Preview)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Penanganan Hapus Foto Profil (Kembali ke Simbol User Default)
  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewAvatarUrl(null);
    setIsRemoveAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset perubahan (Cancel)
  const handleCancel = () => {
    setNamaLengkap(profile.nama_lengkap || '');
    setNomorHp(profile.no_hp || '');
    setPreviewAvatarUrl(null);
    setSelectedFile(null);
    setIsRemoveAvatar(false);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Penanganan Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append('nama_lengkap', namaLengkap);
    formData.append('nomor_hp', nomorHp);

    if (isRemoveAvatar) {
      formData.append('remove_avatar', 'true');
    } else if (selectedFile) {
      formData.append('avatar_file', selectedFile);
    }

    startTransition(async () => {
      try {
        const res = await updateProfileAction(formData);
        if (res?.error) {
          setMessage({ type: 'error', text: res.error });
        } else if (res?.success) {
          setMessage({ type: 'success', text: res.message || 'Profil berhasil diperbarui.' });
          const newAvatar = res.avatarUrl !== undefined ? res.avatarUrl : currentAvatarUrl;
          if (res.avatarUrl !== undefined) {
            setCurrentAvatarUrl(res.avatarUrl);
            setPreviewAvatarUrl(null);
            setSelectedFile(null);
            setIsRemoveAvatar(false);
          }

          // Sinkronkan ke seluruh UI (Sidebar capsule, badge, dsb.) secara seketika tanpa jeda
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lms:profile-updated', {
                detail: {
                  nama_lengkap: namaLengkap,
                  no_hp: nomorHp,
                  avatar_url: newAvatar,
                },
              })
            );
          }

          // Segarkan data server components layout
          router.refresh();
        }
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: 'Terjadi kendala jaringan saat menyimpan profil. Silakan coba lagi.',
        });
      }
    });
  };

  // Deskripsi Peran & Skema Warna
  const roleConfig = {
    admin: {
      label: 'Administrator Sistem',
      description: 'Memiliki otoritas penuh atas penerbitan kursus, persetujuan instruktur, serta audit log sistem.',
      icon: Shield,
    },
    instruktur: {
      label: 'Instruktur Vokasi',
      description: 'Mengelola materi kurikulum kursus, video pembelajaran, penugasan kuis, dan penilaian peserta.',
      icon: GraduationCap,
    },
    peserta: {
      label: 'Peserta Pelatihan',
      description: 'Mengikuti kelas kursus vokasi, mengerjakan kuis evaluasi berkala, dan mengunduh sertifikat kelulusan.',
      icon: User,
    },
  }[profile.peran];

  // Menentukan gambar avatar yang aktif
  const effectiveAvatar = isRemoveAvatar ? null : previewAvatarUrl || currentAvatarUrl;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 text-slate-900 select-text">
      {/* Navigasi Header Sticky: Tetap Stay di Atas Saat Di-scroll */}
      <header className="sticky top-[57px] lg:top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href={
              profile.peran === 'admin'
                ? '/admin'
                : profile.peran === 'instruktur'
                ? '/instruktur'
                : '/dashboard'
            }
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white shadow-2xs text-xs font-bold transition-all hover:bg-slate-50 cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Pengaturan Akun &amp; Profil Pengguna
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 shadow-xs transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium text-xs sm:text-sm">{message.text}</div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================
            CARD 1: PROFILE SETTINGS (SESUAI DESAIN REFERENSI)
           ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <form onSubmit={handleSubmit} id="profile-form">
            {/* Header Profil & Tombol Aksi */}
            <div className="p-6 sm:p-7 flex items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Profil Pengguna
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan identitas dan profil pribadi Anda
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#843bab] hover:bg-[#722f96] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <LoadingSpinner size="xs" variant="white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-6">
              {/* Profile Picture Section */}
              <div className="pb-6 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-900 mb-3">
                  Foto Profil
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200/90 shrink-0 flex items-center justify-center shadow-2xs">
                      {effectiveAvatar ? (
                        <img
                          src={effectiveAvatar}
                          alt={namaLengkap || profile.nama_lengkap}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={26} className="text-slate-400" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-snug">
                        {namaLengkap || profile.nama_lengkap}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {roleConfig.label}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Foto */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {effectiveAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-medium transition-all cursor-pointer"
                        title="Kembali ke simbol avatar default"
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <Upload size={14} className="text-slate-500" />
                      <span>Unggah Foto</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Information Banner (Sesuai Referensi Visual) */}
              <div className="p-3.5 rounded-xl border border-purple-200/90 bg-purple-50/50 flex items-center gap-3 text-xs text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-[#843bab] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck size={15} />
                </div>
                <div className="leading-relaxed">
                  Akun ini terdaftar resmi di <strong className="text-slate-900 font-bold">Lembaga Kursus Pijar Aksara</strong>. Alamat email Anda diverifikasi dan terikat pada hak belajar serta sertifikasi.
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:ring-1 focus:ring-[#843bab] transition-all font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama ini akan dicetak langsung pada sertifikat resmi kelulusan kursus vokasi.
                  </p>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed select-none font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Alamat email digunakan untuk autentikasi masuk dan tidak dapat diubah secara mandiri.
                  </p>
                </div>

                {/* Nomor Handphone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor Handphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:ring-1 focus:ring-[#843bab] transition-all font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nomor kontak aktif untuk informasi jadwal belajar dan notifikasi kursus.
                  </p>
                </div>

                {/* Role Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Peran Akun
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center justify-between cursor-default">
                    <span className="font-medium">{roleConfig.label}</span>
                    <ChevronDown size={15} className="text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {roleConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* =========================================================
            CARD 2: DANGER ZONE (SESUAI DESAIN REFERENSI)
           ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-red-600">
              Zona Bahaya
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesi &amp; keamanan akun pengguna
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Mengakhiri sesi akun di perangkat ini akan menutup akses dashboard sampai Anda masuk kembali. Seluruh rekam jejak belajar, nilai kuis terbaik, dan sertifikat resmi Anda tetap tersimpan dengan aman di server.
          </p>

          <div>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Keluar dari Akun
            </button>
          </div>
        </div>

        {/* Modal Konfirmasi Logout */}
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          userName={profile.nama_lengkap}
        />
      </div>
    </div>
  );
}
