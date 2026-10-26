import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import StudentDashboardClient from '@/components/StudentDashboardClient';
import { EnrollmentItem } from '@/components/MyCourseCard';

export const metadata: Metadata = {
  title: 'Dashboard Siswa & Aturan Belajar | Lembaga Kursus Pijar Aksara',
  description:
    'Pusat kendali belajar siswa, skala penugasan modul, aturan penilaian kuis kelulusan, alur sekuensial, dan panduan sertifikat kompetensi resmi Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function DashboardSiswaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // 1. Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  // Jika bukan peserta, arahkan ke dashboard peran masing-masing
  if (profile?.peran === 'admin') {
    redirect('/admin/dashboard');
  } else if (profile?.peran === 'instruktur') {
    redirect('/instruktur');
  }

  // 2. Ambil data pendaftaran milik peserta untuk kalkulasi skala penugasan
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
          id,
          urutan,
          judul,
          durasi_menit
        )
      ),
      progres_modul (
        id,
        modul_id,
        materi_dibaca_pada,
        lulus_pada
      ),
      sertifikat (
        id,
        nomor_sertifikat,
        diterbitkan_pada
      )
    `)
    .eq('peserta_id', user.id)
    .in('status', ['aktif', 'selesai', 'menunggu_bayar'])
    .order('didaftarkan_pada', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments for dashboard:', error);
  }

  // Transform data untuk StudentDashboardClient
  const coursesList: EnrollmentItem[] = (enrollments || []).map((e: any) => {
    const k = e.kursus || {};
    const instruktur = Array.isArray(k.instruktur) ? k.instruktur[0] : k.instruktur;
    const rawModulList = Array.isArray(k.modul) ? k.modul : [];
    const modulList = [...rawModulList].sort(
      (a: any, b: any) => (a.urutan || 0) - (b.urutan || 0)
    );
    const totalModul = modulList.length;

    // Petakan progres modul peserta
    const progresMap = new Map<string, any>();
    (e.progres_modul || []).forEach((pm: any) => {
      progresMap.set(pm.modul_id, pm);
    });

    const modulSummaryList = modulList.map((m: any) => {
      const pm = progresMap.get(m.id);
      return {
        id: m.id,
        urutan: m.urutan || 0,
        judul: m.judul || '',
        durasi_menit: Number(m.durasi_menit) || 0,
        is_lulus: !!pm?.lulus_pada,
        is_read: !!pm?.materi_dibaca_pada,
      };
    });

    const modulLulus = modulSummaryList.filter((m) => m.is_lulus).length;
    const sertifikatItem = Array.isArray(e.sertifikat) ? e.sertifikat[0] : e.sertifikat;

    const totalDurasiMenit = modulList.reduce(
      (acc: number, m: any) => acc + (Number(m.durasi_menit) || 0),
      0
    );
    const durasiSelesaiMenit = modulSummaryList.reduce((acc: number, m) => {
      return m.is_lulus ? acc + m.durasi_menit : acc;
    }, 0);

    // Cari modul berikutnya yang belum lulus (hanya untuk kursus aktif)
    const nextModulItem = modulSummaryList.find((m) => !m.is_lulus);
    const nextModul = nextModulItem
      ? {
          urutan: nextModulItem.urutan,
          judul: nextModulItem.judul,
          is_read: nextModulItem.is_read,
        }
      : null;

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
        total_durasi_menit: totalDurasiMenit,
        modul_list: modulSummaryList,
      },
      modul_lulus: modulLulus,
      durasi_selesai_menit: durasiSelesaiMenit,
      next_modul: nextModul,
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
    <StudentDashboardClient
      initialCourses={coursesList}
      userProfile={{
        nama_lengkap: profile?.nama_lengkap || 'Peserta',
        email: profile?.email || user.email || '',
      }}
    />
  );
}
