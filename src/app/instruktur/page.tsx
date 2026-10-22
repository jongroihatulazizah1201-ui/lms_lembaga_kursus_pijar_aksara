import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import InstructorCoursesClient, { InstructorCourseItem } from '@/components/InstructorCoursesClient';

export const metadata: Metadata = {
  title: 'Kelola Kursus | Lembaga Kursus Pijar Aksara',
  description: 'Panel instruktur untuk menyusun materi, modul, soal kuis, dan mengajukan kursus.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InstrukturDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/instruktur');
  }

  // 1. Ambil profil user dan verifikasi peran (Route Guard)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.peran !== 'instruktur' && profile.peran !== 'admin')) {
    redirect('/kursus-saya');
  }

  // 2. Ambil daftar kursus milik instruktur (BR-12)
  const { data: courses, error } = await supabase
    .from('kursus')
    .select(`
      id,
      judul,
      slug,
      kategori,
      harga,
      kuota,
      nilai_lulus,
      status,
      catatan_tinjauan,
      diajukan_pada,
      diterbitkan_pada,
      dibuat_pada,
      modul (
        id,
        urutan,
        soal (
          id
        )
      ),
      pendaftaran (
        id,
        status
      )
    `)
    .eq('instruktur_id', user.id)
    .order('dibuat_pada', { ascending: false });

  if (error) {
    console.error('Error fetching instructor courses:', error);
  }

  const courseList: InstructorCourseItem[] = (courses || []).map((c: any) => {
    const modules = c.modul || [];
    const totalModul = modules.length;
    let totalSoal = 0;
    modules.forEach((m: any) => {
      totalSoal += (m.soal || []).length;
    });

    const activeEnrollments = (c.pendaftaran || []).filter(
      (p: any) => p.status === 'aktif' || p.status === 'selesai'
    ).length;

    return {
      id: c.id,
      judul: c.judul,
      slug: c.slug,
      kategori: c.kategori,
      harga: c.harga,
      kuota: c.kuota,
      nilai_lulus: c.nilai_lulus,
      status: c.status,
      catatan_tinjauan: c.catatan_tinjauan,
      diajukan_pada: c.diajukan_pada,
      diterbitkan_pada: c.diterbitkan_pada,
      dibuat_pada: c.dibuat_pada,
      total_modul: totalModul,
      total_soal: totalSoal,
      peserta_count: activeEnrollments,
    };
  });

  return (
    <InstructorCoursesClient
      initialCourses={courseList}
      profile={{
        nama_lengkap: profile.nama_lengkap,
        email: profile.email,
      }}
    />
  );
}
