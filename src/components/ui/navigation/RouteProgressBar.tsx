'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { brand, brandAgent } from '@/theme/tokens';

/**
 * Slim top-of-page progress bar that fires on every route change.
 * Uses pathname + searchParams changes as the navigation signal.
 * Respects prefers-reduced-motion.
 */
export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rafRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current.clear();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    clearAllTimers();

    setProgress(0);
    setVisible(true);

    rafRef.current = requestAnimationFrame(() => {
      setProgress(20);
      safeTimeout(() => setProgress(55), 120);
      safeTimeout(() => setProgress(85), 600);
    });

    safeTimeout(() => {
      setProgress(100);
      safeTimeout(() => setVisible(false), 300);
    }, 350);

    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Context-aware: teal for owner panel, red for customer side.
  const isOwnerPath = pathname?.startsWith('/owner') ?? false;
  const color = isOwnerPath ? brandAgent.primary : brand.primary;
  const colorDark = isOwnerPath ? brandAgent.primaryDark : brand.primaryDark;

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            height: 3,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              width: '100%',
              transformOrigin: 'left center',
              background: `linear-gradient(90deg, ${color}, ${colorDark})`,
              borderRadius: '0 2px 2px 0',
              boxShadow: `0 0 8px ${color}80`,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
