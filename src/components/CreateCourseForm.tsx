'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createKursusAction } from '@/app/instruktur/actions';
import { Plus, AlertCircle, CheckCircle2, Loader2, BookOpen } from 'lucide-react';

export default function CreateCourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [judul, setJudul] = useState('');
  const [slug, setSlug] = useState('');
  const [kategori, setKategori] = useState('Perkantoran');
  const [ringkasan, setRingkasan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [harga, setHarga] = useState<number>(0);
  const [kuota, setKuota] = useState<number>(20);
  const [nilaiLulus, setNilaiLulus] = useState<number>(70);

  const handleJudulChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setJudul(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!judul.trim() || !slug.trim() || !ringkasan.trim() || !deskripsi.trim()) {
      setErrorMsg('Semua kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    if (harga !== 0 && (harga < 50000 || harga > 5000000)) {
      setErrorMsg('Harga kursus harus Rp0 (gratis) atau antara Rp50.000 s/d Rp5.000.000.');
      return;
    }

    if (kuota < 1 || kuota > 100) {
      setErrorMsg('Kuota peserta harus antara 1 sampai 100.');
      return;
    }

    if (nilaiLulus < 50 || nilaiLulus > 100) {
      setErrorMsg('Nilai kelulusan kuis harus antara 50 sampai 100.');
      return;
    }

    setLoading(true);
    const res = await createKursusAction({
      judul,
      slug,
      kategori,
      ringkasan,
      deskripsi,
      harga,
      kuota,
      nilai_lulus: nilaiLulus,
    });
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.kursus?.id) {
      router.push(`/instruktur/kursus/${res.kursus.id}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs max-w-3xl mx-auto space-y-6"
    >
      {/* Header Form */}
      <div className="pb-6 border-b border-slate-100 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#843bab]/10 text-[#843bab] text-[11px] font-bold uppercase tracking-wider">
          <BookOpen size={12} />
          <span>Formulir Kursus Baru</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
          Buat Kursus Baru (Status: Draf)
        </h1>
        <p className="text-xs text-slate-500">
          Kursus baru otomatis berstatus draf. Anda dapat menyusun modul dan butir soal setelah informasi dasar ini disimpan.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Judul Kursus */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Judul Kursus *
          </label>
          <input
            type="text"
            required
            value={judul}
            onChange={handleJudulChange}
            placeholder="Contoh: Administrasi Perkantoran & Otomasi Dokumen"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
          />
        </div>

        {/* Slug URL & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Slug URL (Otomatis) *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="administrasi-perkantoran-otomasi"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Kategori Kursus *
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            >
              <option value="Perkantoran">Perkantoran</option>
              <option value="Desain">Desain</option>
              <option value="Bahasa">Bahasa</option>
              <option value="Keuangan">Keuangan</option>
              <option value="Pengembangan Diri">Pengembangan Diri</option>
            </select>
          </div>
        </div>

        {/* Harga & Kuota */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Harga (IDR) *
            </label>
            <input
              type="number"
              min={0}
              step={10000}
              value={harga}
              onChange={(e) => setHarga(parseInt(e.target.value || '0', 10))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            />
            <span className="text-[11px] text-slate-500">Rp0 untuk gratis, atau Rp50.000 s/d Rp5.000.000</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Kuota Kursi *
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={kuota}
              onChange={(e) => setKuota(parseInt(e.target.value || '20', 10))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            />
            <span className="text-[11px] text-slate-500">Antara 1 - 100 peserta</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Nilai Kelulusan Kuis *
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={nilaiLulus}
              onChange={(e) => setNilaiLulus(parseInt(e.target.value || '70', 10))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
            />
            <span className="text-[11px] text-slate-500">Standar kelulusan: 70 poin</span>
          </div>
        </div>

        {/* Ringkasan Singkat */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Ringkasan Singkat (Highlight Kursus) *
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            placeholder="Kuasai pembuatan surat dinas, pengelolaan arsip digital, dan korespondensi bisnis."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all"
          />
          <span className="text-[11px] text-slate-500">Maksimal 150 karakter untuk ditampilkan pada kartu katalog.</span>
        </div>

        {/* Deskripsi Lengkap */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Deskripsi Lengkap Kurikulum *
          </label>
          <textarea
            required
            rows={5}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan tujuan pembelajaran, kurikulum bertahap, dan kompetensi vokasi yang akan didapat peserta..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#843bab]/30 focus:border-[#843bab] transition-all resize-y"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <Link
          href="/instruktur"
          className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#843bab] hover:bg-[#722f96] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan Kursus...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Simpan &amp; Lanjut Susun Modul</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
