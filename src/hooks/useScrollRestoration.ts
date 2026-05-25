'use client';

import { useEffect, useRef } from 'react';

const KEY = (route: string) => `kh:scroll:${route}`;
const TTL = 30 * 60 * 1000; // 30 min — reset après inactivité (NN/G 2025)

/**
 * Tente d'atteindre `targetY` en ré-essayant jusqu'à ce que le document soit
 * assez haut (contenu chargé progressivement, infinite scroll) ou que le
 * nombre max de tentatives soit atteint.
 */
function scrollToWithRetry(targetY: number, attempts = 12, intervalMs = 50) {
  if (targetY <= 0) return;
  const tryScroll = (remaining: number) => {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    if (remaining > 0 && Math.abs(window.scrollY - targetY) > 20) {
      setTimeout(() => tryScroll(remaining - 1), intervalMs);
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(() => tryScroll(attempts)));
}

/**
 * Sauvegarde et restaure la position de scroll pour les pages de listing
 * (feed annonces, pogo-sticking fix — NN/G juillet 2025).
 *
 * @param route   Clé unique pour cette page, ex. '/home'
 * @param isReady True une fois que les données sont rendues (évite de restaurer
 *                avant que le DOM soit peuplé par React Query)
 */
export function useScrollRestoration(route: string, isReady: boolean) {
  const restoredRef = useRef(false);

  // Désactive la restauration native du navigateur / Next.js afin que notre
  // logique soit la seule responsable du scroll.
  useEffect(() => {
    if (typeof history !== 'undefined') {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Sauvegarde continue (debounce 150 ms) dès que la page est prête.
  // Avantage par rapport au save-on-unmount : la position est capturée
  // AVANT que router.push() ne réinitialise window.scrollY à 0.
  useEffect(() => {
    if (!isReady) return;
    let timer: ReturnType<typeof setTimeout>;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const y = window.scrollY;
          if (y > 0) {
            sessionStorage.setItem(
              KEY(route),
              JSON.stringify({ y, ts: Date.now() })
            );
          }
        } catch {
          // mode privé strict — ignorer
        }
      }, 150);
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', save);
    };
  }, [route, isReady]);

  // Restaure la position dès que les données sont prêtes.
  // scrollToWithRetry réessaie si le document n'est pas encore assez haut
  // (infinite-scroll non encore chargé, layout en cours).
  useEffect(() => {
    if (!isReady || restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = sessionStorage.getItem(KEY(route));
      if (!raw) return;
      const { y, ts } = JSON.parse(raw) as { y: number; ts: number };
      if (Date.now() - ts > TTL) {
        sessionStorage.removeItem(KEY(route));
        return;
      }
      scrollToWithRetry(y);
    } catch {
      // sessionStorage peut être bloqué (mode privé strict) — ignorer
    }
  }, [isReady, route]);
}
