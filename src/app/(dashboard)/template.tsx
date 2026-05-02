'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Dashboard page transition wrapper.
 * Next.js re-mounts template.tsx on every navigation, triggering the enter animation.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
