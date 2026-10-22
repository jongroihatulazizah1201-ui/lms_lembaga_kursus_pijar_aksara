'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
} from 'lucide-react';

interface Props {
  redirectParam?: string;
  errorParam?: string;
}

export default function LoginForm({ redirectParam = '', errorParam = '' }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(errorParam === 'inactive' ? 'Akun Anda dinonaktifkan. Hubungi admin.' : '');
  const [loading, setLoading] = useState(false);

  // Prefetch rute tujuan saat form login dibuka agar aset halaman sudah siap
  useEffect(() => {
    router.prefetch('/kursus-saya');
    router.prefetch('/instruktur');
    router.prefetch('/admin/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('password', password);
    if (redirectParam) formData.append('redirect', redirectParam);

    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success && res.redirectTo) {
        // Alihkan seketika langsung menuju halaman pengguna tanpa jeda
        window.location.replace(res.redirectTo);
      }
    } catch {
      setError('Terjadi kendala saat masuk akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-5xl w-full bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-3 sm:p-4 gap-4 lg:gap-8">
        
        {/* =====================================================================
            KOLOM KIRI: Visual Vektor & Headline Vokasi Pijar Aksara
           ===================================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#843bab] via-[#702996] to-[#4c1669] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
          {/* Header Kartu Kiri: Logo Pijar Aksara (Putih Jelas) & Lembaga */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 p-2 flex items-center justify-center border border-white/20 shadow-sm">
              <Image
                src="/logo-pijar-aksara.png"
                alt="Logo Pijar Aksara"
                width={36}
                height={36}
                className="object-contain brightness-0 invert"
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

          {/* Konten Teks Bersih (Tanpa Stiker / Pop-up Blur) */}
          <div className="relative z-10 my-6">
            <div className="text-xs font-black text-[#ffdf0f] uppercase tracking-widest mb-2.5">
              Portal Pembelajaran Online
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Tingkatkan Keahlian Vokasi untuk Masa Depan Gemilang.
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-3 leading-relaxed">
              Pelajari materi terstruktur, video tutorial, evaluasi kuis otomatis, dan raih sertifikat kompetensi resmi berstandar industri.
            </p>
          </div>

          {/* Ilustrasi Vektor Belajar Asli (Bukan AI 3D) */}
          <div className="relative z-10 mt-2 flex justify-center items-center">
            <div className="w-full max-w-[340px] bg-white/95 rounded-2xl p-4 sm:p-5 shadow-xl border border-white/40 flex items-center justify-center hover:scale-[1.02] transition-transform duration-300">
              <Image
                src="/auth-illustration.svg"
                alt="Ilustrasi Pembelajaran Vokasi Pijar Aksara"
                width={320}
                height={230}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* =====================================================================
            KOLOM KANAN: Formulir Masuk Akun
           ===================================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-center px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          {/* Header Form dengan Logo Pijar Aksara Asli */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/logo-pijar-aksara.png"
                alt="Logo Pijar Aksara"
                width={30}
                height={30}
                className="object-contain"
              />
              <span className="text-xs font-extrabold text-slate-800 tracking-wider">
                LMS Pijar Aksara
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Silakan masukkan alamat email dan kata sandi akun Anda untuk melanjutkan.
            </p>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alamat Email
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
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#843bab] to-[#973ec4] hover:from-[#722f96] hover:to-[#843bab] shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Masuk ke Akun...</span>
                </span>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 text-center text-xs font-medium text-slate-600">
            Belum memiliki akun?{' '}
            <Link
              href={redirectParam ? `/register?redirect=${redirectParam}` : '/register'}
              className="text-[#843bab] font-bold hover:underline"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
