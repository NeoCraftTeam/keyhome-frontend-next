export const APP_NAME = 'KeyHome';
export const APP_DESCRIPTION = 'Trouvez votre bien immobilier idéal';
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
 * Returns a compact price for listing cards.
 * 75 000 → "75k FCFA" | 1 500 000 → "1,5M FCFA" | 500 → "500 FCFA"
 */
export function formatPriceCompact(price: number | null): string {
  if (price === null || price === undefined) {
    return 'Prix N/D';
  }
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    const formatted = m % 1 === 0 ? `${m}` : m.toFixed(1).replace('.', ',');
    return `${formatted}M ${CURRENCY_SYMBOL}`;
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1_000)}k ${CURRENCY_SYMBOL}`;
  }
  return `${price} ${CURRENCY_SYMBOL}`;
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

/**
 * Returns the owner/landlord platform URL, always with an absolute protocol.
 * Prevents protocol-less env values (e.g. "owner.keyhome.test") from being
 * treated as relative paths by the browser.
 */
export function getOwnerUrl(): string {
  const raw = process.env.NEXT_PUBLIC_OWNER_URL || '';
  if (!raw) return '#';
  // Already absolute
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // Assume http for local/staging domains; production should use https
  return `http://${raw}`;
}
