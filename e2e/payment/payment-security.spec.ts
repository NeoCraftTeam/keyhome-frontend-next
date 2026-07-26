import { expect, test } from '@playwright/test';

/**
 * Next.js dev server can intermittently reset connections under parallel Playwright load.
 */
async function gotoWithRetry(
  page: import('@playwright/test').Page,
  url: string,
  attempts = 3
): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url);
      return;
    } catch (err) {
      last = err;
      await page.waitForTimeout(400 * (i + 1));
    }
  }
  throw last;
}

/**
 * E2E: Security tests for the payment system.
 *
 * Ensures that secret keys, API tokens, and sensitive data are never
 * exposed in the page source, client-side JavaScript, or network requests.
 */

const FORBIDDEN_PATTERNS = [
  /FLWSECK[_-]/i,
  /FLW_SECRET/i,
  /FLWPUBK[_-]/i,
  /sk_sandbox/i,
  /sk_live/i,
  /webhook_secret/i,
  /FEDAPAY/i,
];

test.describe('Payment Security — No Secret Key Exposure', () => {
  test('no secrets in payment callback page source', async ({ page }) => {
    // Mock verify so page renders without errors
    await page.route('**/api/v1/payments/verify_payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          is_paid: true,
          is_unlocked: true,
          reference: 'PAY-SEC-001',
          tx_ref: 'KH-SEC-001',
          gateway: 'kpay',
        }),
      });
    });

    await page.goto('/payment/callback?tx_ref=KH-SEC-001&status=successful');
    await page.waitForLoadState('load');

    const content = await page.content();
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('no secrets in home page source', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const content = await page.content();
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('no secrets in login page source', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    const content = await page.content();
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('no secret keys leaked in outgoing network requests', async ({
    page,
  }) => {
    const requestBodies: string[] = [];

    page.on('request', (request) => {
      const body = request.postData();
      if (body) {
        requestBodies.push(body);
      }
      // Also check URL params
      requestBodies.push(request.url());
    });

    // Mock payment API to avoid actual calls
    await page.route('**/api/v1/payments/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          is_paid: true,
          reference: 'X',
          tx_ref: 'X',
          gateway: 'kpay',
        }),
      });
    });

    await gotoWithRetry(
      page,
      '/payment/callback?tx_ref=KH-NET-001&status=successful'
    );
    await page.waitForLoadState('load');

    for (const body of requestBodies) {
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(body).not.toMatch(pattern);
      }
    }
  });

  test('no __NEXT_DATA__ contains secret keys', async ({ page }) => {
    await page.goto('/payment/callback?tx_ref=KH-NEXT-001&status=successful');

    // Check __NEXT_DATA__ script tag (Next.js serialized server props)
    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ?? '';
    });

    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(nextData).not.toMatch(pattern);
    }
  });
});

test.describe('Payment Security — Access Control', () => {
  test('protected page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/profile');
    // The PWA service worker + Reverb websocket keepalive prevent
    // 'networkidle' from ever firing on this stack, so wait for 'load' first
    // and then for the client-side redirect from (dashboard)/layout.tsx
    // (router.replace('/login') for unauthenticated visitors).
    await page.waitForLoadState('load');
    await page
      .waitForURL(/\/(login|sign-in|auth)/i, { timeout: 8000 })
      .catch(() => {
        /* no-op — we still verify below in case Clerk shows an auth modal */
      });

    // Clerk should redirect unauthenticated users to /login
    const url = page.url();
    const isRedirected =
      url.includes('/login') ||
      url.includes('/sign-in') ||
      url.includes('/auth');
    const hasClerkAuth = await page
      .locator('[class*="cl-"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Either redirected to login/auth page, or Clerk auth UI is shown, or not on profile anymore
    expect(
      isRedirected || hasClerkAuth || !url.includes('/profile')
    ).toBeTruthy();
  });
});

test.describe('Payment Security — No FedaPay References', () => {
  test('no FedaPay references in any client-side JS bundle', async ({
    page,
  }) => {
    const jsContents: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('_next/') && url.endsWith('.js')) {
        try {
          const body = await response.text();
          jsContents.push(body);
        } catch {
          // Some responses may not be readable
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Check that no JS bundle references FedaPay
    for (const js of jsContents) {
      expect(js).not.toMatch(/FedaPayService/i);
      expect(js).not.toMatch(/fedapay\.com/i);
      // Note: the word "fedapay" might appear in comments or dead code;
      // we specifically check for service class and domain references
    }
  });
});
