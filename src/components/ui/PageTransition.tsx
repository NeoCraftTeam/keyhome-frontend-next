'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps page content in a subtle fade+rise animation on route change.
 * Respects prefers-reduced-motion for accessibility.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}
