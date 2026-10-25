'use client';

import React, { useMemo } from 'react';

export interface DynamicWatermarkProps {
  name: string;
  email: string;
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * DynamicWatermark
 *
 * Komponen penanda air dinamis untuk ruang belajar (/belajar/[slug]).
 * Menampilkan overlay samar berisi nama lengkap dan email peserta di atas
 * area materi pelatihan dan pemutar video.
 *
 * Karakteristik Teknis:
 * - pointer-events: none (transparan total terhadap klik, seleksi teks, kontrol video)
 * - Opacity rendah (sekitar 8-12%): 0.09 untuk light mode, 0.11 untuk dark mode (video)
 * - Diagonal dan berulang (repeating tiled SVG background pattern)
 * - Zero Layout Shift (CLS = 0) dan terakselerasi GPU
 * - Sumber identitas server-side murni (sesi pengguna terautentikasi)
 */
export default function DynamicWatermark({
  name,
  email,
  variant = 'light',
  className = '',
}: DynamicWatermarkProps) {
  const watermarkBgUrl = useMemo(() => {
    const escapeXml = (str: string) => {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const cleanName = escapeXml(name.trim() || 'Peserta');
    const cleanEmail = escapeXml(email.trim());

    // Opacity berada di rentang 8% - 12% (0.09 untuk latar terang, 0.11 untuk pemutar video gelap)
    const fillColor = variant === 'dark' ? 'rgba(255,255,255,0.11)' : 'rgba(30,41,59,0.09)';

    // Pola SVG berulang berukuran 280px x 140px, diputar miring diagonal -22 derajat
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="140" viewBox="0 0 280 140">
  <text x="140" y="70" text-anchor="middle" dominant-baseline="middle" transform="rotate(-22 140 70)" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="${fillColor}">
    <tspan x="140" dy="-7">${cleanName}</tspan>
    <tspan x="140" dy="16">${cleanEmail}</tspan>
  </text>
</svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [name, email, variant]);

  return (
    <div
      aria-hidden="true"
      data-testid="dynamic-watermark"
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-10 ${className}`}
      style={{
        backgroundImage: watermarkBgUrl,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
