import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fous du vocabulaire d'animation de la landing.
 *
 * La landing est la seule page vue par 100 % des visiteurs, y compris ceux qui
 * n'auront jamais de compte : son rythme est un argument commercial. Les règles
 * verrouillées ici ne sont pas cosmétiques, chacune corrige un défaut observé :
 *
 *  1. une seule courbe d'easing (dix copies locales avaient déjà divergé, si
 *     bien qu'une transition CSS et son animation framer-motion voisine
 *     n'arrivaient plus ensemble) ;
 *  2. jamais `ease-in` sur une entrée — la courbe retarde le mouvement au
 *     moment précis où l'œil regarde, et l'interface paraît lente à durée
 *     égale ;
 *  3. jamais d'apparition depuis `scale(0)` — rien, dans le monde réel,
 *     ne surgit d'un point sans dimension ;
 *  4. jamais `transition: all` en style inline — la propriété embarque
 *     `padding`/`border-width`, deux déclencheurs de relayout, et interdit de
 *     régler chaque propriété à son propre tempo ;
 *  5. une durée d'interaction sous 300 ms (le rideau plein écran de navigation
 *     est la seule exception admise).
 */

const landingDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../components/landing'
);

/** Composants de la landing, hors module de vocabulaire lui-même. */
const componentFiles = readdirSync(landingDir)
  .filter((f) => f.endsWith('.tsx'))
  .sort();

const sources = new Map<string, string>(
  componentFiles.map((f) => [f, readFileSync(resolve(landingDir, f), 'utf8')])
);

/** Fichiers qui animent réellement (les autres n'ont rien à respecter). */
const animatedSources = [...sources].filter(([, src]) =>
  src.includes('framer-motion')
);

/**
 * Source privée de ses commentaires : les blocs de documentation citent les
 * motifs qu'on vient de retirer (« un `delay: i * 0.1` figé »), et une règle
 * qui interdit un motif ne doit pas se déclencher sur son propre exposé.
 */
function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Fichiers dont une entrée est déclenchée par le défilement. */
const revealSources = animatedSources.filter(
  ([, src]) => src.includes('whileInView') || src.includes('REVEAL_HEADER')
);

