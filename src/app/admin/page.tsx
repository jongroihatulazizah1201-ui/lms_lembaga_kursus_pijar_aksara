import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AdminCourseReview from '@/components/AdminCourseReview';
import AdminRegistrations from '@/components/AdminRegistrations';
import AdminUserManagement from '@/components/AdminUserManagement';
import AdminAuditLog from '@/components/AdminAuditLog';
import {
  Shield,
  BookOpen,
  CreditCard,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

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
      {/* =========================================================================
          1. HEADER BANNER SECTION
         ========================================================================= */}
      <section className="bg-gradient-to-b from-purple-50/70 via-white to-slate-50/50 border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#843bab] uppercase tracking-wider border border-purple-200">
              Pusat Pengelola Lembaga
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Panel Administrator
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mt-2 max-w-3xl">
              Pusat kendali siklus penerbitan kursus, konfirmasi transaksi pendaftaran, tata kelola peran pengguna, dan audit log lembaga.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN TABS NAVIGATION (4 Core Tabs)
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1 scrollbar-none">
          {/* TAB 1: Tinjauan Kursus (tombol status) */}
          <Link
            href="/admin?tab=kursus"
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'kursus'
                ? 'border-[#843bab] text-[#843bab]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={15} />
            <span>Tinjauan Kursus (Tombol Status)</span>
            {pendingReviewCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffdf0f] text-slate-900 shadow-2xs animate-pulse">
                {pendingReviewCount} Menunggu
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                {formattedCourses.length}
              </span>
            )}
          </Link>

          {/* TAB 2: Pendaftaran dan Pembayaran (konfirmasi, batal) */}
          <Link
            href="/admin?tab=pendaftaran"
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'pendaftaran'
                ? 'border-[#843bab] text-[#843bab]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={15} />
            <span>Pendaftaran & Pembayaran (Konfirmasi, Batal)</span>
            {pendingPaymentsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 shadow-2xs">
                {pendingPaymentsCount} Menunggu
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                {formattedRegistrations.length}
              </span>
            )}
          </Link>

          {/* TAB 3: Pengguna (ubah peran, nonaktifkan) */}
          <Link
            href="/admin?tab=pengguna"
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'pengguna'
                ? 'border-[#843bab] text-[#843bab]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={15} />
            <span>Pengguna (Ubah Peran, Nonaktifkan)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              {users?.length || 0}
            </span>
          </Link>

          {/* TAB 4: Audit Log */}
          <Link
            href="/admin?tab=audit"
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'audit'
                ? 'border-[#843bab] text-[#843bab]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} />
            <span>Audit Log</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              {auditLogs?.length || 0}
            </span>
          </Link>
        </div>

        {/* =======================================================================
            3. TAB CONTENT ROUTING
           ======================================================================= */}
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
