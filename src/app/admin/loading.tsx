import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
                <Shield size={13} />
                <span>Panel Pengelola</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Loader2 size={12} className="animate-spin text-amber-600" />
                <span>Memuat Data...</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Panel Pengelola Lembaga
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Memuat data kursus, pendaftaran, dan pengguna...
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 bg-slate-200/70 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Content Table Skeleton */}
        <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="h-6 w-40 bg-slate-200/70 rounded-md animate-pulse" />
            <div className="h-9 w-64 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
