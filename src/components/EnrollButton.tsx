'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { daftarKursusAction } from '@/app/kursus/actions';
import { formatRupiah } from './CourseCard';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Building,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  X,
  Lock
} from 'lucide-react';

interface Props {
  courseId: string;
  slug: string;
  harga: number;
  sisaKursi: number;
  initialEnrollment?: {
    id: string;
    status: string;
    batas_bayar?: string;
  } | null;
  isLoggedIn: boolean;
  userRole?: string | null;
}

export default function EnrollButton({
  courseId,
  slug,
  harga,
  sisaKursi,
  initialEnrollment,
  isLoggedIn,
  userRole,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState<'qris' | 'va' | 'transfer_manual'>('qris');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{
    status: string;
    paymentUrl: string | null;
    message: string;
  } | null>(null);

  const isFree = harga === 0;
  const isFull = sisaKursi <= 0;

  // 1. Jika pengguna belum login
  if (!isLoggedIn) {
    if (isFull) {
      return (
        <button
          disabled
          type="button"
          className="w-full py-3.5 px-5 rounded-xl text-sm font-bold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Lock size={16} />
          <span>Pendaftaran Ditutup (Penuh)</span>
        </button>
      );
    }
    return (
      <Link
        href={`/login?redirect=/kursus/${slug}`}
        className="w-full py-3.5 px-5 rounded-xl text-sm font-black text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
      >
        <span>Masuk untuk Mendaftar</span>
        <ArrowRight size={16} />
      </Link>
    );
  }

  // 2. Jika login tetapi perannya bukan Peserta (BR-05)
  if (userRole && userRole !== 'peserta') {
    return (
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <div>
          Anda masuk sebagai <strong className="capitalize">{userRole}</strong>. Hanya akun <strong>Peserta</strong> yang dapat melakukan pendaftaran kursus.
        </div>
      </div>
    );
  }

  // 3. Jika sudah memiliki pendaftaran yang masih berlaku (BR-05)
  if (initialEnrollment) {
    if (initialEnrollment.status === 'aktif') {
      return (
        <div className="space-y-2 w-full">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Anda sudah terdaftar aktif di kursus ini</span>
          </div>
          <Link
            href={`/belajar/${slug}`}
            className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-[#843bab] hover:bg-[#722f95] shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <span>Lanjut Belajar di Ruang Kelas</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      );
    } else if (initialEnrollment.status === 'menunggu_bayar') {
      return (
        <div className="space-y-2 w-full">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <span>Pendaftaran Anda menunggu pembayaran</span>
          </div>
          <Link
            href="/kursus-saya"
            className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <span>Lihat Tagihan & Bayar</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      );
    } else if (initialEnrollment.status === 'selesai') {
      return (
        <Link
          href="/kursus-saya"
          className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Kursus Selesai (Lihat Sertifikat)</span>
        </Link>
      );
    }
  }

  // 4. Jika kuota kursi penuh (BR-06)
  if (isFull) {
    return (
      <button
        disabled
        type="button"
        className="w-full py-3.5 px-5 rounded-xl text-sm font-bold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock size={16} />
        <span>Pendaftaran Ditutup (Kuota Penuh)</span>
      </button>
    );
  }

  // Handle pendaftaran kursus (gratis langsung / berbayar via modal)
  const handleEnroll = async (selectedMetode: string = 'gratis') => {
    setLoading(true);
    setError('');

    // Sesuai enum metode_bayar_enum: 'gratis', 'transfer_manual', 'mayar'
    const dbMetode = selectedMetode === 'qris' || selectedMetode === 'va' ? 'mayar' : selectedMetode;

    const res = await daftarKursusAction(courseId, dbMetode);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccessData({
        status: res.status,
        paymentUrl: res.paymentUrl || null,
        message: res.message,
      });
      if (res.isFree) {
        setTimeout(() => {
          router.push('/kursus-saya');
        }, 1500);
      }
    }
  };

  return (
    <>
      {/* Trigger Button Pendaftaran */}
      {isFree ? (
        <button
          type="button"
          onClick={() => handleEnroll('gratis')}
          disabled={loading}
          className="w-full py-3.5 px-5 rounded-xl text-sm font-black text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Mendaftarkan Kursus...</span>
          ) : (
            <>
              <span>Daftar Kursus Gratis Ini</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 px-5 rounded-xl text-sm font-black text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Daftar & Pilih Pembayaran</span>
          <ArrowRight size={16} />
        </button>
      )}

      {/* Modal Pilihan Metode Pembayaran (Kursus Berbayar) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto text-slate-900 animate-fadeIn">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setSuccessData(null);
                setError('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X size={20} />
            </button>

            {/* State Berhasil */}
            {successData ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Pendaftaran Kursus Berhasil!
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {successData.message}
                </p>

                {successData.paymentUrl ? (
                  <div className="pt-2 flex flex-col gap-2.5">
                    <a
                      href={successData.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-5 rounded-xl text-sm font-bold text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>Lanjut Bayar via Mayar</span>
                      <ExternalLink size={16} />
                    </a>
                    <Link
                      href="/kursus-saya"
                      className="w-full py-3 px-5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
                    >
                      Buka Halaman Kursus Saya
                    </Link>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Link
                      href="/kursus-saya"
                      className="w-full py-3 px-5 rounded-xl text-sm font-bold text-white bg-[#843bab] hover:bg-[#722f95] transition-all flex items-center justify-center"
                    >
                      Buka Ruang Belajar Saya
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Pendaftaran Kursus Berbayar
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan tentukan metode pembayaran yang Anda inginkan untuk reservasi kursi.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Ringkasan Biaya */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Biaya Kursus:
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {formatRupiah(harga)}
                  </span>
                </div>

                {/* Opsi Metode Pembayaran */}
                <div className="space-y-2.5">
                  <label
                    onClick={() => setMetodeBayar('qris')}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      metodeBayar === 'qris'
                        ? 'border-[#843bab] bg-purple-50/50 ring-2 ring-[#843bab]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                      <QrCode size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        QRIS (GoPay / OVO / Dana / BCA / LinkAja)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Pembayaran instan otomatis via Mayar Payment Gateway
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'qris'}
                      onChange={() => setMetodeBayar('qris')}
                      className="accent-[#843bab]"
                    />
                  </label>

                  <label
                    onClick={() => setMetodeBayar('va')}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      metodeBayar === 'va'
                        ? 'border-[#843bab] bg-purple-50/50 ring-2 ring-[#843bab]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#843bab] flex items-center justify-center shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        Virtual Account Bank
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        BCA, Mandiri, BNI, BRI, Permata terkonfirmasi otomatis
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'va'}
                      onChange={() => setMetodeBayar('va')}
                      className="accent-[#843bab]"
                    />
                  </label>

                  <label
                    onClick={() => setMetodeBayar('transfer_manual')}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      metodeBayar === 'transfer_manual'
                        ? 'border-[#843bab] bg-purple-50/50 ring-2 ring-[#843bab]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Building size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        Transfer Bank Manual
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Verifikasi slip transfer oleh admin LKP Pijar Aksara
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="metode"
                      checked={metodeBayar === 'transfer_manual'}
                      onChange={() => setMetodeBayar('transfer_manual')}
                      className="accent-[#843bab]"
                    />
                  </label>
                </div>

                {/* BR-07 Notice: Batas 24 Jam */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <Clock size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    Pendaftaran berlaku selama <strong>24 jam</strong>. Jika tidak diselesaikan sebelum batas waktu, reservasi kursi dibatalkan otomatis.
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={() => handleEnroll(metodeBayar)}
                  disabled={loading}
                  className="w-full py-3.5 px-5 rounded-xl text-sm font-black text-slate-900 bg-[#ffdf0f] hover:bg-[#eacb0d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Memproses Reservasi Kursi...</span>
                  ) : (
                    <>
                      <span>Konfirmasi & Lanjut Bayar</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
