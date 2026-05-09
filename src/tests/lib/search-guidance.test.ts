import { describe, expect, it } from 'vitest';
import {
  type RelaxActionId,
  SEARCH_GUIDANCE_PRICE_CEILING,
  buildEmptySearchCopilotMessage,
  computeRaisedPriceMax,
  getRelaxSuggestions,
  shouldSuggestRefine,
} from '@/lib/search-guidance';

const baseSnapshot = {
  selectedQuarter: '',
  bedrooms: undefined as number | undefined,
  bathrooms: undefined as number | undefined,
  priceRange: [0, SEARCH_GUIDANCE_PRICE_CEILING] as [number, number],
  surfaceRange: [0, 1000] as [number, number],
  typeName: null as string | null,
  selectedAmenities: [] as string[],
  hasParking: false,
  has3dTour: false,
  isVerified: false,
  transactionType: null as 'location' | 'vente' | null,
  cityName: 'Douala',
};

describe('search-guidance', () => {
  it('computeRaisedPriceMax bumps capped budgets', () => {
    expect(computeRaisedPriceMax(150_000)).toBe(200_000);
    expect(computeRaisedPriceMax(SEARCH_GUIDANCE_PRICE_CEILING)).toBeNull();
  });

  it('getRelaxSuggestions prioritises quarter and bedrooms', () => {
    const s = getRelaxSuggestions({
      ...baseSnapshot,
      selectedQuarter: 'Akwa',
      bedrooms: 3,
      priceRange: [0, 150_000],
      transactionType: 'location',
    });
    expect(s[0]?.id).toBe('clear_quarter');
    expect(s.map((x: { id: RelaxActionId }) => x.id)).toContain(
      'bedrooms_minus_one'
    );
    expect(s.map((x: { id: RelaxActionId }) => x.id)).toContain(
      'raise_price_cap'
    );
  });

  it('buildEmptySearchCopilotMessage reflects filters without hallucination', () => {
    const msg = buildEmptySearchCopilotMessage({
      ...baseSnapshot,
      bedrooms: 3,
      priceRange: [0, 150_000],
      transactionType: 'location',
      selectedQuarter: 'Akwa',
    });
    expect(msg).toContain('3 chambres minimum');
    expect(msg).toContain('loyer max.');
    expect(msg).toContain('Douala');
    expect(msg).toContain('Akwa');
  });

  it('shouldSuggestRefine when many results and few filters', () => {
    expect(shouldSuggestRefine(120, 2)).toBe(true);
    expect(shouldSuggestRefine(80, 2)).toBe(false);
    expect(shouldSuggestRefine(120, 5)).toBe(false);
  });
});
