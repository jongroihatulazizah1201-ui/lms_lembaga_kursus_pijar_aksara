'use client';

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfileAction } from '@/app/profil/actions';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Save,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';

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
      color: 'bg-purple-100 text-[#843bab] border-purple-200',
      description: 'Memiliki otoritas penuh atas penerbitan kursus, persetujuan instruktur, serta audit log sistem.',
      icon: Shield,
    },
    instruktur: {
      label: 'Instruktur Vokasi',
      color: 'bg-purple-100 text-[#843bab] border-purple-200',
      description: 'Mengelola materi kurikulum kursus, video pembelajaran, penugasan kuis, dan penilaian peserta.',
      icon: GraduationCap,
    },
    peserta: {
      label: 'Peserta Pelatihan',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Mengikuti kelas kursus vokasi, mengerjakan kuis evaluasi berkala, dan mengunduh sertifikat kelulusan.',
      icon: User,
    },
  }[profile.peran];

  const RoleIcon = roleConfig.icon;

  // Tanggal format Indonesia
  const formattedDate = profile.dibuat_pada
    ? new Date(profile.dibuat_pada).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  // Menentukan gambar avatar yang aktif
  const effectiveAvatar = isRemoveAvatar ? null : previewAvatarUrl || currentAvatarUrl;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 text-slate-900">
      {/* Navigasi Header Sticky: Tetap Stay di Atas Saat Di-scroll */}
      <header className="sticky top-[57px] lg:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href={
              profile.peran === 'admin'
                ? '/admin'
                : profile.peran === 'instruktur'
                ? '/instruktur'
                : '/kursus-saya'
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white shadow-2xs text-xs font-bold transition-all hover:bg-slate-50 cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Pengaturan Akun & Profil Pengguna
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Banner Judul Halaman */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] text-xs font-bold border border-[#843bab]/20 mb-2">
                <User size={13} />
                <span>Pengaturan Akun Pengguna</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Profil Saya
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Kelola identitas, foto profil, dan nomor kontak Anda di Lembaga Kursus Pijar Aksara.
              </p>
            </div>

            {/* Badge Peran */}
            <div className="sm:text-right shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-2xs ${roleConfig.color}`}
              >
                <RoleIcon size={14} />
                <span>{roleConfig.label}</span>
              </span>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center sm:justify-end gap-1">
                <Calendar size={12} />
                <span>Terdaftar sejak {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

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
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Profil */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Foto Profil & Simbol Avatar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-slate-900 mb-1">Foto Profil</h2>
            <p className="text-xs text-slate-500 mb-6">
              Gunakan foto asli Anda agar instruktur dan tim sertifikasi dapat mengenali Anda dengan mudah. Jika tidak ingin menggunakan foto, sistem akan menampilkan simbol profil default.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar Box */}
              <div className="relative group shrink-0 self-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center transition-all">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={`Foto profil ${profile.nama_lengkap}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Simbol User Default Sesuai Permintaan */
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                      <User size={48} strokeWidth={1.75} />
                    </div>
                  )}
                </div>

                {/* Badge Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#843bab] text-white shadow-md hover:bg-[#702f92] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Pilih foto profil baru"
                >
                  <Camera size={16} />
                </button>
              </div>

              {/* Action Buttons & Note */}
              <div className="space-y-3 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>Unggah Foto Baru</span>
                  </button>

                  {effectiveAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Gunakan Simbol User Default</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Format gambar yang didukung: JPG, PNG, atau WebP. Ukuran berkas maksimal 1 MB.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Identitas Pribadi & Nomor Kontak */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-slate-900 mb-1">Informasi Identitas</h2>
            <p className="text-xs text-slate-500 mb-5">
              Pastikan nama lengkap sesuai dengan kartu identitas resmi untuk keperluan pencetakan sertifikat kelulusan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Lengkap Field */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Nama ini akan dicetak langsung pada sertifikat resmi kelulusan kursus vokasi.
                </div>
              </div>

              {/* Alamat Email Field (Read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Alamat Email (Akun Utama)
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium select-none"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Email digunakan untuk autentikasi login akun dan tidak dapat diubah secara mandiri.
                </div>
              </div>

              {/* Nomor Handphone / WhatsApp (Dapat Diubah) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nomor Handphone / WhatsApp
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Nomor ini digunakan untuk konfirmasi pendaftaran kursus dan informasi jadwal belajar.
                </div>
              </div>
            </div>

            {/* Role Explanation Note */}
            <div className="pt-3 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 flex items-start gap-3">
                <RoleIcon size={18} className="text-[#843bab] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#843bab] block mb-0.5">
                    Peran Saat Ini: {roleConfig.label}
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {roleConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan Aksi */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 font-extrabold text-sm shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
