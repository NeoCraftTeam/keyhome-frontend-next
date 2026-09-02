import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Portée annoncée par la landing.
 *
 * KeyHome n'est pas un service africain : la recherche accepte n'importe quelle
 * ville du monde. Or une liste figée de six villes d'un même continent, posée
 * juste sous le champ de recherche, tient lieu de réponse à la question « est-ce
 * que ça marche chez moi ? » — et la réponse lue par un visiteur de Lisbonne ou
 * de Montréal est « non ». Le défaut n'est pas la présence des villes mais leur
 * position : sous le champ, elles se lisent comme le périmètre couvert.
 *
 * Ce que ces règles n'interdisent pas : les exemples tapés dans le champ
 * (`PLACEHOLDER_EXAMPLES`, `QUICK_SUGGESTIONS`). Un exemple montre la syntaxe
 * acceptée, il ne délimite rien.
 */

const src = (path: string): string =>
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../..', path),
    'utf8'
  );

/**
 * Source privée de ses commentaires : ce fichier-ci comme celui du hero
 * décrivent le motif retiré, et une règle qui interdit un motif ne doit pas se
 * déclencher sur son propre exposé.
 */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const hero = withoutComments(src('components/landing/HeroSection.tsx'));
const css = src('app/globals.css');

describe('landing — portée internationale', () => {
  // BUG CATCH: « Populaires : Douala · Garoua · Accra · Cotonou · Lomé ·
  // Bafoussam » sous la barre de recherche. Six villes, deux pays voisins, une
  // seule sous-région : le visiteur en déduit le périmètre du service.
  it("n'annonce aucune liste de villes sous la barre de recherche", () => {
    expect(hero, 'le hero réintroduit un libellé « Populaires »').not.toMatch(
      /Populaires/i
    );
    expect(hero, 'le hero réintroduit des puces de villes').not.toContain(
      'hero-city-chip'
    );
    expect(
      hero,
      'le hero réintroduit des liens de recherche par ville'
    ).not.toMatch(/\/search\?city=/);
  });

  // BUG CATCH: un sélecteur orphelin survit aux revues — la règle reste dans le
  // bundle CSS et le motif paraît encore soutenu par le design system.
  it('ne garde pas le style des puces retirées', () => {
    expect(css, 'globals.css garde .hero-city-chip').not.toContain(
      '.hero-city-chip'
    );
  });

  // Les exemples du champ, eux, restent : ils montrent ce qu'on peut taper.
  it('conserve les exemples de requêtes du champ', () => {
    expect(hero).toContain('PLACEHOLDER_EXAMPLES');
    expect(hero).toContain('QUICK_SUGGESTIONS');
  });
});
