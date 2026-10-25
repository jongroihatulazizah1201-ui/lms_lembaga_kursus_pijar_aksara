'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Award, ShieldCheck, CheckCircle2, Download, Copy, Check, Share2 } from 'lucide-react';

interface CertificateData {
  id: string;
  pendaftaran_id: string;
  nomor_sertifikat: string;
  nama_peserta: string;
  judul_kursus: string;
  kategori: string;
  diterbitkan_pada: string;
  instruktur_nama: string;
  peserta_email: string;
}

interface Props {
  certificate: CertificateData;
}

export default function CertificateView({ certificate }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const shareText = `Saya telah berhasil menyelesaikan kursus "${certificate.judul_kursus}" di Lembaga Kursus Pijar Aksara dengan nomor sertifikat resmi: ${certificate.nomor_sertifikat}.\nLihat sertifikat saya: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const formattedDate = new Date(certificate.diterbitkan_pada).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px 80px 16px' }}>
      {/* Top Action Bar (Hidden during printing) */}
      <div className="no-print container" style={{ maxWidth: '960px', marginBottom: '24px' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Link
            href="/kursus-saya"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-all"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Kursus Saya</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs sm:text-sm text-slate-500 hidden md:inline">
              Nomor: <strong className="text-slate-900 font-mono">{certificate.nomor_sertifikat}</strong>
            </span>

            {/* Tombol Salin Tautan Sertifikat */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Salin Tautan Sertifikat"
            >
              {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
            </button>

            {/* Tombol Bagikan ke WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              title="Bagikan ke WhatsApp"
            >
              <Share2 size={15} />
              <span>WhatsApp</span>
            </button>

            {/* Tombol Bagikan ke LinkedIn */}
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              title="Bagikan ke LinkedIn"
            >
              <Share2 size={15} />
              <span>LinkedIn</span>
            </button>

            {/* Tombol Cetak / Unduh PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
            >
              <Printer size={16} />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Certificate Sheet (Optimized for both screen & print) */}
      <div className="container" style={{ maxWidth: '960px' }}>
        <div
          id="certificate-print-area"
          style={{
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRadius: '16px',
            padding: '56px 48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '8px double #d97706',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
        >
          {/* Decorative Corner Ornaments */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            width: '40px',
            height: '40px',
            borderTop: '3px solid #b45309',
            borderLeft: '3px solid #b45309'
          }} />
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '40px',
            height: '40px',
            borderTop: '3px solid #b45309',
            borderRight: '3px solid #b45309'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            width: '40px',
            height: '40px',
            borderBottom: '3px solid #b45309',
            borderLeft: '3px solid #b45309'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '40px',
            height: '40px',
            borderBottom: '3px solid #b45309',
            borderRight: '3px solid #b45309'
          }} />

          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              backgroundColor: '#fef3c7',
              borderRadius: '20px',
              color: '#92400e',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              <Award size={18} color="#d97706" />
              <span>Sertifikat Resmi Kelulusan</span>
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#0f172a',
              textTransform: 'uppercase',
              margin: '0 0 4px 0'
            }}>
              Lembaga Kursus Pijar Aksara
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Depok, Jawa Barat &bull; Kursus Keterampilan Kerja & Wirausaha
            </div>
          </div>

          {/* Certificate Main Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 900,
              color: '#1e3a8a',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
              fontFamily: "Georgia, serif"
            }}>
              Sertifikat Kompetensi
            </h1>
            <div style={{
              display: 'inline-block',
              padding: '4px 18px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontFamily: 'monospace',
              color: '#334155',
              fontWeight: 600
            }}>
              Nomor: {certificate.nomor_sertifikat}
            </div>
          </div>

          {/* Recipient Statement */}
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px auto' }}>
            <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '14px' }}>
              Diberikan dengan penuh kehormatan kepada:
            </p>

            <h3 style={{
              fontSize: 'clamp(1.7rem, 3vw, 2.3rem)',
              fontWeight: 800,
              color: '#0f172a',
              textDecoration: 'underline',
              textDecorationColor: '#f59e0b',
              textUnderlineOffset: '8px',
              margin: '0 0 20px 0',
              fontFamily: "Georgia, serif"
            }}>
              {certificate.nama_peserta}
            </h3>

            <p style={{ fontSize: '1.02rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
              Atas keberhasilannya menyelesaikan seluruh materi kurikulum, penugasan berurutan, dan dinyatakan{' '}
              <strong style={{ color: '#059669' }}>LULUS</strong> pada evaluasi kuis akhir kursus:
            </p>

            <div style={{
              margin: '18px 0',
              padding: '16px 24px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'inline-block'
            }}>
              <span style={{
                fontSize: '1.28rem',
                fontWeight: 800,
                color: '#1e3a8a',
                display: 'block'
              }}>
                {certificate.judul_kursus}
              </span>
              <span style={{ fontSize: '0.84rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kategori: {certificate.kategori}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '24px',
            alignItems: 'flex-end',
            paddingTop: '24px',
            borderTop: '2px dashed #cbd5e1',
            marginTop: '20px'
          }}>
            {/* Signature Left: Direktur Lembaga */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontFamily: "'Brush Script MT', cursive, Georgia",
                  fontSize: '1.8rem',
                  color: '#1e3a8a'
                }}>
                  Pijar Aksara
                </span>
              </div>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                Direktur Lembaga
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Lembaga Kursus Pijar Aksara
              </div>
            </div>

            {/* Official Gold Seal Badge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                border: '4px solid #f59e0b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: '0 4px 10px rgba(217, 119, 6, 0.2)'
              }}>
                <ShieldCheck size={28} color="#d97706" />
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                  VALID
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Depok, {formattedDate}
              </div>
            </div>

            {/* Signature Right: Instruktur Pengampu */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontFamily: "'Brush Script MT', cursive, Georgia",
                  fontSize: '1.7rem',
                  color: '#1e3a8a'
                }}>
                  {certificate.instruktur_nama.split(' ')[0]}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                {certificate.instruktur_nama}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Instruktur Pengampu Kursus
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan elemen non-sertifikat */
          nav, footer, .no-print, header {
            display: none !important;
          }

          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #certificate-print-area {
            box-shadow: none !important;
            border: 6px double #d97706 !important;
            border-radius: 0 !important;
            padding: 40px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
