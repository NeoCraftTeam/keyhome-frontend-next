import { describe, expect, it } from 'vitest';

import {
  adFormText,
  initialValues,
  normalizeAdFormValues,
} from '@/components/owner/ad-form/types';

describe('normalizeAdFormValues', () => {
  it('returns defaults when partial is empty', () => {
    expect(normalizeAdFormValues()).toEqual(initialValues);
  });

  it('coerces null API string fields to empty strings', () => {
    const normalized = normalizeAdFormValues({
      title: null as unknown as string,
      description: null as unknown as string,
      minimum_lease_duration: null as unknown as string,
      charges_autres: null as unknown as string,
    });

    expect(normalized.title).toBe('');
    expect(normalized.description).toBe('');
    expect(normalized.minimum_lease_duration).toBe('');
    expect(normalized.charges_autres).toBe('');
    expect(() => normalized.minimum_lease_duration.trim()).not.toThrow();
  });

  it('coerces null attributes to an empty array', () => {
    const normalized = normalizeAdFormValues({
      attributes: null as unknown as string[],
    });

    expect(normalized.attributes).toEqual([]);
    expect(() => normalized.attributes.map(String)).not.toThrow();
  });

  it('preserves valid user input', () => {
    const normalized = normalizeAdFormValues({
      title: 'Studio Bonanjo',
      price: '85000',
      price_period: 'jour',
      attributes: ['wifi'],
    });

    expect(normalized.title).toBe('Studio Bonanjo');
    expect(normalized.price).toBe('85000');
    expect(normalized.price_period).toBe('jour');
    expect(normalized.attributes).toEqual(['wifi']);
  });
});

describe('adFormText', () => {
  it('returns empty string for nullish values', () => {
    expect(adFormText(null)).toBe('');
    expect(adFormText(undefined)).toBe('');
    expect(adFormText('hello').trim()).toBe('hello');
  });
});
