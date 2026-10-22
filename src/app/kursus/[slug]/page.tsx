import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/courses';
import { formatRupiah } from '@/components/CourseCard';
import { createClient } from '@/lib/supabase/server';
import EnrollButton from '@/components/EnrollButton';
import {
  BookOpen,
  Clock,
  Users,
  Award,
  Lock,
  CheckCircle2,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Kursus Tidak Ditemukan | Pijar Aksara',
    };
  }

  return {
    title: `${course.judul} | Lembaga Kursus Pijar Aksara`,
    description: course.ringkasan,
    openGraph: {
      title: `${course.judul} | Pijar Aksara Depok`,
      description: course.ringkasan,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  // BR-01: Kursus non-terbit (draf, ditinjau, ditutup) otomatis menghasilkan 404 bagi pengunjung
  if (!course) {
    notFound();
  }

  // Cek sesi autentikasi dan pendaftaran user saat ini
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let myEnrollment: any = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('peran')
      .eq('id', user.id)
      .single();
    userRole = profile?.peran || null;

    const { data: enrollList } = await supabase.rpc('get_pendaftaran_saya', {
      p_kursus_id: course.id,
    });
    if (enrollList && enrollList.length > 0) {
      myEnrollment = enrollList[0];
    }
  }

  const isFree = course.harga === 0;
  const isFull = course.sisa_kursi <= 0;
  const isLastSeat = course.sisa_kursi === 1;

  // Total estimasi durasi seluruh modul
  const totalDurasi = course.modul.reduce((acc, m) => acc + (m.durasi_menit || 0), 0);

  return (
    <div style={{ paddingBottom: '96px' }}>
      {/* Top Breadcrumb Header */}
      <section style={{
        backgroundColor: 'rgba(18, 26, 43, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 0'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: 'var(--text-dim)',
            flexWrap: 'wrap'
          }}>
            <Link href="/" style={{ color: 'var(--text-muted)' }}>Beranda</Link>
            <ChevronRight size={14} />
            <Link href="/kursus" style={{ color: 'var(--text-muted)' }}>Katalog Kursus</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)' }}>{course.judul}</span>
          </div>
        </div>
      </section>

      {/* Hero Overview */}
      <section style={{ padding: '48px 0 32px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'flex-start'
          }}>
            {/* Left Content (Title, Summary, Highlights) */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>
                  {course.kategori}
                </span>
                <span className="badge badge-success">
                  <CheckCircle2 size={13} />
                  Kursus Aktif & Terbit
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
                lineHeight: 1.25,
                marginBottom: '20px',
                color: '#ffffff'
              }}>
                {course.judul}
              </h1>

              <p style={{
                fontSize: '1.08rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: '32px'
              }}>
                {course.ringkasan}
              </p>

              {/* Key Meta Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    STANDAR KELULUSAN
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color="var(--accent)" />
                    <span>Nilai &ge; {course.nilai_lulus}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    JUMLAH MODUL
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={18} color="var(--primary)" />
                    <span>{course.modul.length} Modul</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    ESTIMASI DURASI
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={18} color="#34d399" />
                    <span>{totalDurasi} Menit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Registration Sticky Box */}
            <div className="glass-panel" style={{
              padding: '32px',
              position: 'sticky',
              top: '100px'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Biaya Kursus
              </div>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: isFree ? '#34d399' : 'var(--accent)',
                marginBottom: '16px'
              }}>
                {formatRupiah(course.harga)}
              </div>

              {/* Remaining Seat Warning / Alert */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isFull ? 'var(--danger-bg)' : isLastSeat ? 'var(--warning-bg)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isFull ? 'rgba(239, 68, 68, 0.3)' : isLastSeat ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                    Status Ketersediaan:
                  </span>
                  {isFull ? (
                    <span className="badge badge-danger">Penuh</span>
                  ) : isLastSeat ? (
                    <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                      Sisa 1 Kursi
                    </span>
                  ) : (
                    <span className="badge badge-success">Tersedia</span>
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {isFull ? (
                    'Seluruh kursi pada kursus ini telah terisi penuh.'
                  ) : isLastSeat ? (
                    'Hanya tersisa 1 kursi lagi sebelum pendaftaran ditutup!'
                  ) : (
                    `Tersisa ${course.sisa_kursi} dari total ${course.kuota} kursi peserta.`
                  )}
                </div>
              </div>

              {/* Action Button */}
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                harga={course.harga}
                sisaKursi={course.sisa_kursi}
                initialEnrollment={myEnrollment}
                isLoggedIn={!!user}
                userRole={userRole}
              />

              <div style={{
                marginTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-dim)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Sertifikat kelulusan resmi berurutan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Materi bacaan & kuis interaktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Detailed Description & Syllabus */}
      <section style={{ paddingTop: '20px' }}>
        <div className="container">
          <div style={{ maxWidth: '820px' }}>
            {/* Description Tab */}
            <div className="glass-panel" style={{ padding: '36px', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '18px', color: '#ffffff' }}>
                Deskripsi Program Kursus
              </h2>
              <div style={{
                fontSize: '0.96rem',
                color: 'var(--text-muted)',
                lineHeight: 1.8,
                whiteSpace: 'pre-line'
              }}>
                {course.deskripsi}
              </div>
            </div>

            {/* Instructor Profile Card */}
            <div className="glass-panel" style={{ padding: '28px 36px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px var(--primary-glow)'
              }}>
                <User size={30} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Instruktur Pengajar
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '2px 0 4px 0' }}>
                  {course.instruktur_nama}
                </h3>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Tenaga Pengajar Terverifikasi Lembaga Kursus Pijar Aksara
                </div>
              </div>
            </div>

            {/* Syllabus Section (BR-08) */}
            <div className="glass-panel" style={{ padding: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', color: '#ffffff' }}>Silabus & Kurikulum</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                    Disusun berurutan. Selesaikan modul untuk membuka materi berikutnya.
                  </p>
                </div>
                <span className="badge badge-primary">
                  {course.modul.length} Modul Pembelajaran
                </span>
              </div>

              {/* Modules List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {course.modul.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '18px 22px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}>
                        {m.urutan}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '1rem' }}>
                          {m.judul}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                          <span>Durasi: {m.durasi_menit} Menit</span>
                          <span>&bull;</span>
                          <span>Evaluasi Kuis Otomatis</span>
                        </div>
                      </div>
                    </div>

                    {/* Lock Indicator (BR-08) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      <Lock size={15} />
                      <span style={{ display: 'none' }}>Terkunci</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informative Note */}
              <div style={{
                marginTop: '24px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '0.84rem',
                color: '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Lock size={16} color="#60a5fa" />
                <span>Materi teks, video, dan kuis modul akan terbuka secara berurutan setelah Anda terdaftar.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
