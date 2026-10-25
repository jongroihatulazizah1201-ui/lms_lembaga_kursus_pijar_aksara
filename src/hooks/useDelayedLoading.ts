'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseDelayedLoadingOptions {
  /**
   * Delay in milliseconds before showing the spinner.
   * If loading completes before this threshold, the spinner is never shown (prevents flash on fast loads).
   * Default: 200ms
   */
  delayMs?: number;
  /**
   * Minimum duration in milliseconds the spinner stays visible once shown.
   * Prevents micro-flickering if loading finishes right after delayMs.
   * Default: 350ms
   */
  minDisplayMs?: number;
  /**
   * Safety timeout in milliseconds before flagging a hang / indefinite loop.
   * Default: 15000ms (15 seconds)
   */
  timeoutMs?: number;
  /**
   * Optional callback when timeout is reached.
   */
  onTimeout?: () => void;
}

export interface DelayedLoadingState {
  /** Whether the loading UI component should be mounted in the DOM */
  shouldRender: boolean;
  /** Whether the component has full opacity (false = transitioning in or out) */
  isVisible: boolean;
  /** Whether the safety timeout has been exceeded */
  isTimedOut: boolean;
  /** Reset timeout state (e.g. if user clicks 'Retry') */
  resetTimeout: () => void;
}

/**
 * Hook to manage loading spinner appearance with:
 * 1. Debounced entry (no flicker on sub-200ms tasks)
 * 2. Minimum display duration to avoid micro-blinks
 * 3. Graceful exit fade transition coordination
 * 4. Loop safety timeout to catch orphaned async requests
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {}
): DelayedLoadingState {
  const {
    delayMs = 200,
    minDisplayMs = 350,
    timeoutMs = 15000,
    onTimeout,
  } = options;

  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  const shownTimestampRef = useRef<number | null>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
  }, []);

  const resetTimeout = useCallback(() => {
    setIsTimedOut(false);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (isLoading && timeoutMs > 0) {
      timeoutTimerRef.current = setTimeout(() => {
        setIsTimedOut(true);
        onTimeout?.();
      }, timeoutMs);
    }
  }, [isLoading, timeoutMs, onTimeout]);

  useEffect(() => {
    if (isLoading) {
      // Clear any pending fadeouts or exits
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
      setIsTimedOut(false);

      // Start safety timeout
      if (timeoutMs > 0) {
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = setTimeout(() => {
          setIsTimedOut(true);
          onTimeout?.();
        }, timeoutMs);
      }

      if (delayMs <= 0) {
        // Immediate display
        setShouldRender(true);
        shownTimestampRef.current = Date.now();
        // Trigger opacity transition next tick
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
      } else {
        // Debounced display: only show if loading exceeds delayMs
        delayTimerRef.current = setTimeout(() => {
          setShouldRender(true);
          shownTimestampRef.current = Date.now();
          requestAnimationFrame(() => setIsVisible(true));
        }, delayMs);
      }
    } else {
      // Loading finished
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

      if (!shouldRender) {
        // Spinner never reached DOM because loading finished before delayMs
        setIsVisible(false);
        shownTimestampRef.current = null;
        return;
      }

      // Calculate how long spinner was already shown
      const now = Date.now();
      const shownAt = shownTimestampRef.current || now;
      const elapsed = now - shownAt;
      const remainingMinTime = Math.max(0, minDisplayMs - elapsed);

      minDisplayTimerRef.current = setTimeout(() => {
        // Start fade out transition
        setIsVisible(false);

        // Wait for CSS exit fade animation (250ms) before unmounting
        fadeOutTimerRef.current = setTimeout(() => {
          setShouldRender(false);
          setIsTimedOut(false);
          shownTimestampRef.current = null;
        }, 250);
      }, remainingMinTime);
    }

    return () => {
      // Cleanup on unmount
      clearTimers();
    };
  }, [isLoading, delayMs, minDisplayMs, timeoutMs, onTimeout, shouldRender, clearTimers]);

  return {
    shouldRender,
    isVisible,
    isTimedOut,
    resetTimeout,
  };
}
