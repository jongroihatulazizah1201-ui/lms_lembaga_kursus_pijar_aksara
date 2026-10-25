'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Search, AlertCircle, Award, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CertificateVerificationResult {
  valid: boolean;
  nomor_sertifikat: string;
  nama_peserta: string;
  judul_kursus: string;
  diterbitkan_pada: string;
}

export default function CertificateVerificationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialNomor = searchParams.get('nomor') || '';

  const [nomorInput, setNomorInput] = useState(initialNomor.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  const supabase = createClient();

  const handleVerify = useCallback(async (searchNomor: string) => {
    const trimmed = searchNomor.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Silakan masukkan nomor sertifikat yang ingin diverifikasi.');
      setResult(null);
      return;
    }

    // Validasi format baku PA-TAHUN-NOMOR (contoh: PA-2026-0001)
    const formatRegex = /^PA-\d{4}-\d{4}$/;
    if (!formatRegex.test(trimmed)) {
      setErrorMessage('Format nomor sertifikat tidak valid. Gunakan format baku PA-TAHUN-NOMOR (contoh: PA-2026-0001).');
      setResult(null);
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    setHasSearched(true);

    try {
      // Panggil RPC publik verify_certificate_status (aman untuk anon & authenticated)
      const { data, error } = await supabase.rpc('verify_certificate_status', {
        p_identifier: trimmed,
      });

      if (error) {
        console.error('Error verifying certificate:', error);
        setResult(null);
      } else if (data && data.length > 0) {
        setResult(data[0]);
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error('Unexpected verification error:', err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Otomatis verifikasi jika ada parameter ?nomor= di URL (misal dari pemindaian QR code)
  useEffect(() => {
    if (initialNomor) {
      setNomorInput(initialNomor.toUpperCase());
      handleVerify(initialNomor);
    }
  }, [initialNomor, handleVerify]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nomorInput.trim().toUpperCase();
    if (trimmed) {
      router.replace(`/sertifikat/cek?nomor=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
    handleVerify(nomorInput);
  };

  const formattedDate = result?.diterbitkan_pada
    ? new Date(result.diterbitkan_pada).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-[#843bab] text-xs sm:text-sm font-bold border border-purple-200/60 shadow-2xs">
            <ShieldCheck size={18} />
            <span>Verifikasi Keaslian Sertifikat</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Periksa Keabsahan Sertifikat
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
            Masukkan nomor sertifikat resmi Lembaga Kursus Pijar Aksara untuk memeriksa keaslian dan status kelulusan peserta.
          </p>
        </div>

        {/* Search Card Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="nomor-sertifikat" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Nomor Sertifikat
              </label>
              <div className="relative">
                <input
                  id="nomor-sertifikat"
                  type="text"
                  value={nomorInput}
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    setNomorInput(upper);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: PA-2026-0001"
                  className="w-full px-4 py-3.5 pl-11 rounded-2xl border border-slate-300 focus:border-[#843bab] focus:ring-4 focus:ring-purple-100 outline-none font-mono text-sm sm:text-base uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans transition-all"
                  maxLength={12}
                  autoComplete="off"
                  spellCheck="false"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {errorMessage && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#843bab] hover:bg-[#722f96] disabled:bg-purple-300 text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="xs" variant="white" />
                  <span>Memeriksa Sertifikat...</span>
                </>
              ) : (
                <>
                  <span>Periksa Sertifikat</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Area */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
            <LoadingSpinner
              size="lg"
              variant="primary"
              label="Mencari Data Sertifikat di Database Resmi..."
              sublabel="Memeriksa keaslian nomor seri pada pangkalan data Pijar Aksara"
              timeoutMs={10000}
              onRetry={() => handleVerify(nomorInput)}
              onCancel={() => setLoading(false)}
            />
          </div>
        )}

        {!loading && hasSearched && result && (
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            {/* Status Top Banner */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Status Dokumen</span>
                  <span className="text-base font-extrabold text-slate-900">Sertifikat Valid &amp; Resmi</span>
                </div>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                {result.nomor_sertifikat}
              </div>
            </div>

            {/* Certificate Details */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Penerima Sertifikat
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {result.nama_peserta}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Program Kursus
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
                  <Award size={20} className="text-[#843bab] shrink-0" />
                  <span>{result.judul_kursus}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Tanggal Diterbitkan
                </span>
                <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Official Guarantee Footer */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Sertifikat ini resmi diterbitkan oleh Lembaga Kursus Pijar Aksara Kota Depok.</span>
            </div>
          </div>
        )}

        {!loading && hasSearched && !result && (
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sertifikat Tidak Ditemukan</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Nomor sertifikat <strong className="font-mono text-slate-800">{nomorInput}</strong> tidak terdaftar dalam pangkalan data resmi Lembaga Kursus Pijar Aksara. Pastikan nomor yang dimasukkan sudah sesuai dengan format baku (contoh: PA-2026-0001).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
