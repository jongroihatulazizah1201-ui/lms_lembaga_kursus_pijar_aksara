import { SupabaseClient } from '@supabase/supabase-js';

export interface PendingPaymentItem {
  id: string;
  status: string;
  nominal: number;
  metode_bayar: string;
  batas_bayar: string | null;
  bukti_bayar_path: string | null;
  didaftarkan_pada: string;
  isUrgent: boolean;
  remainingMinutes: number | null;
  kursus: {
    id: string;
    judul: string;
    slug: string;
    harga: number;
  };
  peserta: {
    id: string;
    nama_lengkap: string;
    email: string;
    no_hp: string | null;
  };
}

export interface ReviewCourseItem {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  ringkasan: string | null;
  harga: number;
  kuota: number;
  status: string;
  catatan_tinjauan: string | null;
  diajukan_pada: string | null;
  dibuat_pada: string;
  instruktur: {
    id: string;
    nama_lengkap: string;
    email: string;
  };
}

export interface AlmostFullCourseItem {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  harga: number;
  kuota: number;
  kursi_terpakai: number;
  sisa_kursi: number;
  persentase_terisi: number;
  instruktur: {
    id: string;
    nama_lengkap: string;
    email: string;
  };
}

export interface ExpiredRegistrationItem {
  id: string;
  status: string;
  nominal: number;
  metode_bayar: string;
  batas_bayar: string | null;
  didaftarkan_pada: string;
  kursus: {
    id: string;
    judul: string;
    slug: string;
    harga: number;
  };
  peserta: {
    id: string;
    nama_lengkap: string;
    email: string;
    no_hp: string | null;
  };
}

export interface AntreanData {
  pendingPayments: PendingPaymentItem[];
  reviewCourses: ReviewCourseItem[];
  almostFullCourses: AlmostFullCourseItem[];
  expiredRegistrations: ExpiredRegistrationItem[];
  summary: {
    totalUrgent: number;
    urgentPaymentsCount: number;
    totalPendingPayments: number;
    reviewCoursesCount: number;
    almostFullCoursesCount: number;
    expiredCount: number;
  };
}

/**
 * Menghitung jumlah item mendesak secara efisien untuk navigasi sidebar
 */
export async function getUrgentQueueCount(supabase: SupabaseClient): Promise<number> {
  try {
    const now = Date.now();
    const threeHoursFromNow = new Date(now + 3 * 60 * 60 * 1000).toISOString();

    // 1. Pembayaran menunggu bayar yang mendesak (< 3 jam atau lewat batas bayar atau null)
    const { data: pendingRegs } = await supabase
      .from('pendaftaran')
      .select('id, batas_bayar')
      .eq('status', 'menunggu_bayar');

    let urgentPaymentsCount = 0;
    (pendingRegs || []).forEach((r) => {
      if (!r.batas_bayar) {
        urgentPaymentsCount++;
      } else {
        const diffMs = new Date(r.batas_bayar).getTime() - now;
        if (diffMs <= 3 * 60 * 60 * 1000) {
          urgentPaymentsCount++;
        }
      }
    });

    // 2. Kursus menunggu tinjauan
    const { count: reviewCount } = await supabase
      .from('kursus')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ditinjau');

    // 3. Kursus hampir penuh (sisa kursi <= 2)
    const { data: courses } = await supabase
      .from('kursus')
      .select('id, kuota')
      .eq('status', 'terbit');

    let almostFullCount = 0;
    if (courses && courses.length > 0) {
      const nowIso = new Date(now).toISOString();
      const courseIds = courses.map((c) => c.id);

      const { data: activeRegs } = await supabase
        .from('pendaftaran')
        .select('kursus_id, status, batas_bayar')
        .in('kursus_id', courseIds)
        .or(`status.in.(aktif,selesai),and(status.eq.menunggu_bayar,batas_bayar.gt.${nowIso})`);

      const usedMap: Record<string, number> = {};
      (activeRegs || []).forEach((r) => {
        usedMap[r.kursus_id] = (usedMap[r.kursus_id] || 0) + 1;
      });

      courses.forEach((c) => {
        const used = usedMap[c.id] || 0;
        const remaining = c.kuota - used;
        if (remaining <= 2) {
          almostFullCount++;
        }
      });
    }

    return urgentPaymentsCount + (reviewCount || 0) + almostFullCount;
  } catch (err) {
    console.error('Error fetching urgent queue count:', err);
    return 0;
  }
}

/**
 * Mengambil seluruh data antrean operasional admin
 */
