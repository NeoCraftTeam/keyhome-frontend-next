import type { Ad } from '@/types';
import { formatPrice } from '@/lib/constants';

export const SEARCH_GUIDANCE_PRICE_CEILING = 5_000_000;
export const SEARCH_GUIDANCE_TOO_MANY_TOTAL = 100;
export const SEARCH_GUIDANCE_REFINE_MAX_ACTIVE_FILTERS = 3;
export const SEARCH_GUIDANCE_TOP_SUMMARY_COUNT = 4;

export type RelaxActionId =
  | 'clear_quarter'
  | 'bedrooms_minus_one'
  | 'raise_price_cap'
  | 'clear_surface_floor'
  | 'clear_type'
  | 'remove_furnished'
  | 'clear_bathrooms'
  | 'clear_parking'
  | 'clear_3d'
  | 'clear_verified';

export interface RelaxSuggestion {
  id: RelaxActionId;
  label: string;
}

export interface SearchFilterSnapshot {
  selectedQuarter: string;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  priceRange: [number, number];
  surfaceRange: [number, number];
  typeName: string | null;
  selectedAmenities: string[];
  hasParking: boolean;
  has3dTour: boolean;
  isVerified: boolean;
  transactionType: 'location' | 'vente' | null;
  cityName: string | null;
}

/**
 * Ordered relaxations for zero-result searches (rule-based, no LLM).
 */
export function computeRaisedPriceMax(priceMax: number): number | null {
  if (priceMax <= 0 || priceMax >= SEARCH_GUIDANCE_PRICE_CEILING) {
    return null;
  }
  const bump = Math.min(
    SEARCH_GUIDANCE_PRICE_CEILING,
    Math.max(Math.ceil(priceMax * 1.25), priceMax + 50_000)
  );
  return bump > priceMax ? bump : null;
}

export function getRelaxSuggestions(
  s: SearchFilterSnapshot
): RelaxSuggestion[] {
  const out: RelaxSuggestion[] = [];

  if (s.selectedQuarter.trim().length > 0) {
    out.push({
      id: 'clear_quarter',
      label: 'Élargir à toute la ville',
    });
  }

  if (s.bedrooms !== undefined && s.bedrooms >= 1) {
    out.push({
      id: 'bedrooms_minus_one',
      label:
        s.bedrooms <= 1
          ? 'Retirer le filtre chambres'
          : `Passer à ${s.bedrooms - 1} chambre${s.bedrooms - 1 > 1 ? 's' : ''} min.`,
    });
  }

  const [, priceMax] = s.priceRange;
  const raised = computeRaisedPriceMax(priceMax);
  if (raised !== null) {
    out.push({
      id: 'raise_price_cap',
      label: `Monter le budget à ${formatPrice(raised)}`,
    });
  }

  const [surfaceMin] = s.surfaceRange;
  if (surfaceMin > 0) {
    out.push({
      id: 'clear_surface_floor',
      label: 'Retirer la surface minimum',
    });
  }

  if (s.typeName) {
    out.push({
      id: 'clear_type',
      label: 'Élargir le type de bien',
    });
  }

  if (s.selectedAmenities.includes('furnished')) {
    out.push({
      id: 'remove_furnished',
      label: 'Inclure les biens non meublés',
    });
  }

  if (s.bathrooms !== undefined) {
    out.push({
      id: 'clear_bathrooms',
      label: 'Retirer le filtre salles de bain',
    });
  }

  if (s.hasParking) {
    out.push({
      id: 'clear_parking',
      label: 'Ne pas exiger un parking',
    });
  }

  if (s.has3dTour) {
    out.push({
      id: 'clear_3d',
      label: 'Retirer la visite 360° obligatoire',
    });
  }

  if (s.isVerified) {
    out.push({
      id: 'clear_verified',
      label: 'Retirer « annonces vérifiées »',
    });
  }

  return out.slice(0, 5);
}

function bedroomsPhrase(bedrooms: number | undefined): string | null {
  if (bedrooms === undefined || bedrooms < 1) {
    return null;
  }
  return `${bedrooms} chambre${bedrooms > 1 ? 's' : ''} minimum`;
}

function transactionBudgetPhrase(
  transactionType: 'location' | 'vente' | null,
  priceMax: number
): string {
  if (transactionType === 'vente') {
    return `prix max. ${formatPrice(priceMax)}`;
  }
  if (transactionType === 'location') {
    return `loyer max. ${formatPrice(priceMax)}`;
  }
  return `budget max. ${formatPrice(priceMax)}`;
}

/**
 * Pedagogical empty-state copy built only from active filters (no invented listing data).
 */
export function buildEmptySearchCopilotMessage(
  s: SearchFilterSnapshot
): string {
  const city = s.cityName?.trim() || null;
  const parts: string[] = [];

  const br = bedroomsPhrase(s.bedrooms);
  if (br) {
    parts.push(br);
  }

  const [, priceMax] = s.priceRange;
  if (priceMax > 0 && priceMax < SEARCH_GUIDANCE_PRICE_CEILING) {
    parts.push(transactionBudgetPhrase(s.transactionType, priceMax));
  }

  if (s.typeName) {
    parts.push(s.typeName);
  }

  if (s.selectedQuarter.trim()) {
    parts.push(`quartier « ${s.selectedQuarter.trim()} »`);
  }

  const criteria = parts.length > 0 ? parts.join(', ') : 'ces critères';
  const where = city ? ` à ${city}` : '';

  return `Aucun bien ne correspond exactement à ${criteria}${where}. Tu peux assouplir un filtre ci-dessous, élargir la zone ou créer une alerte.`;
}

export function shouldSuggestRefine(
  total: number,
  activeFilterCount: number
): boolean {
  return (
    total >= SEARCH_GUIDANCE_TOO_MANY_TOTAL &&
    activeFilterCount <= SEARCH_GUIDANCE_REFINE_MAX_ACTIVE_FILTERS
  );
}

export interface AdSummaryLine {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  /** From API `adresse` only — omitted when empty */
  address?: string;
  /** First listing image from API when present */
  thumbUrl?: string;
}

/**
 * Top N ads for guided summary — data comes from API ordering only (first N of list).
 */
export function pickTopAdsForSummary(
  ads: Ad[],
  n: number = SEARCH_GUIDANCE_TOP_SUMMARY_COUNT
): AdSummaryLine[] {
  return ads.slice(0, n).map((ad) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title.trim() || 'Annonce',
    priceLabel: formatPrice(ad.price ?? null),
    address: ad.adresse?.trim() || undefined,
    thumbUrl: ad.images?.[0]?.thumb || ad.images?.[0]?.url || undefined,
  }));
}
