'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

interface PageTransitionLinkProps {
  href: string;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

// Global overlay state — shared between all PageTransitionLink instances on the page
let _setActive: ((v: boolean) => void) | null = null;
let _setTarget: ((href: string) => void) | null = null;

/**
 * Drop-in replacement for <Link> on the landing page.
 * Plays a full-screen crimson curtain wipe before navigating.
 */
export function PageTransitionLink({ href, children, style, className, onClick }: PageTransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    if (_setActive && _setTarget) {
      _setTarget(href);
      _setActive(true);
    } else {
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} style={style} className={className}>
      {children}
    </a>
  );
}

/**
 * Mount once inside LandingPage. Renders the animated overlay.
 */
export function PageTransitionOverlay() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [target, setTarget] = useState('');

  // Register global setters so PageTransitionLink can trigger this
  _setActive = setActive;
  _setTarget = setTarget;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* First wave: bottom-to-top fill */}
          <motion.div
            key="curtain-fill"
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={() => {
              if (target.startsWith('http')) {
                window.location.href = target;
              } else {
                router.push(target);
              }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, #F6475F 0%, #C0302A 100%)',
              zIndex: 9999,
              transformOrigin: 'bottom center',
            }}
          />

          {/* Logo + spinner centered on top of curtain */}
          <motion.div
            key="curtain-logo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-1px',
                }}
              >
                K
              </div>
            </motion.div>

            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.75,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
