import { expect, test } from '@playwright/test';

/**
 * PWA & Service Worker — End-to-End Tests
 *
 * These tests verify:
 *  1. The service worker registers and becomes active
 *  2. The app responds with a meaningful page when going offline (from cache)
 *  3. Uncached pages show the offline fallback
 *  4. The manifest is linked and parseable
 *  5. Critical PWA meta tags are present
 */

// These tests require a fully built app (next build && next start)
// Run them with: PLAYWRIGHT_SW=1 npm run test:e2e
const SW_ENABLED = !!process.env.PLAYWRIGHT_SW;

test.describe('PWA — Service Worker', () => {
  test.skip(
    !SW_ENABLED,
    'Skipped: set PLAYWRIGHT_SW=1 to run service-worker tests against a production build'
  );

  test('service worker registers and becomes active', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');

    const swActive = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return !!reg.active;
    });

    expect(swActive).toBe(true);
  });

  test('service worker scope is root (/)', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');

    const swScope = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return new URL(reg.scope).pathname;
    });

    expect(swScope).toBe('/');
  });

  test('service worker controls the current page', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');

    const isControlled = await page.evaluate(async () => {
      if (navigator.serviceWorker.controller) return true;
      await navigator.serviceWorker.ready;
      if (navigator.serviceWorker.controller) return true;
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true }
        );
        setTimeout(resolve, 3000);
      });
      return !!navigator.serviceWorker.controller;
    });
    expect(isControlled).toBe(true);
  });
});

test.describe('PWA — Offline Behaviour', () => {
  test.skip(
    !SW_ENABLED,
    'Skipped: set PLAYWRIGHT_SW=1 to run offline tests against a production build'
  );

  test('cached /home page loads when offline', async ({ page, context }) => {
    // Warm the cache
    await page.goto('/home');
    await page.waitForLoadState('load');

    // Wait for the SW to be controlling the page (skipWaiting + clients.claim)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true }
          );
          setTimeout(resolve, 3000);
        });
      }
    });

    // Cut the network
    await context.setOffline(true);

    // Reload — should serve from cache
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Page should not be an error page
    const title = await page.title();
    expect(title).not.toMatch(/error|404|500/i);

    await context.setOffline(false);
  });

  test('uncached navigation shows offline fallback page', async ({
    page,
    context,
  }) => {
    // Visit home to activate the SW first
    await page.goto('/home');
    await page.waitForLoadState('load');

    // Wait for the SW to be controlling the page (skipWaiting + clients.claim)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true }
          );
          setTimeout(resolve, 3000);
        });
      }
    });

    // Cut network
    await context.setOffline(true);

    // Navigate to a page that was never visited (not in cache)
    await page
      .goto('/some-definitely-uncached-page-xyz-' + Date.now())
      .catch(() => {});

    // Should show the offline page (either /offline or the inline fallback)
    const body = await page.locator('body').textContent();
    const hasOfflineText = /hors ligne|offline|connexion/i.test(body || '');
    expect(hasOfflineText).toBe(true);

    await context.setOffline(false);
  });

  test('/offline page itself is accessible', async ({ page }) => {
    await page.goto('/offline');
    await expect(page).toHaveTitle(/hors ligne/i);
    // Should contain a retry/reload affordance
    const retry = page.getByRole('button', { name: 'Réessayer' });
    await expect(retry).toBeVisible();

    // A11y contract: the offline state must be announced to assistive
    // tech (status / alert region) and the retry control must be
    // reachable via keyboard alone. Gap 15 of the PWA audit.
    const announcement = page
      .locator('[role="alert"], [role="status"], [aria-live]')
      .first();
    await expect(announcement).toBeVisible();

    // Page should expose a primary heading so SR users get a named
    // landmark when they jump to the start of the document.
    await expect(
      page.locator('h1, [role="heading"][aria-level="1"]')
    ).toBeVisible();

    // Retry button is keyboard-focusable.
    await retry.focus();
    await expect(retry).toBeFocused();
  });
});

test.describe('PWA — Manifest & Meta Tags', () => {
  test('manifest.json is linked in <head>', async ({ page }) => {
    await page.goto('/');
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .first()
      .getAttribute('href');
    expect(manifestHref).toBe('/manifest.json');
  });

  test('manifest.json is valid JSON with required fields', async ({
    request,
  }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/);
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = manifest.icons.some(
      (i: { sizes: string }) => i.sizes === '192x192'
    );
    const has512 = manifest.icons.some(
      (i: { sizes: string }) => i.sizes === '512x512'
    );
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  test('Apple PWA meta tags are present', async ({ page }) => {
    test.skip(
      !SW_ENABLED,
      'Apple meta tags are only emitted by the production Next.js build'
    );
    await page.goto('/');

    // Next.js Metadata API emits these via the <head>
    const capable = await page
      .locator('meta[name="apple-mobile-web-app-capable"]')
      .getAttribute('content', { timeout: 10_000 });
    expect(capable).toBe('yes');

    const statusBar = await page
      .locator('meta[name="apple-mobile-web-app-status-bar-style"]')
      .getAttribute('content', { timeout: 10_000 });
    expect(statusBar).toBeTruthy();
  });

  test('manifest.json Content-Type header is correct', async ({ request }) => {
    const response = await request.get('/manifest.json');
    const ct = response.headers()['content-type'];
    expect(ct).toContain('manifest+json');
  });

  test('sw.js Cache-Control is max-age=0', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.ok()).toBe(true);
    const cc = response.headers()['cache-control'];
    expect(cc).toMatch(/max-age=0/);
    expect(cc).toMatch(/must-revalidate/);
  });
});
