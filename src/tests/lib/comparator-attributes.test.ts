import type { Ad } from '@/types';
import { AdStatus } from '@/types';
import {
  COMPARATOR_ATTRIBUTE_EXCLUDED_SLUGS,
  getComparatorAttributeSlugsForAds,
} from '@/lib/comparator-attributes';
import { describe, expect, it } from 'vitest';

const baseAd = {
  id: '1',
  title: 'Test',
  slug: 'test',
  description: '',
  adresse: '',
  price: 1,
  surface_area: 10,
  bedrooms: 1,
  bathrooms: 1,
  has_parking: false,
  location: null,
  status: AdStatus.AVAILABLE,
  expires_at: null,
  created_at: '',
  updated_at: '',
  user: null,
  agency: null,
  published_by: '',
  quarter: null,
  type: null,
  images: [],
} satisfies Ad;

describe('getComparatorAttributeSlugsForAds', () => {
  it('orders by allowlist and omits excluded slugs', () => {
    const ads: Ad[] = [
      {
        ...baseAd,
        id: 'a',
        attributes: [
          'wifi',
          'terrasse',
          'baignoire',
          'vinyl-tourne-disque',
          'refrigerateur',
        ],
      },
    ];

    const slugs = getComparatorAttributeSlugsForAds(ads);
    expect(slugs).toContain('terrasse');
    expect(slugs).toContain('wifi');
    expect(slugs.indexOf('terrasse')).toBeLessThan(slugs.indexOf('wifi'));
    expect(slugs).not.toContain('baignoire');
    expect(slugs).not.toContain('vinyl-tourne-disque');
    expect(slugs).not.toContain('refrigerateur');
  });

  it('matches attributes case-insensitively', () => {
    const ads: Ad[] = [{ ...baseAd, id: 'b', attributes: ['WIFI', 'Balcon'] }];
    const slugs = getComparatorAttributeSlugsForAds(ads);
    expect(slugs).toContain('wifi');
    expect(slugs).toContain('balcon');
  });

  it('excluded slugs set includes user-requested hospitality items', () => {
    expect(COMPARATOR_ATTRIBUTE_EXCLUDED_SLUGS.has('lave-linge')).toBe(true);
    expect(COMPARATOR_ATTRIBUTE_EXCLUDED_SLUGS.has('cuisine-equipee')).toBe(
      true
    );
  });
});
