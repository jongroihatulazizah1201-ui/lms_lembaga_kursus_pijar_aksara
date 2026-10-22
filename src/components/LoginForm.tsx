'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/app/auth/actions';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface Props {
  redirectParam?: string;
  errorParam?: string;
}

export default function LoginForm({ redirectParam = '', errorParam = '' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(errorParam === 'inactive' ? 'Akun Anda dinonaktifkan. Hubungi admin.' : '');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsSuccess(true);
        // Langsung alihkan tanpa meninggalkan jejak halaman login di riwayat
        window.location.replace(res.redirectTo);
      }
    } catch {
      setError('Terjadi kendala saat masuk akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 bg-slate-50/70">
      <div className="w-full max-w-md">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/logo-pijar-aksara.png"
              alt="Logo Pijar Aksara"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-xs font-semibold text-[#843bab] uppercase tracking-wider mt-1">
            Lembaga Kursus Pijar Aksara
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 mb-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Autentikasi Berhasil
              </h2>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#843bab]" />
                <span>Membuka ruang belajar sesuai akun Anda...</span>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Password Field with Hidden Eye Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memproses...</span>
                    </span>
                  ) : (
                    <>
                      <span>Masuk Sekarang</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Register Link */}
        <div className="text-center text-xs font-medium text-slate-600">
          Belum punya akun?{' '}
          <Link
            href={redirectParam ? `/register?redirect=${redirectParam}` : '/register'}
            className="text-[#843bab] font-bold hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
