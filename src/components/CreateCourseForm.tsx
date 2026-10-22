'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createKursusAction } from '@/app/instruktur/actions';
import { ArrowLeft, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!judul.trim() || !slug.trim() || !ringkasan.trim() || !deskripsi.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (harga !== 0 && (harga < 50000 || harga > 5000000)) {
      setErrorMsg('Sesuai BR-03: Harga kursus harus Rp0 (gratis) atau antara Rp50.000 s/d Rp5.000.000.');
      return;
    }

    if (kuota < 1 || kuota > 100) {
      setErrorMsg('Sesuai BR-03: Kuota peserta harus antara 1 sampai 100.');
      return;
    }

    if (nilaiLulus < 50 || nilaiLulus > 100) {
      setErrorMsg('Sesuai BR-03: Nilai kelulusan kuis harus antara 50 sampai 100.');
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
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '36px', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/instruktur" className="btn btn-outline" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
            Buat Kursus Baru (Status: Draf)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
            Kursus baru otomatis berstatus draf (BR-02). Anda dapat menyusun modul dan kuis setelah informasi dasar disimpan.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            Judul Kursus *
          </label>
          <input
            type="text"
            required
            value={judul}
            onChange={handleJudulChange}
            placeholder="Contoh: Belajar Fotografi Produk dengan Smartphone"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.94rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            Slug URL (Alamat Web) *
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="belajar-fotografi-produk-smartphone"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.94rem',
              fontFamily: 'monospace'
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Format URL: /kursus/{slug || 'contoh-slug'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Kategori *
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#162032',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.94rem'
              }}
            >
              <option value="Perkantoran">Perkantoran</option>
              <option value="Desain">Desain</option>
              <option value="Bahasa">Bahasa</option>
              <option value="Bisnis">Bisnis</option>
              <option value="Teknologi">Teknologi</option>
              <option value="Komunikasi">Komunikasi</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Harga (Rp) * (BR-03)
            </label>
            <input
              type="number"
              min={0}
              step={10000}
              value={harga}
              onChange={(e) => setHarga(parseInt(e.target.value || '0', 10))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.94rem'
              }}
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Isi 0 untuk kursus Gratis, atau Rp50.000 - Rp5.000.000
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Kuota Peserta * (BR-03)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={kuota}
              onChange={(e) => setKuota(parseInt(e.target.value || '1', 10))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.94rem'
              }}
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              1 sampai 100 kursi peserta
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Nilai Lulus Kuis * (BR-03)
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={nilaiLulus}
              onChange={(e) => setNilaiLulus(parseInt(e.target.value || '70', 10))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.94rem'
              }}
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Bawaan 70 (Rentang: 50 - 100)
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            Ringkasan Singkat (1-2 kalimat untuk katalog) *
          </label>
          <input
            type="text"
            required
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            placeholder="Pelajari teknik fotografi produk praktis menggunakan kamera ponsel untuk jualan online."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.94rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            Deskripsi Lengkap Kursus *
          </label>
          <textarea
            required
            rows={5}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Tuliskan latar belakang, manfaat kursus, sasaran peserta, dan kompetensi yang akan dicapai..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.94rem',
              lineHeight: 1.6
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Link href="/instruktur" className="btn btn-outline" style={{ padding: '12px 20px' }}>
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '12px 24px', backgroundColor: '#3b82f6' }}
          >
            <Plus size={18} />
            <span>{loading ? 'Menyimpan...' : 'Simpan & Lanjut ke Modul'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
