import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CertificateView from '@/components/CertificateView';
import { ShieldAlert, ArrowLeft, BookOpen } from 'lucide-react';

// Kebutuhan Non-Fungsional PRD Bagian 10: Halaman Sertifikat wajib noindex
export const metadata: Metadata = {
  title: 'Sertifikat Kelulusan | Lembaga Kursus Pijar Aksara',
  description: 'Sertifikat resmi tanda kelulusan kursus di Lembaga Kursus Pijar Aksara.',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/sertifikat/${id}`);
  }

  // Ambil detail sertifikat melalui RPC get_sertifikat_detail (BR-11, BR-12)
  const { data, error } = await supabase.rpc('get_sertifikat_detail', {
    p_identifier: id,
  });

  if (error || !data || data.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Akses Sertifikat Terbatas
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed">
            {error?.message || 'Sertifikat ini tidak ditemukan atau Anda tidak memiliki hak akses untuk melihatnya sesuai ketentuan privasi sistem.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
            <Link
              href="/kursus-saya"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white font-bold text-sm shadow-xs transition-all"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Kursus Saya</span>
            </Link>
            <Link
              href="/kursus"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
            >
              <BookOpen size={16} />
              <span>Lihat Katalog Kursus</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certificate = data[0];

  return <CertificateView certificate={certificate} />;
}
