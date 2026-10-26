import React from 'react';
import Skeleton from '@/components/Skeleton';
import { Award, BookOpen } from 'lucide-react';

export default function KursusSayaLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-slate-900 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Skeleton */}
        <div className="pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#843bab] border border-purple-200">
              <Award size={13} />
              <span>Portal Peserta</span>
            </span>
            <div className="w-2 h-2 rounded-full bg-slate-300 animate-ping" />
            <span className="text-xs text-slate-400 font-medium">Memuat data kursus...</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kursus Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menyiapkan daftar pelatihan, status reservasi, dan progres belajar Anda...
          </p>
        </div>

        {/* Toolbar & Filter Tabs Skeleton */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          </div>
        </div>

        {/* Course Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-[320px] space-y-4"
            >
              <div className="space-y-3.5">
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                {/* Course Title */}
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-6 w-5/6 rounded-lg" />
                  <Skeleton className="h-6 w-3/5 rounded-lg" />
                </div>

                {/* Instructor & Meta */}
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-36 rounded-md" />
                </div>
              </div>

              {/* Progress & Action Bottom */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-10 rounded-md" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
