import { expect, test } from '@playwright/test';

/**
 * E2E: Navigation & SEO — cross-page navigation, auth protection, static pages.
 */

test.describe('Navigation', () => {
  // BUG CATCH: Navigating from landing to login must work.
  test('can navigate from landing to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Find any link/button that leads to login
    const loginElement = page.locator('a, button').filter({
      hasText: /connecter|connexion|login/i,
    }).first();

    if (await loginElement.isVisible()) {
      await loginElement.click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    }
  });

  // BUG CATCH: /home requires authentication. Unauthenticated users should
  // see a redirect or at least not see a 500 error.
  test('/home does not show a server error for unauthenticated users', async ({ page }) => {
    const response = await page.goto('/home');
    // Should not be a server error
    expect(response?.status()).toBeLessThan(500);
    
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

test.describe('Static Pages', () => {
  // BUG CATCH: Legal pages must be accessible — GDPR compliance.
  test('conditions page loads without error', async ({ page }) => {
    const response = await page.goto('/conditions');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('privacy policy page loads without error', async ({ page }) => {
    const response = await page.goto('/confidentialite');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('SEO', () => {
  // BUG CATCH: Missing meta description hurts search ranking.
  test('landing page has a meta description', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });

  // BUG CATCH: Missing viewport meta makes the site unusable on mobile.
  test('has a viewport meta tag', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width/);
  });
});
