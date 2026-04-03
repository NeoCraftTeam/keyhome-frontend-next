'use client';

import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number; // ms
  start?: number;
  decimals?: number;
  /** Only start counting when element is in view */
  triggerOnce?: boolean;
}

/**
 * Animates a number from `start` to `end` over `duration` ms.
 * Uses requestAnimationFrame for smooth easing (ease-out cubic).
 *
 * Usage:
 *   const { value, ref } = useCountUp({ end: 1250, duration: 1400 });
 *   <span ref={ref}>{value.toLocaleString()}</span>
 */
export function useCountUp({
  end,
  duration = 1200,
  start = 0,
  decimals = 0,
  triggerOnce = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // IntersectionObserver to start when visible
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          if (triggerOnce) observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted, triggerOnce]);

  useEffect(() => {
    if (!hasStarted) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(end);
      return;
    }

    const range = end - start;

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + range * eased;

      setValue(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
    };
  }, [hasStarted, end, start, duration, decimals]);

  return { value, ref };
}
