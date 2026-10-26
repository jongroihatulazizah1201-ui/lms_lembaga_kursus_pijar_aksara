import React from 'react';
import Skeleton from '@/components/Skeleton';

export default function CourseDetailLoading() {
  return (
    <div className="bg-slate-50/50 min-h-screen text-slate-900 pb-20 animate-fadeIn">
      {/* Hero Header Skeleton */}
      <section className="bg-white border-b border-slate-200/80 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <span className="text-slate-300">/</span>
            <Skeleton className="h-4 w-20 rounded-md" />
            <span className="text-slate-300">/</span>
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Big Title */}
          <div className="space-y-2 max-w-4xl">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-3/4 rounded-xl" />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5 max-w-3xl pt-1">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
        </div>
      </section>

      {/* Main 2-Column Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Syllabus & Overview */}
          <div className="lg:col-span-8 space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <Skeleton className="h-7 w-48 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </div>

            {/* Syllabus Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-7 w-52 rounded-xl" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((m) => (
                  <div key={m} className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-48 sm:w-64 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Checkout Card */}
          <aside className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-7 space-y-5">
              {/* Price */}
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-9 w-44 rounded-xl" />
              </div>

              {/* Quota Progress */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>

              {/* Action Button */}
              <Skeleton className="h-12 w-full rounded-2xl" />

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                {[1, 2, 3, 4].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-44 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
