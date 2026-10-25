import { Suspense } from 'react';
import type { Metadata } from 'next';
import CertificateVerificationClient from '@/components/CertificateVerificationClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verifikasi Sertifikat Resmi | Lembaga Kursus Pijar Aksara',
  description: 'Halaman verifikasi keaslian dan status sertifikat resmi Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CekSertifikatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center p-8">
          <Loader2 size={32} className="animate-spin text-[#843bab]" />
        </div>
      }
    >
      <CertificateVerificationClient />
    </Suspense>
  );
}
