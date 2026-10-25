'use client';

import React, { useTransition } from 'react';
import { LogOut, X } from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({ isOpen, onClose, userName }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      try {
        await logoutAction();
      } catch (err) {
        // Next.js redirect() throws a NEXT_REDIRECT error internally which is caught by framework.
        // If an unexpected error happens or network drops:
        console.error('Logout error:', err);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      {/* Click outside to cancel (disabled while isPending) */}
      <div
        className="fixed inset-0"
        onClick={!isPending ? onClose : undefined}
      />

      <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-2xl z-10 text-center overflow-hidden">
        {/* Loading Overlay when Logout is in progress */}
        {isPending && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center z-20 p-6 animate-fadeIn">
            <LoadingSpinner
              size="lg"
              variant="primary"
              label="Mengakhiri Sesi Akun..."
              sublabel="Menghapus sesi login dan mengarahkan ke halaman masuk"
              delayMs={0}
              timeoutMs={10000}
              onRetry={() => {
                window.location.href = '/login';
              }}
            />
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={!isPending ? onClose : undefined}
          disabled={isPending}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
          <LogOut size={26} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Konfirmasi Keluar Akun
        </h3>

        {/* Description / Reminder */}
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {userName ? (
            <>
              Halo <strong className="text-slate-800">{userName}</strong>, apakah Anda yakin ingin keluar dari akun?
            </>
          ) : (
            'Apakah Anda yakin ingin keluar dari akun?'
          )}
          <br />
          Sesi aktif Anda akan diakhiri. Anda dapat masuk kembali kapan saja dengan email dan kata sandi Anda.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={!isPending ? onClose : undefined}
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Batal
          </button>

          <form onSubmit={handleLogout} className="w-full">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <LoadingSpinner size="xs" variant="white" />
                  <span>Mengeluarkan...</span>
                </>
              ) : (
                'Ya, Keluar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
