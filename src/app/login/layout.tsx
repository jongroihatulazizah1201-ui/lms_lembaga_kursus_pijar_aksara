import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk Akun Peserta & Instruktur | Lembaga Kursus Pijar Aksara',
  description: 'Halaman masuk portal belajar LMS Lembaga Kursus Pijar Aksara Depok. Akses materi pelatihan vokasi, kuis interaktif, dan sertifikat kelulusan Anda.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
