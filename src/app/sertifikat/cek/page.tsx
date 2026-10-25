import { Suspense } from 'react';
import type { Metadata } from 'next';
import CertificateVerificationClient from '@/components/CertificateVerificationClient';
import LoadingSpinner from '@/components/LoadingSpinner';

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
          <LoadingSpinner
            size="lg"
            variant="primary"
            label="Menyiapkan Verifikasi Sertifikat..."
            sublabel="Menghubungkan ke pangkalan data resmi Pijar Aksara"
            delayMs={150}
          />
        </div>
      }
    >
      <CertificateVerificationClient />
    </Suspense>
  );
}
