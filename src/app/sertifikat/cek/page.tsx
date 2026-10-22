import { redirect } from 'next/navigation';

export default function CekSertifikatPage() {
  // Sesuai PRD Bagian 14 (Di Luar Lingkup): Fitur verifikasi sertifikat publik ditiadakan.
  // Peserta mengakses dan mencetak/mengunduh sertifikat langsung melalui menu Kursus Saya.
  redirect('/kursus-saya');
}
