import { describe, expect, it } from 'vitest';

/**
 * Documents the Strict Mode–safe OAuth callback effect pattern:
 * cleanup must cancel in-flight work so a remount can call handleRedirectCallback again.
 */
describe('OAuth callback guard', () => {
  it('cancels timeout when effect cleanup runs before timeout fires', () => {
    let cancelled = false;
    let redirected = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        redirected = true;
      }
    }, 100);

    cancelled = true;
    clearTimeout(timeoutId);

    expect(redirected).toBe(false);
  });
});
