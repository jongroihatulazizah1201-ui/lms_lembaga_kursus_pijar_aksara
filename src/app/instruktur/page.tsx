import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { formatRupiah } from '@/components/CourseCard';
import CourseStatusBadge from '@/components/CourseStatusBadge';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Users,
  ArrowRight,
  ShieldAlert,
  Send,
  Lock,
  RotateCcw
} from 'lucide-react';

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
  const { data: { user } } = await supabase.auth.getUser();

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

  const courseList = (courses || []).map((c: any) => {
    const modules = c.modul || [];
    const totalModul = modules.length;
    let totalSoal = 0;
    modules.forEach((m: any) => {
      totalSoal += (m.soal || []).length;
    });

    const activeEnrollments = (c.pendaftaran || []).filter((p: any) =>
      p.status === 'aktif' || p.status === 'selesai'
    ).length;

    return {
      ...c,
      total_modul: totalModul,
      total_soal: totalSoal,
      peserta_count: activeEnrollments,
    };
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      {/* Top Header Banner */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#843bab]/10 text-[#843bab] uppercase tracking-wider">
                  Panel Instruktur
                </span>
                <span className="text-xs text-slate-500">
                  {profile.email}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kelola Kursus & Silabus
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Susun modul materi, butir soal kuis evaluasi, dan ajukan kursus dari status draf ke tahap peninjauan tim admin (BR-02).
              </p>
            </div>

            <Link
              href="/instruktur/kursus/baru"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 font-bold text-sm shadow-sm transition-all shrink-0 min-h-[48px]"
            >
              <Plus size={18} />
              <span>Buat Kursus Baru</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Course List Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {courseList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <BookOpen size={48} className="mx-auto mb-4 text-[#843bab]" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Belum Ada Kursus yang Dibuat
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Mulai bagikan keahlian Anda dengan menyusun materi kursus berkualitas. Lengkapi silabus dengan minimal 2 modul dan 3 soal kuis per modul untuk dapat diajukan (BR-03).
            </p>
            <Link
              href="/instruktur/kursus/baru"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ffdf0f] hover:bg-[#eacb0d] text-slate-900 font-bold text-xs shadow-sm transition-all min-h-[44px]"
            >
              <Plus size={16} />
              <span>Buat Kursus Pertama Anda</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseList.map((course: any) => {
              const isLocked = course.status !== 'draf';

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-4">
                    {/* Badge Status & Kategori */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#843bab] uppercase tracking-wider">
                        {course.kategori}
                      </span>
                      <CourseStatusBadge status={course.status} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                      {course.judul}
                    </h3>

                    {/* Harga & Kuota */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span>Harga: <strong className="text-slate-900">{course.harga === 0 ? 'Gratis' : formatRupiah(course.harga)}</strong></span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Kuota: <strong className="text-slate-900">{course.kuota} Kursi</strong></span>
                    </div>

                    {/* Modul & Soal Counter (BR-03 Checklist Summary) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 text-center divide-x divide-slate-200">
                      <div className="px-1">
                        <div className={`text-base font-extrabold ${course.total_modul >= 2 && course.total_modul <= 10 ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {course.total_modul}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Modul (2-10)</div>
                      </div>
                      <div className="px-1">
                        <div className="text-base font-extrabold text-[#843bab]">
                          {course.total_soal}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Total Soal</div>
                      </div>
                      <div className="px-1">
                        <div className="text-base font-extrabold text-slate-800">
                          {course.peserta_count}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Peserta Aktif</div>
                      </div>
                    </div>

                    {/* Catatan Pengembalian Admin (BR-02) */}
                    {course.catatan_tinjauan && course.status === 'draf' && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-slate-800">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
                          <RotateCcw size={14} className="text-amber-700 shrink-0" />
                          <span>Catatan Perbaikan dari Admin:</span>
                        </div>
                        <p className="italic pl-5 text-slate-700 leading-relaxed">&ldquo;{course.catatan_tinjauan}&rdquo;</p>
                      </div>
                    )}

                    {/* Konten Terkunci Info (BR-04) */}
                    {isLocked && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Lock size={13} className="text-slate-400 shrink-0" />
                        <span>Materi terkunci selama peninjauan / terbit (BR-04)</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                    <Link
                      href={`/instruktur/kursus/${course.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      <span>{isLocked ? 'Lihat Silabus' : 'Edit Kursus & Soal'}</span>
                    </Link>
                    <Link
                      href={`/instruktur/nilai?kursus=${course.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors min-h-[44px]"
                    >
                      <Users size={14} className="text-[#843bab]" />
                      <span>Peserta & Nilai</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
