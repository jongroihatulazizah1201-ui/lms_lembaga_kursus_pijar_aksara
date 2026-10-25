'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackUrl = '/kursus',
  label = 'Kembali',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0 ${className}`}
      title="Kembali ke halaman sebelumnya"
      aria-label="Kembali ke halaman sebelumnya"
    >
      <ArrowLeft
        size={16}
        className="text-slate-500 group-hover:text-slate-900 group-hover:-translate-x-0.5 transition-transform"
      />
      <span>{label}</span>
    </button>
  );
}
