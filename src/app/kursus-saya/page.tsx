import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import MyCourseCard from '@/components/MyCourseCard';
import { BookOpen, Award, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Kursus Saya wajib noindex
export const metadata: Metadata = {
  title: 'Kursus Saya | Lembaga Kursus Pijar Aksara',
  description: 'Daftar kursus dan progres belajar peserta di Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function KursusSayaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      )
    `)
    .eq('peserta_id', user.id)
    .order('didaftarkan_pada', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
  }

  // Transform data untuk MyCourseCard
  const coursesList = (enrollments || []).map((e: any) => {
    const k = e.kursus || {};
    const instruktur = Array.isArray(k.instruktur) ? k.instruktur[0] : k.instruktur;
    const totalModul = Array.isArray(k.modul) ? k.modul.length : 0;
    const modulLulus = (e.progres_modul || []).filter((pm: any) => pm.lulus_pada !== null).length;

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
    };
  });

  // Statistik Ringkasan Peserta
  const totalAktif = coursesList.filter((c: any) => c.status === 'aktif').length;
  const totalMenunggu = coursesList.filter((c: any) => c.status === 'menunggu_bayar').length;
  const totalSelesai = coursesList.filter((c: any) => c.status === 'selesai').length;

  return (
    <div style={{ paddingBottom: '96px' }}>
      {/* Top Header Banner */}
      <section style={{
        backgroundColor: 'rgba(18, 26, 43, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '36px 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-primary">DASHBOARD PESERTA</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {profile?.email}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#ffffff', marginBottom: '6px' }}>
                Selamat Datang, {profile?.nama_lengkap || 'Peserta'}!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
                Pantau progres belajar, status pendaftaran, dan sertifikat kelulusan Anda.
              </p>
            </div>

            {/* Quick Stats Counter */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>{totalAktif}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Aktif Belajar</div>
              </div>

              <div style={{
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{totalMenunggu}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Menunggu Bayar</div>
              </div>

              <div style={{
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{totalSelesai}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Selesai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content List */}
      <section style={{ paddingTop: '40px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff' }}>
              Daftar Kursus yang Anda Ikuti ({coursesList.length})
            </h2>

            <Link href="/kursus" className="btn btn-outline" style={{ fontSize: '0.86rem', padding: '8px 16px' }}>
              <BookOpen size={15} />
              <span>Jelajahi Kursus Lain</span>
            </Link>
          </div>

          {coursesList.length === 0 ? (
            /* Empty State */
            <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--primary)'
              }}>
                <BookOpen size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
                Belum Ada Kursus yang Terdaftar
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Anda belum mendaftar kursus apapun. Temukan kursus praktis Excel, Desain Canva, Bahasa Inggris, atau Pembukuan di katalog kami.
              </p>
              <Link href="/kursus" className="btn btn-primary" style={{ padding: '12px 24px', justifyContent: 'center' }}>
                <span>Lihat Katalog Kursus</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            /* Grid of Enrolled Courses */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px'
            }}>
              {coursesList.map((item: any) => (
                <MyCourseCard key={item.id} enrollment={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
