'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadBrosurKursusAction } from '@/app/instruktur/actions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function CourseBrochureUploader({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadBrosurKursusAction(formData);
    setUploading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.url) {
      onChange(res.url);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          Media Brosur / Pamflet Kursus
        </label>
        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
          Rasio 16:9 (1920x1080 px)
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Unggah media brosur promosi kursus. Resolusi standar adalah <strong>1920 x 1080 piksel</strong> (Format PNG, JPG, atau WebP, maks. 1MB). Gambar otomatis dioptimasi dan disimpan ke Supabase Storage.
      </p>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm aspect-video max-w-lg">
          <img
            src={value}
            alt="Preview Brosur Kursus"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold shadow-md hover:bg-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>Ganti Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>Hapus</span>
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Tersimpan di Storage</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
            disabled
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : 'border-slate-300 hover:border-[#843bab] bg-slate-50/60 hover:bg-purple-50/30 cursor-pointer'
          }`}
        >
          {uploading ? (
            <div className="py-2">
              <LoadingSpinner
                size="md"
                variant="primary"
                label="Mengoptimasi & Mengunggah ke Storage..."
                sublabel="Menyesuaikan ke resolusi 1920x1080 px"
                timeoutMs={25000}
                onCancel={() => setUploading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-[#843bab] flex items-center justify-center shadow-xs">
                <ImageIcon size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Klik untuk memilih file brosur kursus
                </p>
                <p className="text-[11px] text-slate-500">
                  Resolusi rekomendasi: <strong>1920 x 1080 piksel</strong> (16:9) &bull; PNG, JPG, WebP
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}