describe('landing — vocabulaire d’animation partagé', () => {
  it('expose des composants animés à vérifier', () => {
    expect(componentFiles.length).toBeGreaterThan(5);
    expect(animatedSources.length).toBeGreaterThan(5);
  });

  // BUG CATCH: dix constantes `EASE` locales avaient déjà divergé ; corriger le
  // rythme obligeait à repasser dans chaque section et une seule oubliée suffit
  // à désynchroniser deux éléments côte à côte.
  it('ne redéclare jamais une courbe locale', () => {
    for (const [file, src] of animatedSources) {
      expect(src, `${file} redéclare une constante d'easing`).not.toMatch(
        /const\s+EASE(_[A-Z]+)?\s*=/
      );
      expect(
        src,
        `${file} recopie la courbe littérale au lieu de l'importer`
      ).not.toMatch(/\[\s*0\.22\s*,\s*1\s*,\s*0\.36\s*,\s*1\s*\]/);
    }
  });

  it('importe son easing depuis landing-motion', () => {
    for (const [file, src] of animatedSources) {
      if (!src.includes('ease:')) {
        continue;
      }
      expect(src, `${file} utilise un easing sans l'importer`).toMatch(
        /from '\.\/landing-motion'/
      );
    }
  });

  // BUG CATCH: `ease-in` démarre lent. À 200 ms elle *paraît* plus lente qu'une
  // `ease-out` de même durée, car elle retarde les premières frames.
  it("n'utilise jamais ease-in sur une entrée", () => {
    for (const [file, src] of animatedSources) {
      expect(src, `${file} anime en ease-in`).not.toMatch(
        /ease:\s*'easeIn'|ease:\s*"easeIn"/
      );
      expect(src, `${file} anime en ease-in (CSS inline)`).not.toMatch(
        /transition:[^;'"]*\bease-in\b(?!-out)/
      );
    }
  });

  // BUG CATCH: `scale: 0` fait jaillir l'élément de nulle part — un ballon
  // dégonflé garde une forme visible.
  it('n’apparaît jamais depuis scale(0)', () => {
    for (const [file, src] of animatedSources) {
      const scales = [...src.matchAll(/scale:\s*(0(?:\.\d+)?)\b/g)].map((m) =>
        Number(m[1])
      );
      for (const value of scales) {
        expect(
          value,
          `${file} anime depuis scale(${value}) — plancher à 0.9`
        ).toBeGreaterThanOrEqual(0.9);
      }
    }
  });

  // BUG CATCH: `transition: all` fait transiter padding et border-width, donc
  // relayout à chaque survol, et interdit un tempo par propriété.
  it('nomme chaque propriété transitionnée', () => {
    for (const [file, src] of animatedSources) {
      expect(src, `${file} utilise transition: all`).not.toMatch(
        /transition:\s*['"`]\s*all\b/
      );
    }
  });

  // BUG CATCH: au-delà de 300 ms une interaction d'interface se ressent comme
  // une latence. Seul le rideau plein écran de navigation (200–500 ms) y échappe.
  it('garde les durées d’interaction sous 300 ms', () => {
    for (const [file, src] of animatedSources) {
      if (file === 'PageTransition.tsx') {
        continue;
      }
      const presses = [
        ...src.matchAll(/whileTap[\s\S]{0,200}?duration:\s*([\d.]+)/g),
      ].map((m) => Number(m[1]));
      for (const value of presses) {
        expect(
          value,
          `${file} : retour de pression à ${value}s`
        ).toBeLessThanOrEqual(0.3);
      }
    }
  });
});

describe('landing — révélations au défilement', () => {
  it('expose des sections révélées à vérifier', () => {
    expect(revealSources.length).toBeGreaterThan(5);
  });

  // BUG CATCH: huit sections recopiaient le même déclencheur avec des valeurs
  // déjà divergentes (marges -80 / -60 / -40 px, durées 0,7 / 0,65 / 0,6 s) : en
  // descendant la page, le même geste ne se jouait pas deux fois au même rythme.
  it('ne fixe jamais son déclencheur en dur', () => {
    for (const [file, src] of revealSources) {
      expect(
        withoutComments(src),
        `${file} recopie un viewport au lieu d'utiliser REVEAL_VIEWPORT`
      ).not.toMatch(/viewport=\{\{/);
    }
  });

  // BUG CATCH: `delay: i * 0.1` sur un élément observé individuellement est une
  // dette de file d'attente — atteinte après les autres, la dernière carte
  // attendait encore son tour alors qu'elle était déjà lue. La cascade appartient
  // au conteneur, qui la déclenche quand la liste entre à l'écran.
  it('ne diffère jamais un élément déjà à l’écran', () => {
    for (const [file, src] of revealSources) {
      expect(
        withoutComments(src),
        `${file} garde un délai par index sur une entrée au défilement`
      ).not.toMatch(/delay:\s*\w+\s*\*/);
    }
  });
});

describe('landing-motion — contrat du module', () => {
  const src = readFileSync(resolve(landingDir, 'landing-motion.ts'), 'utf8');

  it('aligne EASE_OUT sur --ease-out de globals.css', () => {
    const css = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../app/globals.css'),
      'utf8'
    );

    // Même courbe des deux côtés : une transition CSS et une animation JS
    // voisines doivent arriver ensemble.
    expect(src).toContain('[0.22, 1, 0.36, 1]');
    expect(css).toContain('--ease-out: cubic-bezier(0.22, 1, 0.36, 1)');
  });

  // BUG CATCH: une sortie aussi longue que l'entrée fait attendre l'utilisateur
  // devant un élément qu'il vient de congédier.
  it('garde la sortie plus courte que l’entrée', () => {
    const enter = Number(/enter:\s*([\d.]+)/.exec(src)?.[1]);
    const exit = Number(/exit:\s*([\d.]+)/.exec(src)?.[1]);

    expect(enter).toBeGreaterThan(0);
    expect(exit).toBeLessThan(enter);
  });

  it('propose une pression atténuée pour les surfaces pleine largeur', () => {
    // 0.97 sur une ligne de 780 px la recule de plus de 20 px : le texte en
    // cours de lecture semble sauter.
    expect(src).toMatch(/PRESS\s*=\s*{\s*scale:\s*0\.97/);
    expect(src).toMatch(/PRESS_WIDE\s*=\s*{\s*scale:\s*0\.99/);
  });

  // Le raccourci d'en-tête doit rester un assemblage du vocabulaire, pas une
  // troisième source de vérité : sans quoi on aurait déplacé la divergence des
  // huit sections vers le module lui-même.
  it('compose REVEAL_HEADER depuis le vocabulaire existant', () => {
    const header = /REVEAL_HEADER[\s\S]*?\n};/.exec(src)?.[0] ?? '';

    expect(header).toContain('viewport: REVEAL_VIEWPORT');
    expect(header).toContain('DURATION.reveal');
    expect(header).toContain('EASE_OUT');
    expect(header).not.toMatch(/duration:\s*[\d.]+/);
    expect(header).not.toMatch(/margin:\s*'/);
  });
});
