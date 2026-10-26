import React from 'react';
import Skeleton from '@/components/Skeleton';
import { ShieldCheck, Compass } from 'lucide-react';

export default function DashboardSiswaLoading() {
  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 text-slate-900 animate-fadeIn">
      {/* Sticky Tabs Skeleton at the Top */}
      <div className="sticky top-[57px] lg:top-0 z-30 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5 sm:py-3 overflow-hidden">
            <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-40 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-44 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          </div>
        </div>
      </div>

      {/* Hero Header Skeleton */}
      <div className="bg-white border-b border-slate-200/80 pt-6 sm:pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 text-[#843bab] text-xs font-bold border border-purple-200">
              <ShieldCheck size={14} />
              <span>Memuat Dashboard Siswa...</span>
            </div>
            <Skeleton className="h-9 w-3/4 max-w-lg rounded-xl" />
            <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
          </div>

          {/* Scale Progress Meter Skeleton */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-2xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-48 rounded-lg" />
                  <Skeleton className="h-3.5 w-64 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-3.5 w-full rounded-full" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
