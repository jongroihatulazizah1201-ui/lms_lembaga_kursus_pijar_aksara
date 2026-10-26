import React from 'react';
import Skeleton from '@/components/Skeleton';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function KuisLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-20 animate-fadeIn">
      {/* Top Header Skeleton */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border border-slate-200 text-slate-400">
              <ArrowLeft size={16} />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-44 sm:w-56 rounded-md" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Quiz Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Progress & Rules Alert Box */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 max-w-md">
            <div className="flex justify-between text-xs">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>

          {/* Question Text */}
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
          </div>

          {/* 4 Answer Options */}
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((opt) => (
              <div
                key={opt}
                className="p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5"
              >
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            ))}
          </div>

          {/* Bottom Action Navigation */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Skeleton key={n} className="w-9 h-9 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
