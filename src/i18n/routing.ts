/**
 * Locale configuration — single source of truth for supported languages.
 *
 * When adding a new locale:
 *   1. Add the code below (e.g. 'en') to `LOCALES`
 *   2. Create `messages/{code}.json` (start by copying fr.json)
 *   3. Add a friendly display name to `LOCALE_LABELS` if you build a switcher
 *   4. URL prefix routing (e.g. /en/immobilier/douala) requires moving
 *      app/* under app/[locale]/* and is not yet set up — do that as a
 *      separate refactor.
 */

export const LOCALES = ['fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Hreflang variants advertised in `<link rel="alternate">` tags.
 *
 * Even though the site is currently fr-only, we advertise regional French
 * variants so Google geo-routes users in different francophone markets to
 * the correct surface. When non-French locales ship, expand this map.
 *
 * The `x-default` entry is required by Google when multiple variants exist
 * — it's the fallback for languages/regions not explicitly listed.
 */
export const HREFLANG_VARIANTS = {
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
  'fr-CM': 'fr',
  'fr-CI': 'fr',
  'fr-SN': 'fr',
  'fr-BJ': 'fr',
  'fr-TG': 'fr',
  'fr-ML': 'fr',
  'x-default': 'fr',
} as const satisfies Record<string, Locale>;

/**
 * Returns a `Metadata.alternates.languages` map for a given path.
 * All variants point to the same URL today (no per-locale paths exist).
 *
 * When per-locale URLs ship, this helper should map each hreflang to its
 * locale-prefixed URL — e.g. `'fr-CA': '/fr/immobilier/montreal'`.
 */
export function buildHreflangAlternates(
  urlForPath: string
): Record<string, string> {
  const entries = Object.keys(HREFLANG_VARIANTS).map((variant) => [
    variant,
    urlForPath,
  ]);
  return Object.fromEntries(entries);
}
