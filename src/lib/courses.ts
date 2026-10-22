import { createClient } from '@/lib/supabase/server';

export interface CourseDetailData {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  ringkasan: string;
  deskripsi: string;
  harga: number;
  kuota: number;
  nilai_lulus: number;
  status: string;
  kursi_terpakai: number;
  sisa_kursi: number;
  instruktur_nama: string;
  modul: Array<{
    id: string;
    urutan: number;
    judul: string;
    durasi_menit: number;
  }>;
}

export async function getPublishedCourses(
  category?: string,
  search?: string,
  priceFilter?: 'gratis' | 'berbayar' | 'semua'
) {
  const supabase = await createClient();

  // Memanggil security definer RPC get_kursus_katalog agar sisa kursi terhitung akurat
  // tanpa membocorkan data pribadi pendaftar ke publik (memenuhi BR-01, BR-06, BR-12)
  const { data, error } = await supabase.rpc('get_kursus_katalog');

  if (error || !data) {
    console.error('Error fetching courses from get_kursus_katalog:', error);
    return [];
  }

  let filtered = data as Array<{
    id: string;
    judul: string;
    slug: string;
    kategori: string;
    ringkasan: string;
    deskripsi: string;
    harga: number;
    kuota: number;
    nilai_lulus: number;
    status: string;
    instruktur_nama: string;
    kursi_terpakai: number;
    sisa_kursi: number;
  }>;

  if (category && category !== 'Semua') {
    filtered = filtered.filter(k => k.kategori.toLowerCase().includes(category.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(k => 
      k.judul.toLowerCase().includes(q) ||
      k.ringkasan.toLowerCase().includes(q) ||
      k.instruktur_nama.toLowerCase().includes(q)
    );
  }

  if (priceFilter === 'gratis') {
    filtered = filtered.filter(k => k.harga === 0);
  } else if (priceFilter === 'berbayar') {
    filtered = filtered.filter(k => k.harga > 0);
  }

  return filtered;
}

export async function getCourseBySlug(slug: string): Promise<CourseDetailData | null> {
  const supabase = await createClient();

  // 1. Ambil data kursus dan sisa kursi dari get_kursus_katalog
  const { data: katalogList, error: rpcErr } = await supabase.rpc('get_kursus_katalog');
  if (rpcErr || !katalogList) {
    console.error('RPC Error:', rpcErr);
    return null;
  }

  const course = (katalogList as any[]).find(k => k.slug === slug);

  // BR-01: Jika slug tidak ditemukan atau bukan berstatus 'terbit', kembalikan null -> 404
  if (!course) {
    return null;
  }

  // 2. Ambil silabus modul (judul dan durasi saja sesuai BR-01 & BR-08)
  const { data: modulList } = await supabase
    .from('modul')
    .select('id, urutan, judul, durasi_menit')
    .eq('kursus_id', course.id)
    .order('urutan', { ascending: true });

  return {
    id: course.id,
    judul: course.judul,
    slug: course.slug,
    kategori: course.kategori,
    ringkasan: course.ringkasan,
    deskripsi: course.deskripsi,
    harga: course.harga,
    kuota: course.kuota,
    nilai_lulus: course.nilai_lulus,
    status: course.status,
    kursi_terpakai: Number(course.kursi_terpakai),
    sisa_kursi: Number(course.sisa_kursi),
    instruktur_nama: course.instruktur_nama || 'Instruktur Pijar Aksara',
    modul: (modulList || []) as any[],
  };
}
