import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Le pied de page de la landing est la seule surface publique qui liste
 * l'intégralité des routes ouvertes : un lien mort y est visible par tous
 * les visiteurs et par les crawlers. Ces tests verrouillent trois choses :
 *
 *  1. les rubriques retirées (annuaires de villes, badges de stores) ne
 *     reviennent pas — aucune application mobile n'est publiée ;
 *  2. chaque lien pointe une route réellement servie et publique (rien
 *     derrière le garde `PRIVATE_PATHS` du layout `(dashboard)`) ;
 *  3. les garanties affichées correspondent à des capacités livrées.
 */

// jsdom n'embarque pas IntersectionObserver, dont framer-motion a besoin
// pour ses déclencheurs `whileInView`.
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

import LandingFooter from '@/components/landing/LandingFooter';

/** Routes publiques vérifiées dans `src/app/**` au moment de l'écriture. */
const PUBLIC_HREFS = [
  '/search',
  '/nearby',
  '/comparaison',
  '/prix-marche',
  '/indices-loyers',
  '/owner/login',
  '/owner/register',
  '/blog',
  '/aide',
  '/login',
  '/register',
  '/contact',
  '/conditions',
  '/confidentialite',
];

/** Ancres réellement rendues par les sections de la landing. */
const SECTION_ANCHORS = [
  '#pricing',
  '#landlords',
  '#how-it-works',
  '#faq',
  '#testimonials',
];

describe('LandingFooter — rubriques retirées', () => {
  // BUG CATCH: annoncer des applications mobiles absentes des stores enverrait
  // les visiteurs sur des fiches inexistantes.
  it("n'affiche aucun badge de store applicatif", () => {
    render(<LandingFooter />);

    expect(screen.queryByText(/google play/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/app store/i)).not.toBeInTheDocument();

    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.some((h) => h.includes('play.google.com'))).toBe(false);
    expect(hrefs.some((h) => h.includes('apps.apple.com'))).toBe(false);
  });

  // BUG CATCH: ces deux colonnes listaient des annuaires ville par ville dont
  // les routes n'existent pas — 404 visibles et indexées.
  it('ne rétablit pas les colonnes « Guides & villes » / « Villes populaires »', () => {
    render(<LandingFooter />);

    expect(screen.queryByText(/guides & villes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/villes populaires/i)).not.toBeInTheDocument();
  });
});

describe('LandingFooter — intégrité des liens', () => {
  it('rend les quatre colonnes de navigation', () => {
    render(<LandingFooter />);

    for (const title of [
      'Plateforme',
      'Propriétaires',
      'Ressources',
      'Compte & légal',
    ]) {
      expect(
        screen.getByRole('heading', { name: title, level: 2 })
      ).toBeInTheDocument();
    }
  });

  // BUG CATCH: un href pointant une route privée renverrait le visiteur
  // anonyme sur /login au lieu de la page annoncée.
  it('ne pointe que des routes publiques ou des ancres de la page', () => {
    render(<LandingFooter />);

    const internal = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/') || h.startsWith('#'));

    expect(internal.length).toBeGreaterThan(0);

    for (const href of internal) {
      const [path] = href.split('#');
      const allowed = href.startsWith('#')
        ? SECTION_ANCHORS.includes(href)
        : PUBLIC_HREFS.includes(path) || path === '/';
      expect(allowed, `href inattendu dans le footer : ${href}`).toBe(true);
    }
  });

  it('expose les canaux de contact direct', () => {
    render(<LandingFooter />);

    expect(
      screen.getByRole('link', { name: /contact@keyhome\.app/i })
    ).toHaveAttribute('href', 'mailto:contact@keyhome.app');
    expect(
      screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href')
    ).toMatch(/^https:\/\/wa\.me\//);
  });

  // BUG CATCH: un lien externe sans rel="noopener" laisse la page ouverte à
  // window.opener depuis l'onglet cible.
  it('protège chaque lien ouvert dans un nouvel onglet', () => {
    render(<LandingFooter />);

    const external = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('target') === '_blank');

    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });
});

describe('LandingFooter — réseaux sociaux', () => {
  /** Les quatre comptes réellement tenus par la marque. */
  const NETWORKS = [
    { name: /facebook/i, host: 'facebook.com' },
    { name: /instagram/i, host: 'instagram.com' },
    { name: /twitter/i, host: 'x.com' },
    { name: /tiktok/i, host: 'tiktok.com' },
  ];

  // BUG CATCH: la rangée avait perdu TikTok et le compte X n'était annoncé que
  // « X » — une lettre seule, que ni un lecteur d'écran ni un œil ne relie à
  // Twitter. Un pied de page sans réseaux coupe le seul lien entre la landing
  // et l'audience déjà acquise.
  it('expose les quatre réseaux de la marque', () => {
    render(<LandingFooter />);

    for (const { name, host } of NETWORKS) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('href')).toContain(host);
    }
  });

  // BUG CATCH: un `<path>` sans conteneur dimensionné ne peint rien — les
  // icônes étaient dans le DOM sans être visibles.
  it('peint un glyphe dimensionné dans chaque pastille', () => {
    const { container } = render(<LandingFooter />);

    const tiles = container.querySelectorAll('.footer-social');
    expect(tiles).toHaveLength(NETWORKS.length);

    for (const tile of tiles) {
      const svg = tile.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('fill')).toBe('currentColor');
      expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
      expect(
        svg?.querySelector('path')?.getAttribute('d')?.length ?? 0
      ).toBeGreaterThan(20);
    }
  });
});

describe('LandingFooter — bandeau de garanties', () => {
  it('affiche les quatre garanties produit', () => {
    render(<LandingFooter />);

    for (const title of [
      'Annonces vérifiées',
      'Paiements sécurisés',
      'Visites planifiées',
      'Baux signés en ligne',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('rappelle la mention légale et le crédit de réalisation', () => {
    const { container } = render(<LandingFooter />);

    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} KeyHome`))
    ).toBeInTheDocument();

    const credit = container.querySelector('.footer-credit');
    expect(credit).not.toBeNull();
    expect(
      within(credit as HTMLElement).getByText(/NeoCraftTeam/)
    ).toBeTruthy();
  });
});
