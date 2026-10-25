'use client';

import React from 'react';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { AlertCircle, RefreshCw } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'accent' | 'white' | 'slate';

export interface LoadingSpinnerProps {
  /** Size scale of the spinner */
  size?: SpinnerSize;
  /** Color theme aligned with Pijar Aksara tokens */
  variant?: SpinnerVariant;
  /** Optional caption or subtext displayed below or next to the spinner */
  label?: string;
  /** Secondary helper text for longer operations */
  sublabel?: string;
  /** Whether to render as an overlay centered within the parent element (parent must be relative) */
  overlay?: boolean;
  /** Whether to render as a full-screen fixed viewport overlay */
  fullScreen?: boolean;
  /** Additional custom classNames for the outer container */
  className?: string;
  /**
   * Debounce delay before appearing (ms).
   * 0 = immediate (good for buttons), 200 = recommended for page/section loads to eliminate sub-200ms flash.
   */
  delayMs?: number;
  /**
   * Maximum duration (ms) before showing a safety timeout prompt to avoid indefinite spins.
   * Default: 15000 (15 seconds). Set to 0 to disable.
   */
  timeoutMs?: number;
  /** Action called when timeout retry button is clicked */
  onRetry?: () => void;
  /** Action called when timeout cancel button is clicked */
  onCancel?: () => void;
  /** Direct active state if controlling visibility externally (defaults to true) */
  active?: boolean;
}

const SIZE_CONFIGS: Record<SpinnerSize, { box: string; ring: string; stroke: string; dot: string }> = {
  xs: { box: 'w-4 h-4', ring: 'border-[2px]', stroke: 'w-4 h-4', dot: 'w-1 h-1' },
  sm: { box: 'w-5 h-5', ring: 'border-[2.5px]', stroke: 'w-5 h-5', dot: 'w-1.5 h-1.5' },
  md: { box: 'w-7 h-7', ring: 'border-[3px]', stroke: 'w-7 h-7', dot: 'w-2 h-2' },
  lg: { box: 'w-10 h-10', ring: 'border-[3.5px]', stroke: 'w-10 h-10', dot: 'w-2.5 h-2.5' },
  xl: { box: 'w-14 h-14', ring: 'border-[4px]', stroke: 'w-14 h-14', dot: 'w-3.5 h-3.5' },
};

const VARIANT_CONFIGS: Record<
  SpinnerVariant,
  { track: string; activeArc: string; accentDot: string; text: string; subtext: string }
> = {
  // Brand Primary: Pijar Aksara Purple (#843bab) with soft purple track (#f6edfb)
  primary: {
    track: 'border-[#843bab]/15',
    activeArc: 'border-t-[#843bab] border-r-[#843bab]',
    accentDot: 'bg-[#ffdf0f]', // Signature Yellow accent
    text: 'text-slate-900',
    subtext: 'text-slate-500',
  },
  // Brand Accent: Pijar Aksara Yellow (#ffdf0f) for dark/contrasting backgrounds
  accent: {
    track: 'border-yellow-200/40',
    activeArc: 'border-t-[#ffdf0f] border-r-[#ffdf0f]',
    accentDot: 'bg-[#843bab]',
    text: 'text-slate-900',
    subtext: 'text-slate-600',
  },
  // White: Translucent white for colored action buttons (e.g. Purple CTA buttons)
  white: {
    track: 'border-white/25',
    activeArc: 'border-t-white border-r-white',
    accentDot: 'bg-[#ffdf0f]',
    text: 'text-white',
    subtext: 'text-white/80',
  },
  // Slate: Neutral subtle loader for gray borders/panels
  slate: {
    track: 'border-slate-200',
    activeArc: 'border-t-slate-700 border-r-slate-700',
    accentDot: 'bg-[#843bab]',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
  },
};

export default function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  label,
  sublabel,
  overlay = false,
  fullScreen = false,
  className = '',
  delayMs = 0,
  timeoutMs = 15000,
  onRetry,
  onCancel,
  active = true,
}: LoadingSpinnerProps) {
  const { shouldRender, isVisible, isTimedOut, resetTimeout } = useDelayedLoading(active, {
    delayMs,
    timeoutMs,
  });

  if (!shouldRender) {
    return null;
  }

  const sizeCfg = SIZE_CONFIGS[size];
  const variantCfg = VARIANT_CONFIGS[variant];

  // Handle timeout fallback state to rule out indefinite spinning loops
  if (isTimedOut) {
    return (
      <div
        role="alert"
        className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-amber-200 shadow-sm transition-all duration-300 ${
          fullScreen ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur-sm' : overlay ? 'absolute inset-0 z-20 bg-white/95' : ''
        } ${className}`}
      >
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
          <AlertCircle size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Proses Membutuhkan Waktu Lebih Lama
        </h4>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Respon server belum diterima. Anda dapat mencoba memuat ulang atau membatalkan operasi ini.
        </p>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                resetTimeout();
                onRetry();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#843bab] text-white text-xs font-bold hover:bg-[#722f96] transition-colors shadow-xs"
            >
              <RefreshCw size={13} />
              <span>Coba Lagi</span>
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    );
  }

  // Core GPU-composited spinner element
  const spinnerElement = (
    <div
      className={`relative flex items-center justify-center ${sizeCfg.box} flex-shrink-0`}
      style={{
        // Zero-reflow GPU compositing
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {/* Background Track Arc (Static Low-Contrast Ring) */}
      <div
        className={`absolute inset-0 rounded-full ${sizeCfg.ring} ${variantCfg.track}`}
        aria-hidden="true"
      />
      {/* Active Rotating Arc (GPU accelerated 360deg rotation) */}
      <div
        className={`absolute inset-0 rounded-full ${sizeCfg.ring} border-transparent ${variantCfg.activeArc} animate-spin`}
        aria-hidden="true"
      />
      {/* Decorative Brand Accent Center Dot for large sizes */}
      {(size === 'lg' || size === 'xl') && (
        <div
          className={`absolute rounded-full ${sizeCfg.dot} ${variantCfg.accentDot} animate-pulse shadow-xs`}
          aria-hidden="true"
        />
      )}
    </div>
  );

  // If used inline (e.g. inside a button or small row)
  if (!overlay && !fullScreen && !label && !sublabel) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center justify-center transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${className}`}
      >
        {spinnerElement}
        <span className="sr-only">Memuat...</span>
      </span>
    );
  }

  // Wrapper for content with labels or overlay/fullscreen modes
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 ease-out select-none ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {spinnerElement}

      {(label || sublabel) && (
        <div className="space-y-0.5">
          {label && (
            <p className={`text-sm font-semibold tracking-tight ${variantCfg.text}`}>
              {label}
            </p>
          )}
          {sublabel && (
            <p className={`text-xs font-normal ${variantCfg.subtext}`}>
              {sublabel}
            </p>
          )}
        </div>
      )}
      <span className="sr-only">Memuat...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/85 backdrop-blur-xs transition-opacity duration-300 ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${className}`}
      >
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/85 backdrop-blur-xs rounded-[inherit] transition-opacity duration-300 ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {content}
    </div>
  );
}
