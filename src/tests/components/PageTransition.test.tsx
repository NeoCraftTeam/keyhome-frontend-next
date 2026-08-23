import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';

/**
 * PageTransition doit :
 *  - rendre les routes chat (/messages, /owner/messages) SANS motion.div
 *    (statique → le sous-arbre persiste, aucun fondu à la navigation) ;
 *  - rendre les autres routes dans un motion.div NON keyé → le fondu ne joue
 *    qu'au premier montage et le conteneur persiste d'une navigation à l'autre
 *    (aucun remontage forcé → navigation instantanée).
 */

const pathnameHolder = vi.hoisted(() => ({ value: '/home' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameHolder.value,
}));

vi.mock('framer-motion', () => {
  // motion.div (et toute balise) → div marqué, en filtrant les props framer.
  // Le composant est mis en cache par balise pour garder une référence stable
  // (comme le vrai framer-motion) : sans ça, chaque accès à motion.div rend un
  // nouveau type de composant et React remonterait à tort le sous-arbre.
  function MotionMock({
    children,
    initial: _initial,
    animate: _animate,
    transition: _transition,
    exit: _exit,
    ...rest
  }: {
    children: React.ReactNode;
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    exit?: unknown;
  }) {
    return (
      <div data-motion="true" {...rest}>
        {children}
      </div>
    );
  }

  const cache: Record<string, typeof MotionMock> = {};

  return {
    useReducedMotion: () => false,
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          cache[prop] ??= MotionMock;
          return cache[prop];
        },
      }
    ),
  };
});

import PageTransition from '@/components/ui/layout/PageTransition';

let mountCount = 0;

function MountProbe() {
  useEffect(() => {
    mountCount += 1;
  }, []);
  return <span data-testid="probe">contenu</span>;
}

afterEach(() => {
  cleanup();
  pathnameHolder.value = '/home';
  mountCount = 0;
});

describe('PageTransition', () => {
  it('rend les routes chat visiteur sans motion.div', () => {
    pathnameHolder.value = '/messages';
    const { container, getByTestId } = render(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );

    expect(getByTestId('probe')).toBeInTheDocument();
    expect(container.querySelector('[data-motion="true"]')).toBeNull();
  });

  it('rend les routes chat owner sans motion.div', () => {
    pathnameHolder.value = '/owner/messages';
    const { container } = render(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );

    expect(container.querySelector('[data-motion="true"]')).toBeNull();
  });

  it('rend les routes hors chat dans un motion.div', () => {
    pathnameHolder.value = '/home';
    const { container } = render(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );

    expect(container.querySelector('[data-motion="true"]')).not.toBeNull();
  });

  it('ne remonte PAS les enfants en naviguant entre deux routes hors chat', () => {
    pathnameHolder.value = '/home';
    const { rerender } = render(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );
    expect(mountCount).toBe(1);

    pathnameHolder.value = '/search';
    rerender(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );

    // Plus de key={pathname} : le motion.div persiste, aucun remontage forcé →
    // navigation instantanée (le fondu ne joue qu'au premier montage).
    expect(mountCount).toBe(1);
  });

  it('conserve les enfants montés en naviguant dans le chat', () => {
    pathnameHolder.value = '/messages';
    const { rerender } = render(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );
    expect(mountCount).toBe(1);

    pathnameHolder.value = '/messages/abc-123';
    rerender(
      <PageTransition>
        <MountProbe />
      </PageTransition>
    );

    expect(mountCount).toBe(1);
  });
});
