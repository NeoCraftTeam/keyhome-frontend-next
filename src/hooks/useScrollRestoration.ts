'use client';

import { useEffect, useRef } from 'react';

const KEY = (route: string) => `kh:scroll:${route}`;
const TTL = 30 * 60 * 1000; // 30 min — reset après inactivité (NN/G 2025)

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

  // Désactive la restauration native du navigateur / Next.js pour que notre
  // logique soit la seule à gérer la position de scroll.
  useEffect(() => {
    if (typeof history !== 'undefined') {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Restaure la position dès que les données sont prêtes
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
      // Double-rAF : le premier frame engage le layout React, le second
      // garantit que la peinture est terminée avant le scroll.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: 'instant' });
        });
      });
    } catch {
      // sessionStorage peut être bloqué (mode privé strict) — ignorer
    }
  }, [isReady, route]);

  // Sauvegarde la position au démontage (navigation vers une fiche)
  useEffect(() => {
    return () => {
      try {
        sessionStorage.setItem(
          KEY(route),
          JSON.stringify({ y: window.scrollY, ts: Date.now() })
        );
      } catch {
        // ignore
      }
    };
  }, [route]);
}
