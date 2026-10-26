import React from 'react';
import Skeleton from '@/components/Skeleton';
import { Search } from 'lucide-react';

export default function KatalogLoading() {
  return (
    <div className="bg-white min-h-screen text-slate-900 animate-fadeIn">
      {/* Sticky Search & Fast Filter Bar Placeholder */}
      <section className="sticky top-[64px] lg:top-0 z-20 bg-white/95 backdrop-blur-md pt-4 pb-3.5 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 space-y-3">
          {/* Search Input Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full sm:w-32 rounded-xl" />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-32 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-36 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
          </div>
        </div>
      </section>

      {/* Content Body */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-14 space-y-6">
        {/* Header Title */}
        <header className="space-y-2 max-w-2xl">
          <Skeleton className="h-8 w-80 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </header>

        {/* Counter Summary */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 h-[440px]"
            >
              {/* Thumbnail Placeholder */}
              <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl" />

                {/* Badge Category & Level */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-14 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
