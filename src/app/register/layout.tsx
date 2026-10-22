import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Akun Peserta Baru | Lembaga Kursus Pijar Aksara',
  description: 'Daftarkan diri Anda untuk mengikuti program pelatihan vokasi dan kursus praktis berstandar industri di Lembaga Kursus Pijar Aksara Depok.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
