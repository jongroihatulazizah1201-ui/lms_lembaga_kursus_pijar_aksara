import React from 'react';
import { Award, Loader2 } from 'lucide-react';

export default function KursusSayaLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header Skeleton */}
        <div className="pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
              <Award size={13} />
              <span>Portal Peserta</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Loader2 size={12} className="animate-spin text-amber-600" />
              <span>Memuat Kursus Anda...</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kursus Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menyiapkan daftar pelatihan dan progres belajar...
          </p>
        </div>

        {/* Course Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-200/70 rounded-full animate-pulse" />
                  <div className="h-5 w-16 bg-purple-100 rounded-full animate-pulse" />
                </div>
                <div className="h-6 w-4/5 bg-slate-200/80 rounded-md animate-pulse" />
                <div className="h-4 w-3/5 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="h-2 w-full bg-slate-100 rounded-full animate-pulse" />
                <div className="h-9 w-full bg-slate-200/70 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
