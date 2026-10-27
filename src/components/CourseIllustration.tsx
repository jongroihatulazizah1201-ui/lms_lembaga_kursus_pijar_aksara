import React from 'react';
import Image from 'next/image';

interface CourseIllustrationProps {
  slug: string;
  title: string;
  imageUrl?: string | null;
  className?: string;
}

const DEFAULT_PAMPHLET_MAP: Record<string, string> = {
  'excel-administrasi-perkantoran': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/excel-administrasi-perkantoran-v3.png',
  'desain-konten-canva': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/desain-konten-canva-v2.png',
  'bahasa-inggris-percakapan-kerja': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/bahasa-inggris-percakapan-kerja-v2.png',
  'dasar-pembukuan-umkm': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/dasar-pembukuan-umkm-v2.png',
  'public-speaking-presentasi-kantor': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/public-speaking-presentasi-kantor-v2.png',
  'word-surat-dinas': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/word-surat-dinas-v2.png',
  'fotografi-produk-ponsel': 'https://soszunleqyzfubbrwlsz.supabase.co/storage/v1/object/public/kursus_brosur/fotografi-produk-ponsel-v2.png',
};

export default function CourseIllustration({
  slug,
  title,
  imageUrl,
  className = '',
}: CourseIllustrationProps) {
  const photoUrl = imageUrl || DEFAULT_PAMPHLET_MAP[slug];

  if (photoUrl) {
    return (
      <div
        className={`relative w-full aspect-video overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center select-none ${className}`}
      >
        <Image
          src={photoUrl}
          alt={`Media Brosur Kursus: ${title}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 340px, 400px"
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  // Fallback vector illustration jika belum ada pamflet yang diunggah
  return (
    <div
      className={`relative w-full h-40 sm:h-44 overflow-hidden rounded-xl flex items-center justify-center p-3 select-none ${className}`}
    >
      {renderIllustration(slug, title)}
    </div>
  );
}

function renderIllustration(slug: string, title: string) {
  switch (slug) {
    case 'desain-konten-canva':
      return <CanvaDesainIllustration />;
    case 'dasar-pembukuan-umkm':
      return <PembukuanUmkmIllustration />;
    case 'public-speaking-presentasi-kantor':
      return <PublicSpeakingIllustration />;
    case 'bahasa-inggris-percakapan-kerja':
      return <BahasaInggrisIllustration />;
    case 'word-surat-dinas':
      return <WordSuratDinasIllustration />;
    case 'excel-administrasi-perkantoran':
      return <ExcelAdministrasiIllustration />;
    default:
      return <DefaultCourseIllustration title={title} />;
  }
}

/**
 * 1. Desain Konten Media Sosial dengan Canva
 * Palette: Soft purple background (#f5effb), purple #843bab, canva cyan, yellow accent #ffdf0f
 */
function CanvaDesainIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background soft canvas glow */}
      <rect width="360" height="180" rx="12" fill="#F6F1FA" />
      <circle cx="280" cy="40" r="50" fill="#EADAFA" opacity="0.6" />
      <circle cx="80" cy="140" r="45" fill="#FFF2B2" opacity="0.4" />

      {/* Floating mini UI: Palette Swatch Card */}
      <g transform="translate(30, 35)">
        <rect width="52" height="70" rx="8" fill="#FFFFFF" filter="drop-shadow(0px 3px 6px rgba(132, 59, 171, 0.08))" stroke="#E2D4F0" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="8" fill="#843BAB" />
        <circle cx="34" cy="18" r="8" fill="#FFDF0F" />
        <circle cx="18" cy="36" r="8" fill="#06B6D4" />
        <circle cx="34" cy="36" r="8" fill="#F43F5E" />
        <rect x="12" y="52" width="28" height="6" rx="3" fill="#E2D4F0" />
      </g>

      {/* Floating Sparkle / Star */}
      <path d="M48 120 L51 127 L58 130 L51 133 L48 140 L45 133 L38 130 L45 127 Z" fill="#FFDF0F" />
      <path d="M315 35 L317 40 L322 42 L317 44 L315 49 L313 44 L308 42 L313 40 Z" fill="#843BAB" />

      {/* Main Laptop & Social Post Canvas */}
      <g transform="translate(100, 20)">
        {/* Laptop Base Stand */}
        <path d="M-15 132 L175 132 L160 137 L0 137 Z" fill="#CBD5E1" />
        <rect x="55" y="132" width="50" height="3" rx="1.5" fill="#94A3B8" />

        {/* Laptop Screen Body */}
        <rect x="10" y="8" width="140" height="124" rx="8" fill="#1E293B" />
        <rect x="15" y="13" width="130" height="114" rx="5" fill="#FFFFFF" />

        {/* Top App Bar inside Laptop */}
        <rect x="15" y="13" width="130" height="16" fill="#843BAB" rx="5" />
        <rect x="15" y="24" width="130" height="5" fill="#843BAB" />
        <circle cx="23" cy="21" r="2.5" fill="#F43F5E" />
        <circle cx="30" cy="21" r="2.5" fill="#FBBF24" />
        <circle cx="37" cy="21" r="2.5" fill="#10B981" />
        <rect x="50" y="18" width="45" height="6" rx="3" fill="#FFFFFF" opacity="0.3" />

        {/* Canva Workspace Sidebar */}
        <rect x="15" y="29" width="22" height="98" fill="#F1F5F9" />
        <rect x="19" y="35" width="14" height="10" rx="2" fill="#843BAB" opacity="0.3" />
        <rect x="19" y="49" width="14" height="10" rx="2" fill="#06B6D4" opacity="0.3" />
        <rect x="19" y="63" width="14" height="10" rx="2" fill="#FFDF0F" opacity="0.5" />
        <rect x="19" y="77" width="14" height="10" rx="2" fill="#CBD5E1" />

        {/* Social Media Post Design Canvas (Square IG Post) */}
        <g transform="translate(45, 36)">
          <rect width="90" height="84" rx="4" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1" />
          
          {/* Post Content: Bold Graphic Design */}
          <rect x="8" y="8" width="74" height="42" rx="3" fill="url(#canvaPostGrad)" />
          {/* Sun / Shape in post */}
          <circle cx="24" cy="22" r="8" fill="#FFDF0F" />
          <path d="M12 44 L30 28 L48 44 Z" fill="#6B21A8" opacity="0.6" />
          <path d="M38 44 L54 32 L72 44 Z" fill="#843BAB" opacity="0.8" />

          {/* Headline in Post */}
          <rect x="8" y="55" width="50" height="6" rx="2" fill="#1E293B" />
          <rect x="8" y="64" width="35" height="4" rx="2" fill="#94A3B8" />

          {/* Social Icons (Heart & Bookmark) */}
          <path d="M68 66 C68 64 70 63 71.5 64.5 C73 63 75 64 75 66 C75 68 71.5 70 71.5 70 C71.5 70 68 68 68 66 Z" fill="#F43F5E" />
          <rect x="78" y="64" width="4" height="6" fill="#843BAB" rx="1" />
        </g>
      </g>

      {/* Floating Cursor / Pen Tool */}
      <g transform="translate(230, 85)">
        <polygon points="0,0 6,18 10,12 17,16 19,14 12,10 18,7" fill="#843BAB" />
      </g>

      {/* Floating Instagram Heart Badge on Right */}
      <g transform="translate(268, 55)">
        <rect width="60" height="42" rx="8" fill="#FFFFFF" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.06))" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="20" cy="21" r="10" fill="#FEE2E2" />
        <path d="M16 20 C16 18 18 17 20 18.5 C22 17 24 18 24 20 C24 22 20 24.5 20 24.5 C20 24.5 16 22 16 20 Z" fill="#EF4444" />
        <rect x="35" y="15" width="18" height="5" rx="2.5" fill="#0F172A" />
        <rect x="35" y="23" width="12" height="4" rx="2" fill="#94A3B8" />
      </g>

      {/* Floating Filter / Sticker */}
      <g transform="translate(285, 120)">
        <circle cx="15" cy="15" r="14" fill="#FFDF0F" />
        <path d="M15 8 L17 12 L22 13 L18 17 L19 22 L15 19 L11 22 L12 17 L8 13 L13 12 Z" fill="#843BAB" />
      </g>

      <defs>
        <linearGradient id="canvaPostGrad" x1="0" y1="0" x2="74" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="1" stopColor="#843BAB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 2. Dasar Pembukuan untuk UMKM
 * Palette: Soft mint & lavender background (#eef7f3), emerald green #10b981, gold yellow #ffdf0f, slate
 */
function PembukuanUmkmIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background */}
      <rect width="360" height="180" rx="12" fill="#F2F9F5" />
      <circle cx="80" cy="40" r="45" fill="#D1FAE5" opacity="0.6" />
      <circle cx="280" cy="140" r="50" fill="#E0E7FF" opacity="0.5" />

      {/* Floating Calculator on Left */}
      <g transform="translate(30, 40)">
        <rect width="56" height="85" rx="8" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1.5" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.05))" />
        {/* Screen */}
        <rect x="8" y="10" width="40" height="18" rx="4" fill="#0F172A" />
        <text x="42" y="24" fill="#10B981" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">
          Rp 8.5M
        </text>
        {/* Buttons Grid */}
        <rect x="8" y="34" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="19" y="34" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="30" y="34" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="40" y="34" width="8" height="8" rx="2" fill="#843BAB" />

        <rect x="8" y="46" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="19" y="46" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="30" y="46" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="40" y="46" width="8" height="8" rx="2" fill="#10B981" />

        <rect x="8" y="58" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="19" y="58" width="8" height="8" rx="2" fill="#E2E8F0" />
        <rect x="30" y="58" width="8" height="8" rx="2" fill="#FFDF0F" />
        <rect x="40" y="58" width="8" height="18" rx="2" fill="#FFDF0F" />

        <rect x="8" y="70" width="19" height="6" rx="2" fill="#CBD5E1" />
        <rect x="30" y="70" width="8" height="6" rx="2" fill="#E2E8F0" />
      </g>

      {/* Main Financial Report & Profit Chart (Center) */}
      <g transform="translate(105, 18)">
        {/* Financial Sheet / Ledger */}
        <rect width="150" height="135" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.06))" />
        
        {/* Header Ribbon */}
        <rect width="150" height="26" rx="8" fill="#10B981" />
        <rect y="16" width="150" height="10" fill="#10B981" />
        <text x="14" y="17" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          BUKU KAS UMKM
        </text>
        <circle cx="135" cy="13" r="4" fill="#FFFFFF" opacity="0.6" />

        {/* Ledger Table Rows */}
        <g transform="translate(12, 34)">
          {/* Row 1: Kas Masuk */}
          <rect x="0" y="0" width="126" height="18" rx="3" fill="#F0FDF4" />
          <text x="6" y="12" fill="#166534" fontSize="8" fontWeight="bold">Penjualan Produk</text>
          <text x="120" y="12" fill="#16A34A" fontSize="8" fontWeight="bold" textAnchor="end">+Rp 450.000</text>

          {/* Row 2: Kas Keluar */}
          <rect x="0" y="22" width="126" height="18" rx="3" fill="#FEF2F2" />
          <text x="6" y="34" fill="#991B1B" fontSize="8" fontWeight="bold">Biaya Operasional</text>
          <text x="120" y="34" fill="#DC2626" fontSize="8" fontWeight="bold" textAnchor="end">-Rp 120.000</text>

          {/* Row 3: Saldo Akhir */}
          <rect x="0" y="44" width="126" height="18" rx="3" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <text x="6" y="56" fill="#0F172A" fontSize="8" fontWeight="bold">Saldo Bersih</text>
          <text x="120" y="56" fill="#843BAB" fontSize="8" fontWeight="bold" textAnchor="end">Rp 330.000</text>

          {/* Mini Growth Trend Chart */}
          <g transform="translate(0, 68)">
            <rect width="126" height="26" rx="4" fill="#F1F5F9" />
            <path d="M8 20 L35 15 L65 17 L95 8 L118 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="118" cy="4" r="3" fill="#10B981" />
            <text x="8" y="12" fill="#64748B" fontSize="7" fontWeight="bold">Tren Laba</text>
            <text x="118" y="22" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="end">▲ Naik 32%</text>
          </g>
        </g>
      </g>

      {/* Floating Stacks of Gold Coins on Right */}
      <g transform="translate(270, 70)">
        {/* Coin 1 */}
        <ellipse cx="25" cy="55" rx="20" ry="7" fill="#EAB308" />
        <rect x="5" y="48" width="40" height="7" fill="#FACC15" />
        <ellipse cx="25" cy="48" rx="20" ry="7" fill="#FDE047" />

        {/* Coin 2 */}
        <rect x="5" y="38" width="40" height="7" fill="#FACC15" />
        <ellipse cx="25" cy="38" rx="20" ry="7" fill="#FDE047" />

        {/* Coin 3 */}
        <rect x="5" y="28" width="40" height="7" fill="#FACC15" />
        <ellipse cx="25" cy="28" rx="20" ry="7" fill="#FEF08A" />
        <text x="25" y="31" fill="#854D0E" fontSize="9" fontWeight="extrabold" textAnchor="middle">Rp</text>
      </g>

      {/* Floating Verified Badge */}
      <g transform="translate(280, 25)">
        <circle cx="18" cy="18" r="16" fill="#843BAB" filter="drop-shadow(0px 3px 6px rgba(132,59,171,0.2))" />
        <path d="M12 18 L16 22 L24 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * 3. Public Speaking untuk Presentasi Kantor
 * Palette: Soft purple background (#f5f1fa), royal purple #843bab, presentation board, mic, audience
 */
function PublicSpeakingIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background */}
      <rect width="360" height="180" rx="12" fill="#F5F1FA" />
      <circle cx="180" cy="30" r="60" fill="#E9DEF7" opacity="0.6" />
      <circle cx="40" cy="130" r="35" fill="#FFF2B2" opacity="0.4" />

      {/* Standing Presentation Screen (Center) */}
      <g transform="translate(75, 15)">
        {/* Stand Poles */}
        <line x1="85" y1="110" x2="85" y2="145" stroke="#94A3B8" strokeWidth="3" />
        <path d="M60 145 L110 145" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />

        {/* Projection Board */}
        <rect width="170" height="98" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.06))" />
        
        {/* Presentation Header Bar */}
        <rect x="0" y="0" width="170" height="16" rx="8" fill="#843BAB" />
        <rect x="0" y="10" width="170" height="6" fill="#843BAB" />
        <circle cx="12" cy="8" r="2.5" fill="#FFDF0F" />
        <text x="24" y="11" fill="#FFFFFF" fontSize="8" fontWeight="bold">PRESENTASI BISNIS KANTOR</text>

        {/* Chart inside Screen */}
        <g transform="translate(16, 26)">
          <text x="0" y="10" fill="#0F172A" fontSize="9" fontWeight="extrabold">Struktur Pitching</text>
          <text x="0" y="20" fill="#64748B" fontSize="7">Penyampaian Ide Jelas & Percaya Diri</text>

          {/* Bar Charts */}
          <rect x="0" y="28" width="18" height="38" rx="3" fill="#E2D4F0" />
          <rect x="24" y="38" width="18" height="28" rx="3" fill="#A855F7" />
          <rect x="48" y="22" width="18" height="44" rx="3" fill="#843BAB" />
          <rect x="72" y="14" width="18" height="52" rx="3" fill="#FFDF0F" />

          {/* Growth Trend Arrow */}
          <path d="M8 26 L32 34 L56 18 L80 10 L88 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none" />
          <polygon points="88,8 94,11 90,16" fill="#10B981" />

          {/* Key Metric Card */}
          <g transform="translate(100, 26)">
            <rect width="36" height="38" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
            <text x="18" y="16" fill="#10B981" fontSize="10" fontWeight="extrabold" textAnchor="middle">98%</text>
            <text x="18" y="28" fill="#64748B" fontSize="6" fontWeight="bold" textAnchor="middle">AUDIENCE</text>
          </g>
        </g>
      </g>

      {/* Confident Speaker Silhouette & Podium on Left */}
      <g transform="translate(25, 60)">
        {/* Speech Bubble */}
        <g transform="translate(5, -25)">
          <rect width="45" height="22" rx="6" fill="#FFFFFF" stroke="#843BAB" strokeWidth="1.5" />
          <polygon points="12,22 18,22 14,27" fill="#843BAB" />
          <text x="22" y="14" fill="#843BAB" fontSize="8" fontWeight="extrabold" textAnchor="middle">Insight!</text>
        </g>

        {/* Podium */}
        <path d="M12 60 L38 60 L34 98 L16 98 Z" fill="#334155" />
        <rect x="8" y="55" width="34" height="6" rx="2" fill="#475569" />
        
        {/* Microphone */}
        <line x1="25" y1="55" x2="25" y2="42" stroke="#94A3B8" strokeWidth="2" />
        <ellipse cx="25" cy="40" rx="3.5" ry="5" fill="#843BAB" />
      </g>

      {/* Audience Silhouettes on Right Foreground */}
      <g transform="translate(265, 95)">
        <circle cx="16" cy="18" r="10" fill="#64748B" />
        <path d="M4 45 C4 32 10 28 16 28 C22 28 28 32 28 45 Z" fill="#475569" />

        <circle cx="44" cy="12" r="11" fill="#843BAB" />
        <path d="M30 45 C30 29 36 24 44 24 C52 24 58 29 58 45 Z" fill="#6D28D9" />

        <circle cx="70" cy="22" r="9" fill="#94A3B8" />
        <path d="M58 45 C58 35 64 32 70 32 C76 32 82 35 82 45 Z" fill="#64748B" />
      </g>

      {/* Floating Clapping / Star Badges */}
      <g transform="translate(295, 30)">
        <circle cx="16" cy="16" r="14" fill="#FFDF0F" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))" />
        <text x="16" y="21" fill="#843BAB" fontSize="12" fontWeight="extrabold" textAnchor="middle">★</text>
      </g>
    </svg>
  );
}

/**
 * 4. Bahasa Inggris untuk Percakapan Kerja
 * Palette: Soft blue & lavender (#f0f6ff), dialog speech bubbles, global communication
 */
function BahasaInggrisIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background */}
      <rect width="360" height="180" rx="12" fill="#F1F5FD" />
      <circle cx="80" cy="50" r="45" fill="#DBEAFE" opacity="0.6" />
      <circle cx="280" cy="120" r="50" fill="#EDE9FE" opacity="0.5" />

      {/* World Globe in Background */}
      <g transform="translate(140, 15)" opacity="0.25">
        <circle cx="40" cy="40" r="36" stroke="#843BAB" strokeWidth="2" fill="none" />
        <ellipse cx="40" cy="40" rx="36" ry="16" stroke="#843BAB" strokeWidth="1.5" fill="none" />
        <ellipse cx="40" cy="40" rx="16" ry="36" stroke="#843BAB" strokeWidth="1.5" fill="none" />
        <line x1="4" y1="40" x2="76" y2="40" stroke="#843BAB" strokeWidth="1.5" />
      </g>

      {/* Left Speaker & Big Speech Bubble */}
      <g transform="translate(30, 25)">
        {/* Dialog Bubble 1 (English Work Question) */}
        <g filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.06))">
          <rect width="135" height="54" rx="10" fill="#FFFFFF" stroke="#843BAB" strokeWidth="1.5" />
          <polygon points="35,54 45,54 38,62" fill="#843BAB" />
          
          <rect x="12" y="10" width="30" height="10" rx="3" fill="#843BAB" />
          <text x="27" y="17.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">MEETING</text>
          
          <text x="12" y="32" fill="#0F172A" fontSize="9.5" fontWeight="extrabold">
            &ldquo;Could you share the report?&rdquo;
          </text>
          <text x="12" y="44" fill="#64748B" fontSize="7.5">
            Percakapan presentasi & negosiasi
          </text>
        </g>

        {/* Person 1 Avatar */}
        <g transform="translate(20, 68)">
          <circle cx="20" cy="18" r="14" fill="#843BAB" />
          <path d="M6 46 C6 34 12 30 20 30 C28 30 34 34 34 46 Z" fill="#6B21A8" />
          <circle cx="20" cy="16" r="8" fill="#FED7AA" />
          {/* Headset / Comm icon */}
          <path d="M12 16 C12 11 15 8 20 8 C25 8 28 11 28 16" stroke="#FFDF0F" strokeWidth="2" fill="none" />
        </g>
      </g>

      {/* Right Speaker & Response Speech Bubble */}
      <g transform="translate(190, 55)">
        {/* Dialog Bubble 2 (English Work Response) */}
        <g filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.06))">
          <rect width="140" height="52" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
          <polygon points="105,52 115,52 110,60" fill="#0284C7" />
          
          <rect x="12" y="10" width="38" height="10" rx="3" fill="#0284C7" />
          <text x="31" y="17.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">CONFIRMED</text>

          <text x="12" y="32" fill="#0F172A" fontSize="9.5" fontWeight="extrabold">
            &ldquo;Certainly, sending it now!&rdquo;
          </text>
          <text x="12" y="43" fill="#10B981" fontSize="7.5" fontWeight="bold">
            ✓ Percaya diri & profesional
          </text>
        </g>

        {/* Person 2 Avatar */}
        <g transform="translate(95, 62)">
          <circle cx="20" cy="18" r="14" fill="#0284C7" />
          <path d="M6 46 C6 34 12 30 20 30 C28 30 34 34 34 46 Z" fill="#0369A1" />
          <circle cx="20" cy="16" r="8" fill="#FDE047" />
        </g>
      </g>

      {/* Floating Center Badge: Vocabulary & Audio Wave */}
      <g transform="translate(155, 115)">
        <rect width="50" height="26" rx="6" fill="#FFDF0F" filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.06))" />
        <text x="25" y="16" fill="#843BAB" fontSize="8.5" fontWeight="black" textAnchor="middle">A-Z VOCAB</text>
      </g>
    </svg>
  );
}

/**
 * 5. Microsoft Word untuk Surat Dinas
 * Palette: Official document white & navy, Microsoft Word blue #0284c7, red wax seal, fountain pen
 */
function WordSuratDinasIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background */}
      <rect width="360" height="180" rx="12" fill="#F3F6FA" />
      <circle cx="290" cy="50" r="50" fill="#E0EDFB" opacity="0.6" />
      <circle cx="70" cy="130" r="45" fill="#E8EDF5" opacity="0.6" />

      {/* Left: Stack of Office Files / Folders */}
      <g transform="translate(25, 45)">
        {/* Folder 1 */}
        <path d="M0 15 L25 15 L32 23 L65 23 L65 85 L0 85 Z" fill="#CBD5E1" />
        {/* Folder 2 (Word Blue) */}
        <path d="M8 8 L33 8 L40 16 L73 16 L73 85 L8 85 Z" fill="#2563EB" opacity="0.8" />
        {/* Word Icon Badge */}
        <rect x="18" y="32" width="26" height="26" rx="4" fill="#FFFFFF" />
        <text x="31" y="50" fill="#1D4ED8" fontSize="16" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">W</text>
        <rect x="18" y="64" width="40" height="4" rx="2" fill="#FFFFFF" opacity="0.7" />
        <rect x="18" y="72" width="25" height="4" rx="2" fill="#FFFFFF" opacity="0.5" />
      </g>

      {/* Center: Official Government Letter Document (Surat Dinas) */}
      <g transform="translate(115, 12)">
        {/* Document Shadow */}
        <rect x="3" y="3" width="132" height="156" rx="4" fill="#000000" opacity="0.05" />
        {/* Document Sheet */}
        <rect width="132" height="156" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />

        {/* Official Letterhead (Kop Surat) */}
        <g transform="translate(12, 10)">
          {/* Logo Garuda / Lembaga */}
          <circle cx="10" cy="10" r="9" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
          <path d="M10 4 L13 8 L17 9 L14 13 L15 17 L10 14 L5 17 L6 13 L3 9 L7 8 Z" fill="#843BAB" />
          
          {/* Kop Title Lines */}
          <rect x="25" y="4" width="80" height="4.5" rx="1.5" fill="#0F172A" />
          <rect x="25" y="11" width="60" height="3" rx="1" fill="#64748B" />
          <rect x="25" y="16" width="70" height="2.5" rx="1" fill="#94A3B8" />

          {/* Double Separator Line (Garis Kop Surat) */}
          <line x1="0" y1="23" x2="108" y2="23" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="0" y1="26" x2="108" y2="26" stroke="#0F172A" strokeWidth="0.5" />
        </g>

        {/* Document Body Lines */}
        <g transform="translate(16, 46)">
          {/* Nomor, Lampiran, Hal */}
          <rect x="0" y="0" width="45" height="3" rx="1" fill="#475569" />
          <rect x="0" y="6" width="35" height="3" rx="1" fill="#64748B" />
          <rect x="0" y="12" width="55" height="3" rx="1" fill="#475569" />

          {/* Paragraph Lines */}
          <rect x="0" y="22" width="100" height="3" rx="1" fill="#94A3B8" />
          <rect x="0" y="28" width="100" height="3" rx="1" fill="#94A3B8" />
          <rect x="0" y="34" width="85" height="3" rx="1" fill="#94A3B8" />

          <rect x="0" y="43" width="100" height="3" rx="1" fill="#94A3B8" />
          <rect x="0" y="49" width="95" height="3" rx="1" fill="#94A3B8" />
          <rect x="0" y="55" width="70" height="3" rx="1" fill="#94A3B8" />

          {/* Signature & Official Wax Stamp Area */}
          <g transform="translate(50, 66)">
            <rect x="5" y="0" width="45" height="3" rx="1" fill="#475569" />
            {/* Signature squiggly line */}
            <path d="M10 14 Q16 6 22 15 T34 12 T46 16" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <line x1="5" y1="20" x2="52" y2="20" stroke="#0F172A" strokeWidth="1" />
            <rect x="5" y="23" width="47" height="3" rx="1" fill="#64748B" />

            {/* Red / Crimson Official Seal Stamp */}
            <circle cx="8" cy="14" r="10" stroke="#DC2626" strokeWidth="1.5" fill="#FEE2E2" opacity="0.85" />
            <circle cx="8" cy="14" r="7" stroke="#DC2626" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
            <text x="8" y="16.5" fill="#DC2626" fontSize="5" fontWeight="extrabold" textAnchor="middle">SAH</text>
          </g>
        </g>
      </g>

      {/* Floating Fountain Pen on Right */}
      <g transform="translate(268, 55)">
        <g transform="rotate(35)">
          {/* Pen Body */}
          <rect x="0" y="0" width="12" height="70" rx="3" fill="#1E293B" />
          <rect x="0" y="10" width="12" height="5" fill="#FFDF0F" />
          <polygon points="0,70 12,70 6,86" fill="#843BAB" />
          <polygon points="4,82 8,82 6,90" fill="#FFDF0F" />
        </g>
      </g>

      {/* Format Compliant Ribbon Badge */}
      <g transform="translate(265, 25)">
        <rect width="68" height="22" rx="6" fill="#10B981" filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.08))" />
        <text x="34" y="14" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">STANDAR RESMI</text>
      </g>
    </svg>
  );
}

/**
 * 6. Excel untuk Administrasi Perkantoran
 * Palette: Microsoft Excel green #107c41, grid spreadsheet, fx formula, pie chart, administrative folder
 */
function ExcelAdministrasiIllustration() {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      {/* Background */}
      <rect width="360" height="180" rx="12" fill="#F1F9F4" />
      <circle cx="90" cy="35" r="45" fill="#DCFCE7" opacity="0.6" />
      <circle cx="280" cy="135" r="50" fill="#E0F2FE" opacity="0.5" />

      {/* Left: Administrative Clip & Summary */}
      <g transform="translate(25, 40)">
        <rect width="60" height="85" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.05))" />
        {/* Binder Clip */}
        <rect x="18" y="-5" width="24" height="10" rx="3" fill="#64748B" />
        <rect x="10" y="15" width="40" height="5" rx="2" fill="#107C41" />
        
        {/* Mini 3D Pie Chart */}
        <g transform="translate(30, 48)">
          <circle cx="0" cy="0" r="16" fill="#107C41" />
          <path d="M0 0 L16 0 A16 16 0 0 1 0 16 Z" fill="#FFDF0F" />
          <path d="M0 0 L0 16 A16 16 0 0 1 -14 7 Z" fill="#843BAB" />
        </g>
        <rect x="10" y="70" width="40" height="3" rx="1" fill="#94A3B8" />
      </g>

      {/* Center: Full Excel Spreadsheet Window */}
      <g transform="translate(95, 15)">
        {/* Window Shell */}
        <rect width="175" height="145" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.07))" />
        
        {/* Green Excel Titlebar */}
        <rect width="175" height="24" rx="8" fill="#107C41" />
        <rect y="16" width="175" height="8" fill="#107C41" />
        <text x="14" y="16" fill="#FFFFFF" fontSize="9" fontWeight="bold">Laporan_Administrasi.xlsx</text>
        <circle cx="152" cy="12" r="2.5" fill="#FFFFFF" opacity="0.5" />
        <circle cx="160" cy="12" r="2.5" fill="#FFFFFF" opacity="0.5" />

        {/* Formula Bar (fx) */}
        <rect x="0" y="24" width="175" height="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="10" y="36" fill="#107C41" fontSize="9" fontWeight="bold" fontFamily="monospace">fx</text>
        <line x1="26" y1="28" x2="26" y2="38" stroke="#CBD5E1" strokeWidth="1" />
        <text x="32" y="36" fill="#0F172A" fontSize="8" fontFamily="monospace" fontWeight="bold">=SUM(C2:C8)*VLOOKUP</text>

        {/* Grid Column Headers (A, B, C, D) */}
        <g transform="translate(0, 42)">
          <rect width="20" height="16" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
          <rect x="20" width="45" height="16" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="42.5" y="11" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">A (Item)</text>

          <rect x="65" width="45" height="16" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="87.5" y="11" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">B (Qty)</text>

          <rect x="110" width="65" height="16" fill="#E8F5E9" stroke="#107C41" strokeWidth="1" />
          <text x="142.5" y="11" fill="#107C41" fontSize="8" fontWeight="extrabold" textAnchor="middle">C (Total)</text>
        </g>

        {/* Row 1 */}
        <g transform="translate(0, 58)">
          <rect width="20" height="18" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="10" y="12" fill="#64748B" fontSize="8" textAnchor="middle">1</text>
          
          <rect x="20" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="24" y="12" fill="#0F172A" fontSize="7.5">ATK Kantor</text>

          <rect x="65" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="87" y="12" fill="#475569" fontSize="7.5" textAnchor="middle">120 pcs</text>

          <rect x="110" width="65" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="170" y="12" fill="#107C41" fontSize="7.5" fontWeight="bold" textAnchor="end">Rp 1.450.000</text>
        </g>

        {/* Row 2 (Active Selected Cell with green outline) */}
        <g transform="translate(0, 76)">
          <rect width="20" height="18" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="10" y="12" fill="#64748B" fontSize="8" textAnchor="middle">2</text>
          
          <rect x="20" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="24" y="12" fill="#0F172A" fontSize="7.5">Arsip Dokumen</text>

          <rect x="65" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="87" y="12" fill="#475569" fontSize="7.5" textAnchor="middle">45 berkas</text>

          {/* Active Highlight Cell */}
          <rect x="110" width="65" height="18" fill="#F0FDF4" stroke="#107C41" strokeWidth="2" />
          <text x="170" y="12" fill="#107C41" fontSize="7.5" fontWeight="extrabold" textAnchor="end">Rp 890.000</text>
          <rect x="172" y="15" width="3" height="3" fill="#107C41" />
        </g>

        {/* Row 3 */}
        <g transform="translate(0, 94)">
          <rect width="20" height="18" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="10" y="12" fill="#64748B" fontSize="8" textAnchor="middle">3</text>
          
          <rect x="20" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="24" y="12" fill="#0F172A" fontSize="7.5">Inventaris</text>

          <rect x="65" width="45" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="87" y="12" fill="#475569" fontSize="7.5" textAnchor="middle">18 unit</text>

          <rect x="110" width="65" height="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="170" y="12" fill="#107C41" fontSize="7.5" fontWeight="bold" textAnchor="end">Rp 3.200.000</text>
        </g>

        {/* Bottom Total Bar */}
        <g transform="translate(0, 112)">
          <rect width="110" height="18" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="105" y="12" fill="#0F172A" fontSize="8" fontWeight="extrabold" textAnchor="end">TOTAL REKAP:</text>
          
          <rect x="110" width="65" height="18" fill="#107C41" />
          <text x="170" y="12" fill="#FFFFFF" fontSize="8" fontWeight="extrabold" textAnchor="end">Rp 5.540.000</text>
        </g>
      </g>

      {/* Floating Pivot / Filter Badge on Right */}
      <g transform="translate(280, 50)">
        <rect width="52" height="48" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.06))" />
        <rect x="8" y="10" width="36" height="5" rx="2" fill="#843BAB" />
        <rect x="8" y="19" width="24" height="4" rx="2" fill="#FFDF0F" />
        <text x="26" y="38" fill="#107C41" fontSize="8" fontWeight="extrabold" textAnchor="middle">PIVOT ⚡</text>
      </g>
    </svg>
  );
}

/**
 * Fallback Generic Course Illustration
 */
function DefaultCourseIllustration({ title }: { title: string }) {
  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      <rect width="360" height="180" rx="12" fill="#F8FAFC" />
      <circle cx="180" cy="90" r="60" fill="#E2E8F0" opacity="0.5" />
      <rect x="120" y="45" width="120" height="90" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="135" y="60" width="90" height="10" rx="3" fill="#843BAB" />
      <rect x="135" y="78" width="70" height="6" rx="2" fill="#94A3B8" />
      <rect x="135" y="90" width="80" height="6" rx="2" fill="#CBD5E1" />
      <circle cx="195" cy="115" r="10" fill="#FFDF0F" />
    </svg>
  );
}
