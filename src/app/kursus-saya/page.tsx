import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import MyCoursesClient from '@/components/MyCoursesClient';
import { EnrollmentItem } from '@/components/MyCourseCard';

// Kebutuhan Non-Fungsional PRD: Halaman Kursus Saya wajib noindex
export const metadata: Metadata = {
  title: 'Kursus Saya | Lembaga Kursus Pijar Aksara',
  description: 'Daftar kursus, status pendaftaran, progres belajar, dan sertifikat kelulusan peserta di Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function KursusSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/kursus-saya');
  }

  // 1. Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  // 2. Ambil seluruh data pendaftaran milik peserta (RLS pendaftaran hanya izinkan user melihat miliknya, BR-12)
  const { data: enrollments, error } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      status,
      nominal,
      metode_bayar,
      batas_bayar,
      mayar_invoice_id,
      didaftarkan_pada,
      kursus:kursus_id (
        id,
        judul,
        slug,
        kategori,
        harga,
        instruktur:instruktur_id (
          nama_lengkap
        ),
        modul (
          id
        )
      ),
      progres_modul (
        id,
        lulus_pada
      ),
      sertifikat (
        id,
        nomor_sertifikat,
        diterbitkan_pada
      )
    `)
    .eq('peserta_id', user.id)
    .order('didaftarkan_pada', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
  }

  // Transform data untuk MyCoursesClient
  const coursesList: EnrollmentItem[] = (enrollments || []).map((e: any) => {
    const k = e.kursus || {};
    const instruktur = Array.isArray(k.instruktur) ? k.instruktur[0] : k.instruktur;
    const totalModul = Array.isArray(k.modul) ? k.modul.length : 0;
    const modulLulus = (e.progres_modul || []).filter((pm: any) => pm.lulus_pada !== null).length;
    const sertifikatItem = Array.isArray(e.sertifikat) ? e.sertifikat[0] : e.sertifikat;

    return {
      id: e.id,
      status: e.status,
      nominal: e.nominal,
      metode_bayar: e.metode_bayar,
      batas_bayar: e.batas_bayar,
      didaftarkan_pada: e.didaftarkan_pada,
      mayar_invoice_id: e.mayar_invoice_id,
      kursus: {
        id: k.id || '',
        judul: k.judul || 'Kursus Pijar Aksara',
        slug: k.slug || '',
        kategori: k.kategori || 'Umum',
        harga: k.harga || 0,
        instruktur_nama: instruktur?.nama_lengkap || 'Instruktur Pijar Aksara',
        total_modul: totalModul,
      },
      modul_lulus: modulLulus,
      sertifikat: sertifikatItem
        ? {
            id: sertifikatItem.id,
            nomor_sertifikat: sertifikatItem.nomor_sertifikat,
            diterbitkan_pada: sertifikatItem.diterbitkan_pada,
          }
        : null,
    };
  });

  return (
    <MyCoursesClient
      initialCourses={coursesList}
      userProfile={{
        nama_lengkap: profile?.nama_lengkap || 'Peserta',
        email: profile?.email || user.email || '',
      }}
    />
  );
}
