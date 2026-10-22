'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerAction } from '@/app/auth/actions';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';

interface Props {
  redirectParam?: string;
}

export default function RegisterForm({ redirectParam = '' }: Props) {
  const router = useRouter();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Kriteria Kata Sandi Kuat (Strong Password Rules)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/~`']/.test(password);

  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const isPasswordStrong = criteriaCount === 5;
  const passwordsMatch = password.length > 0 && password === konfirmasiPassword;

  // Evaluasi Level Kekuatan Sandi
  const getStrengthMeta = () => {
    if (password.length === 0) return { label: 'Belum diisi', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (criteriaCount <= 2) return { label: 'Sangat Lemah', color: 'bg-red-500', text: 'text-red-600', width: '25%' };
    if (criteriaCount === 3) return { label: 'Cukup', color: 'bg-amber-500', text: 'text-amber-600', width: '55%' };
    if (criteriaCount === 4) return { label: 'Kuat', color: 'bg-blue-500', text: 'text-blue-600', width: '80%' };
    return { label: 'Sangat Kuat (Aman)', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
  };

  const strength = getStrengthMeta();

  // Validasi format nomor HP (08xxxxxxxxxx)
  const isHpValid = /^08[0-9]{8,11}$/.test(nomorHp.trim().replace(/[^0-9]/g, ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Kata sandi harus memenuhi seluruh kriteria keamanan (huruf besar, huruf kecil, angka, dan simbol).');
      return;
    }

    if (!passwordsMatch) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!isHpValid) {
      setError('Nomor HP tidak valid. Gunakan awalan 08 dengan panjang 10-13 digit.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('nama_lengkap', namaLengkap);
    formData.append('email', email);
    formData.append('nomor_hp', nomorHp);
    formData.append('password', password);
    if (redirectParam) formData.append('redirect', redirectParam);

    try {
      const res = await registerAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success && res.redirectTo) {
        window.location.replace(res.redirectTo);
      }
    } catch {
      setError('Terjadi kendala saat mendaftarkan akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-5xl w-full bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-3 sm:p-4 gap-4 lg:gap-8">
        
        {/* =====================================================================
            KOLOM KIRI: Visual & Headline Inspiratif Vokasi Pijar Aksara
           ===================================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#843bab] via-[#702996] to-[#4c1669] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
          {/* Efek Lingkaran Cahaya Dekoratif */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#ffdf0f]/15 blur-2xl pointer-events-none" />

          {/* Header Kartu Kiri: Logo & Lembaga */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md p-2 flex items-center justify-center border border-white/30 shadow-sm">
              <Image
                src="/logo-pijar-aksara.png"
                alt="Logo Pijar Aksara"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white">
                Pijar Aksara
              </div>
              <div className="text-[10px] font-extrabold text-[#ffdf0f] uppercase tracking-wider">
                Lembaga Kursus Vokasi
              </div>
            </div>
          </div>

          {/* Konten Teks Inspiratif */}
          <div className="relative z-10 my-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold text-[#ffdf0f] border border-white/20 mb-3">
              <Sparkles size={12} />
              <span>Pendaftaran Peserta Didik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Mulai Perjalanan Belajarmu Hari Ini.
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-3 leading-relaxed">
              Daftarkan dirimu untuk mengakses kurikulum kursus vokasi berkualitas, video pembelajaran terstruktur, kuis kompetensi, dan sertifikat resmi berstandar industri.
            </p>
          </div>

          {/* Ilustrasi Siswa 3D Modern */}
          <div className="relative z-10 mt-2 flex justify-center items-end">
            <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-white/25 bg-purple-900/40">
              <Image
                src="/auth-students.jpg"
                alt="Siswa Vokasi Pijar Aksara"
                fill
                className="object-cover object-top hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
          </div>
        </div>

        {/* =====================================================================
            KOLOM KANAN: Formulir Pendaftaran Akun
           ===================================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-center px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          {/* Header Form */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center font-black text-xs">
                PA
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                LMS Pijar Aksara
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Daftar Akun Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lengkapi formulir di bawah ini untuk memulai akses belajar kursus vokasi Anda.
            </p>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Register */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap (Sesuai Sertifikat)
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all"
                />
              </div>
            </div>

            {/* 2. Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email Aktif
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all"
                />
              </div>
            </div>

            {/* 3. Nomor HP / WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nomor HP / WhatsApp
                </label>
                {nomorHp && (
                  <span className={`text-[11px] font-semibold ${isHpValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isHpValid ? 'Format valid' : 'Format: 08xxxxxxxxxx'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={nomorHp}
                  onChange={(e) => setNomorHp(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all"
                />
              </div>
            </div>

            {/* 4. Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi Kuat
                </label>
                {password && (
                  <span className={`text-[11px] font-bold ${strength.text}`}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Kombinasi huruf, angka & simbol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Progress Bar Kekuatan Kata Sandi */}
              {password.length > 0 && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
              )}

              {/* Checklist Kriteria Keamanan Sandi */}
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  Kriteria Kata Sandi:
                </div>
                
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check size={13} className="text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />}
                  <span>Minimal 8 karakter</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {hasUppercase ? <Check size={13} className="text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />}
                  <span>Huruf besar (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {hasLowercase ? <Check size={13} className="text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />}
                  <span>Huruf kecil (a-z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {hasNumber ? <Check size={13} className="text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />}
                  <span>Angka (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {hasSymbol ? <Check size={13} className="text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />}
                  <span>Karakter simbol / tanda khusus (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            {/* 5. Konfirmasi Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ulangi Kata Sandi
                </label>
                {konfirmasiPassword && (
                  <span className={`text-[11px] font-bold ${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                    {passwordsMatch ? 'Cocok' : 'Belum cocok'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showKonfirmasi ? 'text' : 'password'}
                  required
                  placeholder="Ketik ulang kata sandi di atas"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-12 py-3 rounded-2xl text-sm bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all font-mono ${
                    konfirmasiPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#843bab] focus:ring-[#843bab]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                  title={showKonfirmasi ? 'Sembunyikan' : 'Tampilkan'}
                  tabIndex={-1}
                >
                  {showKonfirmasi ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordStrong || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#843bab] to-[#973ec4] hover:from-[#722f96] hover:to-[#843bab] shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </span>
              ) : (
                <>
                  <span>Buat Akun Peserta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Info Peran Otomatis */}
          <div className="mt-5 p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-2 text-xs text-[#843bab] font-semibold">
            <ShieldCheck size={16} className="shrink-0 text-[#843bab]" />
            <span>Akun pendaftaran baru otomatis aktif sebagai Peserta Kursus.</span>
          </div>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-xs font-medium text-slate-600">
            Sudah memiliki akun?{' '}
            <Link
              href={redirectParam ? `/login?redirect=${redirectParam}` : '/login'}
              className="text-[#843bab] font-bold hover:underline"
            >
              Masuk di Sini
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
