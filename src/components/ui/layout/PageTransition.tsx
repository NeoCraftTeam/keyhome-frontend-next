'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

const boxStyle = {
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column' as const,
};

/** Préfixes de routes chat rendues statiques (aucun fondu, sous-arbre persistant). */
const CHAT_PREFIXES = ['/messages', '/owner/messages'];

function isChatRoute(pathname: string): boolean {
  return CHAT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Wraps page content in a subtle fade+rise animation on route change.
 * Respects prefers-reduced-motion for accessibility.
 *
 * Les routes chat (`/messages`, `/owner/messages`) sont rendues **statiques**
 * (sans `motion.div`) : le shell de conversation doit persister d'un segment à
 * l'autre, façon WhatsApp Web — aucun fondu, aucun remontage. Les autres routes
 * montent un `motion.div` **keyé par le pathname** → remontage à chaque
 * navigation, rejouant le fondu (comportement de l'ancien `template.tsx`, désormais
 * supprimé pour ne pas remonter tout le sous-arbre du chat).
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname() ?? '';
  const shouldReduceMotion = useReducedMotion();

  if (isChatRoute(pathname)) {
    return <div style={boxStyle}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }
      style={boxStyle}
    >
      {children}
    </motion.div>
  );
}
