'use client';

import React from 'react';
import { LogOut, X } from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({ isOpen, onClose, userName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      {/* Click outside to cancel */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-2xl z-10 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
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
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
            >
              Ya, Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
