import { expect, test } from '@playwright/test';

/**
 * E2E: Landing page — the first thing unauthenticated users see.
 *
 * NOTE: In test environments without Clerk API keys, the landing page
 * may show an ErrorBoundary ("Quelque chose s'est mal passé").
 * These tests are designed to work in both scenarios.
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // BUG CATCH: The page must render something — not a blank white screen.
  // In production, this shows the full landing page. In test environments
  // without Clerk keys, at minimum the ErrorBoundary should render.
  test('renders without a blank screen or server error', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
    // Must not show a 500 server error
    expect(body).not.toContain('Internal Server Error');
  });

  // BUG CATCH: Page title must be set (SEO + user experience).
  test('has a proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Create Next App');
  });

  // BUG CATCH: The page should respond with 200, not 404 or 500.
  test('returns a 200 status code', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});
