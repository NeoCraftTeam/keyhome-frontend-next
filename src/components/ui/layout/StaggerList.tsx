'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface StaggerListProps {
  children: React.ReactNode[];
  /** Delay between each item (seconds) */
  stagger?: number;
  /** y-offset to animate from */
  yOffset?: number;
  /** Wrapper element class */
  className?: string;
  style?: React.CSSProperties;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Wraps a list of children in staggered fade+slide-up reveal.
 * Each direct child animates in sequence when the list enters view.
 *
 * Usage:
 *   <StaggerList style={{ display: 'grid', gridTemplateColumns: '...' }}>
 *     {items.map(i => <Card key={i.id} />)}
 *   </StaggerList>
 */
export default function StaggerList({
  children,
  stagger = 0.07,
  yOffset = 20,
  className,
  style,
}: StaggerListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const shouldReduce = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduce ? 0 : stagger,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: EASE },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={itemVariants} style={{ height: '100%' }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
