import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getOrCreateCorrelationId } from '@/lib/request-correlation';

describe('getOrCreateCorrelationId', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('persists one uuid per tab session', () => {
    const a = getOrCreateCorrelationId();
    const b = getOrCreateCorrelationId();
    expect(a).toBe(b);
    expect(a).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });
});
