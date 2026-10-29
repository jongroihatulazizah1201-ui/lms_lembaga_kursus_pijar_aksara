'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string; // e.g. "pengguna", "pendaftaran", "data"
}

export default function AdminPagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  className = '',
  itemLabel = 'data',
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`px-4 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Keterangan Rentang Data */}
      <div className="text-slate-500 font-medium text-center sm:text-left">
        Menampilkan{' '}
        <span className="font-bold text-slate-800">{startItem}</span>
        {' - '}
        <span className="font-bold text-slate-800">{endItem}</span>
        {' dari '}
        <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}
        {totalPages > 1 && (
          <span className="text-slate-400 ml-1.5 hidden sm:inline">
            (Halaman {currentPage} dari {totalPages})
          </span>
        )}
      </div>

      {/* Kontrol Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Nomor-nomor Halaman */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold"
                  >
                    …
                  </span>
                );
              }

              const pageNum = Number(page);
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-[#843bab] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Tombol Selanjutnya */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Halaman Selanjutnya"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

