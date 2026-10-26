import React from 'react';
import Skeleton from '@/components/Skeleton';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function RuangBelajarLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-20 animate-fadeIn">
      {/* Top Bar Skeleton */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border border-slate-200 text-slate-400">
              <ArrowLeft size={16} />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 sm:w-64 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Video Player & Reading Area */}
          <section className="col-span-12 lg:col-span-8 space-y-6">
            {/* Aspect Video Player Placeholder */}
            <div className="aspect-video w-full rounded-3xl bg-slate-900/10 border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden">
              <Skeleton className="w-full h-full rounded-3xl" />
            </div>

            {/* Module Details & Reading Area */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-32 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>

              <Skeleton className="h-8 w-4/5 rounded-xl" />

              <div className="space-y-2.5 pt-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>

              {/* Bottom Nav Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <Skeleton className="h-11 w-36 rounded-xl" />
                <Skeleton className="h-11 w-44 rounded-xl" />
              </div>
            </div>
          </section>

          {/* Right Column (4 cols): Curriculum Sidebar */}
          <aside className="col-span-12 lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="p-3.5 rounded-2xl border border-slate-200/70 flex items-center gap-3"
                  >
                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-4/5 rounded-md" />
                      <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
