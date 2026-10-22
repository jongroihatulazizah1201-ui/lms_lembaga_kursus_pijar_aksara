'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CekSertifikatPage() {
  const router = useRouter();
  const [certInput, setCertInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = certInput.trim();
    if (!trimmed) {
      setErrorMsg('Masukkan nomor atau kode sertifikat resmi.');
      return;
    }
    router.push(`/sertifikat/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 bg-slate-50/60">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#843bab]/10 text-[#843bab] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verifikasi Keaslian Sertifikat
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Periksa keaslian dan integritas data sertifikat kelulusan vokasi yang diterbitkan resmi oleh Lembaga Kursus Pijar Aksara.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-5">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nomor Sertifikat / Kode Unik (UUID):
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: CERT-2026-XXXX atau UUID Sertifikat"
                  value={certInput}
                  onChange={(e) => {
                    setCertInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all font-mono"
                />
              </div>
              {errorMsg && (
                <p className="text-xs text-red-600 pt-1">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 shadow-sm transition-colors min-h-[48px] cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Cek & Verifikasi Sertifikat</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Peserta yang telah lulus dapat melihat daftar sertifikat di menu{' '}
            <Link href="/kursus-saya" className="text-[#843bab] font-semibold hover:underline">
              Kursus Saya
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
