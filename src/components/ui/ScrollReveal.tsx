'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  /** Delay in seconds before animation starts (useful for staggering siblings) */
  delay?: number;
  /** Y offset to animate from — default 24px */
  yOffset?: number;
  /** Re-trigger animation each time element enters viewport */
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps children in a scroll-linked fade + slide-up reveal.
 * Uses Framer Motion's useInView so it triggers when 15% of the element is visible.
 *
 * Usage:
 *   <ScrollReveal delay={0.1}><MyCard /></ScrollReveal>
 */
export default function ScrollReveal({
  children,
  delay = 0,
  yOffset = 24,
  once = true,
  className,
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.15 });
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? false : { opacity: 0, y: yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : (shouldReduce ? {} : { opacity: 0, y: yOffset })}
      transition={shouldReduce ? { duration: 0 } : {
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
