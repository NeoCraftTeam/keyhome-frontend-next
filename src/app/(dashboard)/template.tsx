'use client';

import { motion } from 'framer-motion';

/**
 * Dashboard page transition wrapper.
 * Next.js re-mounts template.tsx on every navigation, triggering the enter animation.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
