import { describe, expect, it } from 'vitest';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_TITLE_WITH_TAGLINE,
} from '@/lib/brand';

describe('brand', () => {
  it('exports official tagline and composed title', () => {
    expect(BRAND_NAME).toBe('KeyHome');
    expect(BRAND_TAGLINE).toBe('Votre patrimoine immobilier en poche');
    expect(BRAND_TITLE_WITH_TAGLINE).toBe(
      'KeyHome — Votre patrimoine immobilier en poche'
    );
  });
});
