import { describe, expect, it } from 'vitest';

import {
  AdTypeCategory,
  getAdFormSteps,
  type AdFormStepKey,
} from '@/components/owner/ad-form/ad-type-categories';

const keysOf = (category: AdTypeCategory | null): AdFormStepKey[] =>
  getAdFormSteps(category).map((s) => s.key);

describe('getAdFormSteps', () => {
  it('omits the equipment step for terrain (no amenities, no lease)', () => {
    const keys = keysOf(AdTypeCategory.TERRAIN);

    expect(keys).not.toContain('equipment');
    expect(keys).toEqual(['type', 'infos', 'details', 'media', 'review']);
  });

  it('keeps the equipment step for residential', () => {
    const keys = keysOf(AdTypeCategory.RESIDENTIAL);

    expect(keys).toContain('equipment');
    expect(keys).toEqual([
      'type',
      'infos',
      'details',
      'equipment',
      'media',
      'review',
    ]);
  });

  it('keeps the equipment step for commercial (only bedrooms/bathrooms hidden)', () => {
    expect(keysOf(AdTypeCategory.COMMERCIAL)).toContain('equipment');
  });

  it('keeps the equipment step when no category is selected yet', () => {
    expect(keysOf(null)).toContain('equipment');
    expect(keysOf(null)).toHaveLength(6);
  });

  it('always keeps the same relative order, with equipment before media', () => {
    for (const category of [
      null,
      AdTypeCategory.RESIDENTIAL,
      AdTypeCategory.TERRAIN,
      AdTypeCategory.COMMERCIAL,
    ] as const) {
      const keys = keysOf(category);
      expect(keys[0]).toBe('type');
      expect(keys[keys.length - 1]).toBe('review');
      if (keys.includes('equipment')) {
        expect(keys.indexOf('equipment')).toBeLessThan(keys.indexOf('media'));
      }
    }
  });
});
