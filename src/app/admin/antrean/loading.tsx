import React from 'react';
import Skeleton from '@/components/Skeleton';
import { Clock } from 'lucide-react';

export default function AdminAntreanLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-[57px] lg:top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 space-y-3.5">
          {/* Row 1: Title & Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-56 sm:w-64 rounded-xl" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </div>
          </div>

          {/* Row 2: Search & Filter Toolbar */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
              <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
              <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
              <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
            </div>
          </div>
        </div>
      </header>

      {/* Queue Cards List Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Info Pendaftaran */}
              <div className="space-y-3 flex-1">
                {/* Status & Deadline Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <span className="text-slate-300">•</span>
                  <Skeleton className="h-4 w-44 rounded-md" />
                </div>

                {/* Course Title */}
                <Skeleton className="h-6 w-4/5 sm:w-2/3 rounded-lg" />

                {/* Participant Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>

                {/* Amount & Method Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-6 w-28 rounded-md" />
                  <Skeleton className="h-6 w-36 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
              </div>

              {/* Right: Tombol Aksi */}
              <div className="flex items-center gap-2 self-end lg:self-center pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto justify-end">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
