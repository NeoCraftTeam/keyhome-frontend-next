export const APP_NAME = 'KeyHome';
export const APP_DESCRIPTION = 'Votre patrimoine immobilier en poche';
export const CURRENCY = 'XAF';
export const CURRENCY_SYMBOL = 'FCFA';

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const DEFAULT_CENTER: [number, number] = [3.848, 11.5021]; // Yaoundé
export const DEFAULT_ZOOM = 12;

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) {
    return 'Prix non défini';
  }
  // Use fr-FR locale (gives narrow no-break spaces) then normalise to regular spaces
  return `${new Intl.NumberFormat('fr-FR').format(price).replace(/\u202f/g, '\u00a0')} ${CURRENCY_SYMBOL}`;
}

/**
 * Format compact pour les cartes d'annonces.
 *
 * **Décision produit (mai 2026)** : on n'utilise plus les abréviations
 * `k`/`M` (ex. « 230k FCFA »). On affiche le montant complet avec
 * séparateurs de milliers — `230\u00a0000\u00a0FCFA` — pour un rendu
 * professionnel cohérent avec les fiches détaillées et la modale paiement.
 *
 * Conservée pour compatibilité avec les call-sites existants ; délègue à
 * `formatPrice()` qui produit le format canonique.
 */
export function formatPriceCompact(price: number | null): string {
  if (price === null || price === undefined) {
    return 'Prix N/D';
  }
  return formatPrice(price);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  if (diffDays === 1) {
    return 'Hier';
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  return formatDate(dateStr);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trimEnd() + '…';
}
