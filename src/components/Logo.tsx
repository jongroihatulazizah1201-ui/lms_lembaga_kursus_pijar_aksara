import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({
  size = 'md',
  showText = true,
  href = '/',
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: {
      dimension: 40,
      imgClass: 'w-10 h-10',
      titleClass: 'text-base',
      subClass: 'text-[10px]',
    },
    md: {
      dimension: 50,
      imgClass: 'w-12 h-12',
      titleClass: 'text-xl',
      subClass: 'text-[11px]',
    },
    lg: {
      dimension: 64,
      imgClass: 'w-16 h-16',
      titleClass: 'text-2xl',
      subClass: 'text-xs',
    },
  };

  const current = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${current.imgClass}`}>
        <Image
          src="/logo-pijar-aksara.png"
          alt="Logo Pijar Aksara"
          width={current.dimension}
          height={current.dimension}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-slate-900 leading-none ${current.titleClass}`}>
            Pijar Aksara
          </span>
          <span className={`font-bold text-[#843bab] uppercase tracking-wider mt-1 ${current.subClass}`}>
            Lembaga Kursus & Pelatihan
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
