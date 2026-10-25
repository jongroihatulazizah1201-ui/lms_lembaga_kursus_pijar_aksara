import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AdminCourseReview from '@/components/AdminCourseReview';
import AdminRegistrations from '@/components/AdminRegistrations';
import AdminUserManagement from '@/components/AdminUserManagement';
import AdminAuditLog from '@/components/AdminAuditLog';

export const metadata: Metadata = {
  title: 'Panel Admin | Lembaga Kursus Pijar Aksara',
  description: 'Panel pengelola lembaga untuk tinjauan kursus, pendaftaran, pengguna, dan audit log.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPanelPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab || 'kursus';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // 1. Verifikasi peran admin (Route Guard)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, email, peran')
    .eq('id', user.id)
    .single();

  if (!profile || profile.peran !== 'admin') {
    redirect('/kursus-saya');
  }

  // 2. Ambil seluruh data kursus beserta instruktur, modul, dan soal (US-08, BR-02, BR-12)
  const { data: courses } = await supabase
    .from('kursus')
    .select(`
      id,
      judul,
      slug,
      kategori,
      ringkasan,
      deskripsi,
      harga,
      kuota,
      nilai_lulus,
      status,
      catatan_tinjauan,
      diajukan_pada,
      diterbitkan_pada,
      instruktur:instruktur_id (
        nama_lengkap,
        email
      ),
      modul (
        id,
        urutan,
        judul,
        isi_materi,
        durasi_menit,
        video_url,
        soal (
          id,
          urutan,
          pertanyaan,
          pilihan_a,
          pilihan_b,
          pilihan_c,
          pilihan_d,
          kunci_jawaban
        )
      )
    `)
    .order('dibuat_pada', { ascending: false });

  const formattedCourses = (courses || []).map((c: any) => ({
    ...c,
    instruktur: Array.isArray(c.instruktur) ? c.instruktur[0] : c.instruktur,
    modul: (c.modul || []).sort((a: any, b: any) => a.urutan - b.urutan),
  }));

  const pendingReviewCount = formattedCourses.filter((c: any) => c.status === 'ditinjau').length;

  // 3. Ambil data pendaftaran & pembayaran (US-09, BR-06, BR-07)
  const { data: registrations } = await supabase
    .from('pendaftaran')
    .select(`
      id,
      status,
      nominal,
      metode_bayar,
      batas_bayar,
      bukti_bayar_path,
      dibayar_pada,
      dikonfirmasi_oleh,
      alasan_batal,
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
    .order('didaftarkan_pada', { ascending: false });

  const formattedRegistrations = (registrations || []).map((r: any) => ({
    ...r,
    kursus: Array.isArray(r.kursus) ? r.kursus[0] : r.kursus,
    peserta: Array.isArray(r.peserta) ? r.peserta[0] : r.peserta,
  }));

  const pendingPaymentsCount = formattedRegistrations.filter(
    (r: any) => r.status === 'menunggu_bayar'
  ).length;

  // 4. Ambil data pengguna & peran akun (US-09, BR-12)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, no_hp, peran, aktif, dibuat_pada')
    .order('dibuat_pada', { ascending: false });

  // 5. Ambil data audit log (BR-12)
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select(`
      id,
      pelaku_id,
      aksi,
      nama_tabel,
      id_data,
      data_sebelum,
      data_sesudah,
      dibuat_pada,
      pelaku:pelaku_id (
        nama_lengkap,
        email,
        peran
      )
    `)
    .order('dibuat_pada', { ascending: false })
    .limit(100);

  const formattedAuditLogs = (auditLogs || []).map((l: any) => ({
    ...l,
    pelaku: Array.isArray(l.pelaku) ? l.pelaku[0] : l.pelaku,
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        {/* Tab 1: Tinjauan Kursus (tombol status) */}
        {activeTab === 'kursus' && (
          <AdminCourseReview courses={formattedCourses} />
        )}

        {/* Tab 2: Pendaftaran dan Pembayaran (konfirmasi, batal) */}
        {activeTab === 'pendaftaran' && (
          <AdminRegistrations registrations={formattedRegistrations} />
        )}

        {/* Tab 3: Pengguna (ubah peran, nonaktifkan) */}
        {activeTab === 'pengguna' && (
          <AdminUserManagement users={users || []} currentAdminId={user.id} />
        )}

        {/* Tab 4: Audit Log */}
        {activeTab === 'audit' && (
          <AdminAuditLog logs={formattedAuditLogs} />
        )}
      </div>
    </div>
  );
}