export async function getAntreanData(supabase: SupabaseClient): Promise<AntreanData> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Ambil pendaftaran menunggu konfirmasi bayar
  const { data: rawPending } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      status,
      nominal,
      metode_bayar,
      batas_bayar,
      bukti_bayar_path,
      didaftarkan_pada,
      kursus:kursus_id (
        id,
        judul,
        slug,
        harga
      ),
      peserta:peserta_id (
        id,
        nama_lengkap,
        email,
        no_hp
      )
    `)
    .eq('status', 'menunggu_bayar')
    .order('batas_bayar', { ascending: true, nullsFirst: false });

  let urgentPaymentsCount = 0;
  const pendingPayments: PendingPaymentItem[] = (rawPending || []).map((r: any) => {
    let isUrgent = false;
    let remainingMinutes: number | null = null;

    if (r.batas_bayar) {
      const diffMs = new Date(r.batas_bayar).getTime() - now;
      remainingMinutes = Math.round(diffMs / (60 * 1000));
      if (diffMs <= 3 * 60 * 60 * 1000) {
        isUrgent = true;
      }
    } else {
      isUrgent = true;
    }

    if (isUrgent) {
      urgentPaymentsCount++;
    }

    return {
      id: r.id,
      status: r.status,
      nominal: r.nominal,
      metode_bayar: r.metode_bayar,
      batas_bayar: r.batas_bayar,
      bukti_bayar_path: r.bukti_bayar_path || null,
      didaftarkan_pada: r.didaftarkan_pada,
      isUrgent,
      remainingMinutes,
      kursus: Array.isArray(r.kursus) ? r.kursus[0] : r.kursus,
      peserta: Array.isArray(r.peserta) ? r.peserta[0] : r.peserta,
    };
  });

  // 2. Ambil kursus menunggu tinjauan (status ditinjau)
  const { data: rawReview } = await supabase
    .from('kursus')
    .select(`
      id,
      judul,
      slug,
      kategori,
      ringkasan,
      harga,
      kuota,
      status,
      catatan_tinjauan,
      diajukan_pada,
      dibuat_pada,
      instruktur:instruktur_id (
        id,
        nama_lengkap,
        email
      )
    `)
    .eq('status', 'ditinjau')
    .order('diajukan_pada', { ascending: false });

  const reviewCourses: ReviewCourseItem[] = (rawReview || []).map((c: any) => ({
    id: c.id,
    judul: c.judul,
    slug: c.slug,
    kategori: c.kategori,
    ringkasan: c.ringkasan,
    harga: c.harga,
    kuota: c.kuota,
    status: c.status,
    catatan_tinjauan: c.catatan_tinjauan,
    diajukan_pada: c.diajukan_pada,
    dibuat_pada: c.dibuat_pada,
    instruktur: Array.isArray(c.instruktur) ? c.instruktur[0] : c.instruktur,
  }));

  // 3. Ambil kursus terbit dan hitung sisa kursi (kursus hampir penuh <= 2 kursi)
  const { data: rawTerbit } = await supabase
    .from('kursus')
    .select(`
      id,
      judul,
      slug,
      kategori,
      harga,
      kuota,
      status,
      instruktur:instruktur_id (
        id,
        nama_lengkap,
        email
      )
    `)
    .eq('status', 'terbit');

  const almostFullCourses: AlmostFullCourseItem[] = [];
  if (rawTerbit && rawTerbit.length > 0) {
    const courseIds = rawTerbit.map((c) => c.id);
    const { data: regsTerbit } = await supabase
      .from('pendaftaran')
      .select('kursus_id, status, batas_bayar')
      .in('kursus_id', courseIds)
      .or(`status.in.(aktif,selesai),and(status.eq.menunggu_bayar,batas_bayar.gt.${nowIso})`);

    const usedMap: Record<string, number> = {};
    (regsTerbit || []).forEach((r) => {
      usedMap[r.kursus_id] = (usedMap[r.kursus_id] || 0) + 1;
    });

    rawTerbit.forEach((c: any) => {
      const used = usedMap[c.id] || 0;
      const remaining = Math.max(0, c.kuota - used);
      if (remaining <= 2) {
        almostFullCourses.push({
          id: c.id,
          judul: c.judul,
          slug: c.slug,
          kategori: c.kategori,
          harga: c.harga,
          kuota: c.kuota,
          kursi_terpakai: used,
          sisa_kursi: remaining,
          persentase_terisi: Math.min(100, Math.round((used / c.kuota) * 100)),
          instruktur: Array.isArray(c.instruktur) ? c.instruktur[0] : c.instruktur,
        });
      }
    });

    // Urutkan sisa kursi paling sedikit dulu (0 kursi / penuh di urutan pertama)
    almostFullCourses.sort((a, b) => a.sisa_kursi - b.sisa_kursi);
  }

  // 4. Ambil pendaftaran kedaluwarsa 7 hari terakhir (hanya baca)
  const { data: rawExpired } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      status,
      nominal,
      metode_bayar,
      batas_bayar,
      didaftarkan_pada,
      kursus:kursus_id (
        id,
        judul,
        slug,
        harga
      ),
      peserta:peserta_id (
        id,
        nama_lengkap,
        email,
        no_hp
      )
    `)
    .eq('status', 'kedaluwarsa')
    .or(`batas_bayar.gte.${sevenDaysAgoIso},didaftarkan_pada.gte.${sevenDaysAgoIso}`)
    .order('batas_bayar', { ascending: false });

  const expiredRegistrations: ExpiredRegistrationItem[] = (rawExpired || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    nominal: r.nominal,
    metode_bayar: r.metode_bayar,
    batas_bayar: r.batas_bayar,
    didaftarkan_pada: r.didaftarkan_pada,
    kursus: Array.isArray(r.kursus) ? r.kursus[0] : r.kursus,
    peserta: Array.isArray(r.peserta) ? r.peserta[0] : r.peserta,
  }));

  const totalUrgent = urgentPaymentsCount + reviewCourses.length + almostFullCourses.length;

  return {
    pendingPayments,
    reviewCourses,
    almostFullCourses,
    expiredRegistrations,
    summary: {
      totalUrgent,
      urgentPaymentsCount,
      totalPendingPayments: pendingPayments.length,
      reviewCoursesCount: reviewCourses.length,
      almostFullCoursesCount: almostFullCourses.length,
      expiredCount: expiredRegistrations.length,
    },
  };
}
