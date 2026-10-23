import React from 'react';
import { LayoutDashboard, Loader2 } from 'lucide-react';

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header Dashboard Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
                <LayoutDashboard size={13} />
                <span>Panel Administrator</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Loader2 size={12} className="animate-spin text-amber-600" />
                <span>Menyiapkan Metrik...</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Statistik &amp; Laporan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Memuat analitik performa lembaga kursus secara langsung...
            </p>
          </div>

          {/* Action skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-44 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-slate-200/70 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* 4 Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-32 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200/70 rounded-md animate-pulse" />
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-purple-200 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="h-7 w-24 bg-slate-200/80 rounded-md animate-pulse mb-1.5" />
                <div className="h-3 w-36 bg-slate-100 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* 2 Main Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-80"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-5 w-44 bg-slate-200/70 rounded-md animate-pulse mb-1" />
                  <div className="h-3 w-32 bg-slate-100 rounded-md animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 w-full bg-slate-50/80 rounded-xl flex items-end justify-between p-4 gap-2">
                {[40, 65, 30, 80, 55, 90, 70, 85].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-purple-100/70 rounded-t-md animate-pulse"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="h-5 w-48 bg-slate-200/70 rounded-md animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
