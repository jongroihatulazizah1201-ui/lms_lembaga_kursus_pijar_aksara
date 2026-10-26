import Link from 'next/link';
import { MapPin, Mail, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-[#843bab]/20 bg-[#843bab]/20 pt-12 pb-8 mt-12 backdrop-blur-sm content-visibility-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-slate-700 text-sm leading-relaxed max-w-md mb-4 font-normal">
              Lembaga Kursus &amp; Pelatihan vokasi terdepan di Depok. Membantu peningkatan kompetensi kerja dan literasi digital dengan materi bertahap berstandar industri.
            </p>
            <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
              <MapPin size={15} className="text-[#843bab]" />
              <span>Kota Depok, Jawa Barat</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Katalog Kursus
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li>
                <Link href="/kursus?kategori=Perkantoran" className="hover:text-[#843bab] transition-colors font-medium">
                  Perkantoran (Excel &amp; Word)
                </Link>
              </li>
              <li>
                <Link href="/kursus?kategori=Desain" className="hover:text-[#843bab] transition-colors font-medium">
                  Desain (Canva &amp; Foto Produk)
                </Link>
              </li>
              <li>
                <Link href="/kursus?kategori=Bahasa" className="hover:text-[#843bab] transition-colors font-medium">
                  Bahasa (Inggris Kerja)
                </Link>
              </li>
              <li>
                <Link href="/kursus?kategori=Keuangan" className="hover:text-[#843bab] transition-colors font-medium">
                  Keuangan (Pembukuan UMKM)
                </Link>
              </li>
              <li>
                <Link href="/kursus?kategori=Pengembangan%20Diri" className="hover:text-[#843bab] transition-colors font-medium">
                  Pengembangan Diri (Public Speaking)
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Kepercayaan &amp; Legalitas
            </h4>
            <div className="bg-white/90 p-4 rounded-2xl border border-[#843bab]/20 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                <ShieldCheck size={16} />
                <span>Terverifikasi &amp; Bersertifikat</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Sertifikat kelulusan resmi bertanda tangan digital dapat diakses secara eksklusif oleh peserta di menu Kursus Saya setelah menyelesaikan seluruh materi.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[#843bab]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            © {new Date().getFullYear()} Lembaga Kursus Pijar Aksara. Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-[#843bab] cursor-pointer transition-colors">Syarat &amp; Ketentuan</span>
            <span className="hover:text-[#843bab] cursor-pointer transition-colors">Kebijakan Privasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
