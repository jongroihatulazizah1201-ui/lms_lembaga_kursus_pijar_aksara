import React from 'react';
import Skeleton from '@/components/Skeleton';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
                <ShieldCheck size={13} />
                <span>Panel Admin</span>
              </span>
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-ping" />
              <span className="text-xs text-slate-400 font-medium">Sinkronisasi data sistem...</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manajemen Lembaga Kursus
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Memuat data kursus vokasi, pendaftaran, pengguna, dan audit aktivitas...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* 4 Metric Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="w-9 h-9 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Skeleton className="h-3.5 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80">
          <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-48 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        </div>

        {/* Table Content Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/70 border-b border-slate-200 text-xs">
            <div className="col-span-5"><Skeleton className="h-4 w-32 rounded-md" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-20 rounded-md" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-16 rounded-md" /></div>
            <div className="col-span-3 text-right"><Skeleton className="h-4 w-20 rounded-md ml-auto" /></div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-5 space-y-1.5">
                  <Skeleton className="h-5 w-4/5 rounded-md" />
                  <Skeleton className="h-3.5 w-1/2 rounded-md" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-20 rounded-xl" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
