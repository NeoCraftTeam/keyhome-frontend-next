'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
      initial={shouldReduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
