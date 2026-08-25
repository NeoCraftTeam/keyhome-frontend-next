'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

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

  // Safety net: if the viewport-rooted observer never reports the element in
  // view (a short element parked at a viewport edge, or one nested inside an
  // overflow container the observer can't see), reveal it anyway after a beat
  // so content is never permanently stuck at opacity:0. Guarded to `once`
  // reveals — a re-triggering (`once={false}`) reveal intentionally re-hides.
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    if (!once || isInView) {
      return;
    }
    const id = window.setTimeout(() => setForceVisible(true), 1200);

    return () => window.clearTimeout(id);
  }, [once, isInView]);

  const revealed = isInView || forceVisible;

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? false : { opacity: 0, y: yOffset }}
      animate={
        revealed
          ? { opacity: 1, y: 0 }
          : shouldReduce
            ? {}
            : { opacity: 0, y: yOffset }
      }
      transition={
        shouldReduce
          ? { duration: 0 }
          : {
              duration: 0.55,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
