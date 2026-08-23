import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou anti-zoom iOS Safari.
 *
 * iOS Safari agrandit (zoome) la page dès qu'on focus un champ dont la
 * `font-size` est < 16px. Le viewport garde volontairement le pinch-zoom
 * activé (accessibilité WCAG — cf. `src/app/layout.tsx`), donc la seule parade
 * correcte est de plancher la police des champs saisissables à ≥ 16px sur
 * mobile (et de garder la taille compacte à partir de `md`).
 *
 * Ces assertions verrouillent ce plancher sur les surfaces signalées — barre de
 * recherche du hero + saisie et recherches du chat — pour empêcher toute
 * régression vers un `text-sm` / `text-[14px]` / `0.9rem` nu sur mobile.
 */

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativeToSrc: string): string =>
  readFileSync(resolve(srcRoot, relativeToSrc), 'utf8');

describe('anti-zoom iOS — police des champs ≥ 16px sur mobile', () => {
  it('HeroSearch: la recherche hero est à 1rem (16px), pas 0.9rem, sur mobile', () => {
    const src = read('components/ads/HeroSearch.tsx');

    expect(src).toContain("fontSize: '1rem'");
    // L'ancienne valeur fautive (14,4px sur mobile) ne doit plus réapparaître.
    expect(src).not.toContain("xs: '0.9rem'");
  });

  it('MessageInput: le composeur est à 16px sur mobile (14px seulement en md+)', () => {
    const src = read('components/chat/MessageInput.tsx');

    expect(src).toContain('text-[16px] md:text-[14px]');
  });

  it('ConversationList: la recherche de la liste est à 16px sur mobile', () => {
    const src = read('components/chat/ConversationList.tsx');

    expect(src).toContain('text-base md:text-sm');
  });

  it('ChatWindow: la recherche in-conversation est à 16px sur mobile', () => {
    const src = read('components/chat/ChatWindow.tsx');

    expect(src).toContain('text-base md:text-sm');
  });
});
