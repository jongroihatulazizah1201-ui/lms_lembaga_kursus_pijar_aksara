'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';
import { 
  BookOpen, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User, 
  GraduationCap, 
  Shield 
} from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(errorParam === 'inactive' ? 'Akun Anda dinonaktifkan. Hubungi admin.' : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (redirectParam) formData.append('redirect', redirectParam);

    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success && res.redirectTo) {
        window.location.href = res.redirectTo;
      }
    } catch {
      setError('Terjadi kendala saat masuk akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string = 'Latihan#2026') => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
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
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#843bab] focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
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
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Switcher (Bebas Emoji, Menggunakan Simbol Profesional) */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2.5 text-center">
              Pilih Cepat Akun Uji Coba (Sandi: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Latihan#2026</code>):
            </div>

            {/* Opsi Cepat Peserta */}
            <div className="mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pilih Akun Peserta:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('siti.aminah@pijaraksara.test')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#843bab] border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                  title="Masuk sebagai Siti Aminah (Peserta)"
                >
                  <User size={12} className="text-[#843bab] shrink-0" />
                  <span className="truncate">Siti Aminah</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('bagus.santoso@pijaraksara.test')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#843bab] border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                  title="Masuk sebagai Bagus Santoso (Peserta)"
                >
                  <User size={12} className="text-[#843bab] shrink-0" />
                  <span className="truncate">Bagus S.</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('nadia.putri@pijaraksara.test')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#843bab] border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                  title="Masuk sebagai Nadia Putri (Peserta)"
                >
                  <User size={12} className="text-[#843bab] shrink-0" />
                  <span className="truncate">Nadia Putri</span>
                </button>
              </div>
            </div>

            {/* Opsi Instruktur & Admin */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pilih Staf & Pengajar:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('yudha@pijaraksara.test')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#843bab] border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                  title="Masuk sebagai Yudha Pratama (Instruktur)"
                >
                  <GraduationCap size={13} className="text-[#843bab] shrink-0" />
                  <span className="truncate">Instruktur (Yudha)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('ratna@pijaraksara.test')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#843bab] border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                  title="Masuk sebagai Ratna Kusumawati (Admin)"
                >
                  <Shield size={13} className="text-[#843bab] shrink-0" />
                  <span className="truncate">Admin (Ratna)</span>
                </button>
              </div>
            </div>
          </div>
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
