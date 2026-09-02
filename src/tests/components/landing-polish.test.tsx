import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Invariants de finition de la landing.
 *
 * Ces assertions ne vérifient pas des pixels mais des promesses faites à
 * l'utilisateur, chacune cassée au moins une fois dans le code d'origine :
 *
 *  - un accordéon dont l'état n'est pas annoncé (`aria-expanded`) laisse un
 *    lecteur d'écran deviner si la réponse est ouverte ;
 *  - une carte qui se soulève au survol promet un clic — les témoignages n'en
 *    ont aucun, le soulèvement a donc été retiré, pas restylé ;
 *  - un panneau `role="dialog" aria-modal` sans sortie clavier enferme
 *    l'utilisateur ;
 *  - un lien qui appelle `preventDefault()` sans condition casse
 *    « ouvrir dans un nouvel onglet », geste courant sur un site d'annonces.
 */

// jsdom n'embarque pas IntersectionObserver, dont framer-motion a besoin pour
// ses déclencheurs `whileInView`.
class IOStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (
    globalThis as unknown as { IntersectionObserver: typeof IOStub }
  ).IntersectionObserver = IOStub;
}

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
}));

import FAQSection from '@/components/landing/FAQSection';
import LandingNav from '@/components/landing/LandingNav';
import { PageTransitionLink } from '@/components/landing/PageTransition';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

beforeAll(() => {
  // framer-motion interroge matchMedia pour `reducedMotion`.
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe('FAQSection — accordéon annoncé', () => {
  it('expose chaque question comme un bouton replié', () => {
    render(<FAQSection />);

    const triggers = screen.getAllByRole('button');
    expect(triggers.length).toBeGreaterThan(3);

    for (const trigger of triggers) {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    }
  });

  // BUG CATCH: sans `aria-expanded` piloté par l'état, un lecteur d'écran
  // annonce un bouton muet et l'utilisateur ne sait pas si la réponse est là.
  it('annonce l’ouverture et rattache la réponse à sa question', async () => {
    const user = userEvent.setup();
    render(<FAQSection />);

    const trigger = screen.getByRole('button', {
      name: /KeyHome est-il gratuit/i,
    });
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = screen.getByRole('region', {
      name: /KeyHome est-il gratuit/i,
    });
    expect(panel.id).toBe(trigger.getAttribute('aria-controls'));
    expect(panel).toHaveTextContent(/entièrement gratuites/i);
  });

  it('referme la réponse au second clic', async () => {
    const user = userEvent.setup();
    render(<FAQSection />);

    const trigger = screen.getByRole('button', {
      name: /système de crédits/i,
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('n’ouvre qu’une réponse à la fois', async () => {
    const user = userEvent.setup();
    render(<FAQSection />);

    const first = screen.getByRole('button', { name: /est-il gratuit/i });
    const second = screen.getByRole('button', { name: /annonces sont-elles/i });

    await user.click(first);
    await user.click(second);

    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('TestimonialsSection — pas d’affordance mensongère', () => {
  // BUG CATCH: les cartes se soulevaient au survol alors qu'elles ne sont ni
  // liens ni boutons. L'utilisateur cliquait, rien ne se passait.
  it('ne rend aucun élément cliquable dans les cartes', () => {
    render(<TestimonialsSection />);

    const cards = screen.getAllByRole('listitem');
    expect(cards.length).toBeGreaterThan(2);

    for (const card of cards) {
      expect(within(card).queryAllByRole('link')).toHaveLength(0);
      expect(within(card).queryAllByRole('button')).toHaveLength(0);
      expect(card.getAttribute('tabindex')).toBeNull();
    }
  });

  it('énonce la note moyenne en texte, pas seulement en étoiles', () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByRole('img', { name: /Note moyenne 4\.6 sur 5/i })
    ).toBeInTheDocument();
  });
});

describe('LandingNav — menu mobile', () => {
  it('annonce l’état du déclencheur', async () => {
    const user = userEvent.setup();
    render(<LandingNav />);

    const trigger = screen.getByRole('button', { name: /ouvrir le menu/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(
      screen.getByRole('button', { name: /fermer le menu/i })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // BUG CATCH: le panneau s'annonce `aria-modal="true"` et couvrait la page
  // sans aucune sortie clavier.
  it('se referme sur Échap', async () => {
    const user = userEvent.setup();
    render(<LandingNav />);

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    // L'état bascule sur la touche ; le panneau, lui, joue encore sa sortie —
    // c'est `AnimatePresence` qui le retire une fois le fondu terminé.
    expect(
      screen.getByRole('button', { name: /ouvrir le menu/i })
    ).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  // BUG CATCH: le survol était posé en JS (`onMouseEnter`/`onMouseLeave`) : sur
  // un écran tactile `mouseleave` n'arrive jamais et le dernier lien touché
  // restait allumé. Les états vivent donc en CSS, derrière
  // `@media (hover: hover)`.
  it('confie le survol des liens au CSS', () => {
    render(<LandingNav />);

    const links = screen
      .getAllByRole('link')
      .filter((a) => (a.getAttribute('href') ?? '').startsWith('#'));

    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      expect(link.className).toContain('landing-nav-link');
      // Aucune couleur figée en style inline : c'est la variable qui porte le
      // thème, la règle CSS qui porte l'état.
      expect(link.style.color).toBe('');
    }
  });
});

describe('PageTransitionLink — clics modifiés', () => {
  it('joue la transition sur un clic principal', async () => {
    const user = userEvent.setup();
    render(<PageTransitionLink href="/home">Visiter</PageTransitionLink>);

    await user.click(screen.getByRole('link', { name: 'Visiter' }));

    // Sans overlay monté, le lien retombe sur une navigation directe.
    expect(push).toHaveBeenCalledWith('/home');
  });

  // BUG CATCH: `preventDefault()` inconditionnel faisait jouer le rideau puis
  // n'ouvrait rien — ⌘-clic et clic molette étaient morts sur un site dont
  // l'usage même est d'ouvrir plusieurs annonces en parallèle.
  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
  ] as const)('laisse le navigateur gérer %s', (_label, init) => {
    render(<PageTransitionLink href="/home">Visiter</PageTransitionLink>);

    const link = screen.getByRole('link', { name: 'Visiter' });
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });

  it('laisse le navigateur gérer le clic molette', () => {
    render(<PageTransitionLink href="/home">Visiter</PageTransitionLink>);

    const link = screen.getByRole('link', { name: 'Visiter' });
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 1,
    });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
