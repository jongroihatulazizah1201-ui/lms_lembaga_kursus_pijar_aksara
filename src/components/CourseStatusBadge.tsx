import React from 'react';
import { FileEdit, Clock, CheckCircle2, Lock } from 'lucide-react';

export type CourseStatus = 'draf' | 'ditinjau' | 'terbit' | 'ditutup';

interface CourseStatusBadgeProps {
  status: CourseStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function CourseStatusBadge({
  status,
  size = 'md',
  showDescription = false,
}: CourseStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'draf':
        return {
          label: 'Draf',
          icon: FileEdit,
          bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
          desc: 'Sedang disunting oleh instruktur pemilik. Belum dapat diakses publik.',
        };
      case 'ditinjau':
        return {
          label: 'Menunggu Tinjauan',
          icon: Clock,
          bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500 animate-pulse',
          desc: 'Diajukan instruktur, konten terkunci, menunggu verifikasi admin lembaga.',
        };
      case 'terbit':
        return {
          label: 'Terbit di Katalog',
          icon: CheckCircle2,
          bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500',
          desc: 'Aktif di katalog publik. Peserta dapat mendaftar dan mengikuti kursus.',
        };
      case 'ditutup':
        return {
          label: 'Ditutup',
          icon: Lock,
          bgClass: 'bg-red-50 text-red-800 border-red-200',
          dotClass: 'bg-red-600',
          desc: 'Pendaftaran baru ditutup. Peserta aktif tetap dapat belajar hingga selesai.',
        };
      default:
        return {
          label: status,
          icon: FileEdit,
          bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
          desc: 'Status kursus tidak diketahui.',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center rounded-full border shadow-sm ${config.bgClass} ${sizeStyles[size]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        <Icon size={iconSizes[size]} className="shrink-0" />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-500 mt-1 pl-1">
          {config.desc}
        </span>
      )}
    </div>
  );
}
