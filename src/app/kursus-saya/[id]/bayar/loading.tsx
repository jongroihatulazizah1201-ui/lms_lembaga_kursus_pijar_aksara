import React from 'react';
import Skeleton from '@/components/Skeleton';
import { ArrowLeft, CreditCard } from 'lucide-react';

export default function BayarLoading() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 text-slate-900 animate-fadeIn">
      {/* Top Header Skeleton */}
      <div className="bg-white border-b border-slate-200/80 pt-6 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl border border-slate-200 text-slate-400">
              <ArrowLeft size={16} />
            </div>
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-8 w-80 rounded-xl" />
            <Skeleton className="h-5 w-96 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Countdown & Amount Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-44 rounded-2xl" />
          </div>
        </div>

        {/* Method 1: Mayar Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>

          <Skeleton className="h-12 w-full sm:w-72 rounded-2xl" />
        </div>

        {/* Method 2: Transfer Bank Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>

          {/* Form Upload */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
