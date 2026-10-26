import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Komponen Skeleton terstandarisasi untuk placeholder loading beranimasi pulse.
 * Mengikuti tone warna neutral slate Pijar Aksara (slate-200/70) yang halus dan bebas layout-shift.
 */
export default function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200/70 rounded-xl animate-pulse ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
