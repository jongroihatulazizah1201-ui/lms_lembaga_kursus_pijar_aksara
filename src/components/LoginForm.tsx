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
        window.location.replace(res.redirectTo);
      }
    } catch {
      setError('Terjadi kendala saat masuk akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-50/70">
      <div className="max-w-4xl lg:max-w-[960px] w-full bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-3 sm:p-3.5 gap-4 lg:gap-6 my-auto">
        
        {/* =====================================================================
            KOLOM KIRI: Visual Card Proporsional (Sesuai Konsep Contoh)
           ===================================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#843bab] via-[#702996] to-[#4c1669] rounded-[26px] p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden shadow-inner min-h-[460px] lg:min-h-[520px]">
          
          {/* Header Lembaga Ringkas */}
          <div className="relative z-10 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white/15 p-1.5 flex items-center justify-center border border-white/20 shadow-sm shrink-0">
              <Image
                src="/logo-pijar-aksara.png"
                alt="Logo Pijar Aksara"
                width={22}
                height={22}
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <div className="text-xs font-black tracking-wide text-white">
              Pijar Aksara <span className="text-purple-300 font-normal">|</span> <span className="text-[#ffdf0f] font-extrabold text-[10px] uppercase">Lembaga Vokasi</span>
            </div>
          </div>

          {/* Konten Judul Besar & Mantap (Posisi Pas, Tidak Keatasan) */}
          <div className="relative z-10 my-auto py-1">
            <h2 className="text-2xl sm:text-3xl lg:text-[31px] font-black text-white tracking-tight leading-[1.2]">
              Tingkatkan Keahlian <span className="text-[#ffdf0f]">Anda</span> untuk Masa Depan Gemilang.
            </h2>
            <p className="text-xs sm:text-[13px] text-purple-100/90 mt-2.5 leading-relaxed">
              Pelajari materi terstruktur, video tutorial, kuis kompetensi, dan raih sertifikat resmi berstandar industri.
            </p>
          </div>

          {/* Ilustrasi Karakter 3D Pas & Berbayangan Nyata */}
          <div className="relative z-10 mt-auto pt-3 flex flex-col items-center justify-end w-full">
            <div className="relative w-full max-w-[280px] sm:max-w-[300px] h-[260px] sm:h-[285px] lg:h-[300px] flex items-end justify-center">
              {/* Lapisan Bayangan Lantai Kontak (Ground Contact Shadow) */}
              <div className="absolute bottom-1 w-4/5 max-w-[240px] h-4 bg-black/45 rounded-full blur-md pointer-events-none" />
              <div className="absolute bottom-1.5 w-3/5 max-w-[170px] h-2 bg-black/60 rounded-full blur-xs pointer-events-none" />
              
              <Image
                src="/login-character.png"
                alt="Karakter Pembelajaran Pijar Aksara"
                fill
                className="object-contain object-bottom hover:scale-[1.03] transition-transform duration-300 drop-shadow-[0_16px_24px_rgba(0,0,0,0.45)]"
                priority
              />
            </div>
          </div>
        </div>

        {/* =====================================================================
            KOLOM KANAN: Formulir Masuk Akun
           ===================================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-center px-4 sm:px-8 lg:px-9 py-5 sm:py-6">
          {/* Header Form dengan Logo Pijar Aksara Asli */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Image
                src="/logo-pijar-aksara.png"
                alt="Logo Pijar Aksara"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-xs font-black text-slate-800 tracking-wider">
                LMS Pijar Aksara
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Silakan masukkan alamat email dan kata sandi akun Anda.
            </p>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-4 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
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
                  className="w-full pl-11 pr-12 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white focus:ring-2 focus:ring-[#843bab]/20 transition-all font-mono"
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
          <div className="mt-6 text-center text-xs font-medium text-slate-600">
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
