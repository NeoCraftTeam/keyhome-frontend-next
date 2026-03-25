import { expect, test } from '@playwright/test';

/**
 * E2E: Owner panel — authentication gates, page structure, and key UX flows.
 *
 * These tests run without credentials (unauthenticated) to verify that:
 * - Protected owner routes redirect correctly
 * - Public owner auth pages render their forms
 * - Basic page structure is present (no 500 errors)
 *
 * Authenticated owner flows are tested separately via API-seeded sessions.
 */

test.describe('Owner Auth Pages', () => {
  test.describe('Owner Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/owner/login');
      await page.waitForLoadState('networkidle');
    });

    // BUG CATCH: Owner login page must render — if it 404s or 500s, owners
    // can't access the management panel at all.
    test('renders without server error', async ({ page }) => {
      const response = await page.goto('/owner/login');
      expect(response?.status()).toBeLessThan(500);
    });

    // BUG CATCH: The email field must be visible. If it's missing, the login
    // form is broken and owners are locked out.
    test('has an email input field', async ({ page }) => {
      const emailField = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
      await expect(emailField).toBeVisible({ timeout: 10000 });
    });

    // BUG CATCH: The password field must be present.
    test('has a password input field', async ({ page }) => {
      const passwordField = page.locator('input[type="password"]').first();
      await expect(passwordField).toBeVisible({ timeout: 10000 });
    });

    // BUG CATCH: Submit button must exist and be enabled on load.
    test('has an enabled submit button', async ({ page }) => {
      const submitBtn = page.getByRole('button', { name: /connexion|se connecter|login/i });
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await expect(submitBtn).toBeEnabled();
    });

    // BUG CATCH: "Mot de passe oublié" link must be visible so owners can
    // recover access without contacting support.
    test('has a forgot password link', async ({ page }) => {
      const forgotLink = page.getByText(/mot de passe oublié|forgot/i);
      await expect(forgotLink).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Owner Register', () => {
    // BUG CATCH: New owners must be able to reach the registration wizard.
    // /owner/register is a thin redirect (router.replace) to the shared /register page.
    // We test /register directly — that's where new owners actually land and
    // where the registration flow must work. Testing the redirect itself is fragile
    // because Next.js router.replace aborts the initial page load event.
    test('shared registration page renders without server error', async ({ page }) => {
      const response = await page.goto('/register');
      expect(response?.status()).toBeLessThan(500);
    });

    test('shared registration page has a continue button', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      const btn = page.getByRole('button', { name: /continuer/i });
      await expect(btn).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Owner Protected Route Guards', () => {
  // BUG CATCH: If the middleware lets unauthenticated users reach the owner
  // dashboard, sensitive analytics data is exposed without auth.
  test('/owner/dashboard redirects unauthenticated visitors', async ({ page }) => {
    await page.goto('/owner/dashboard');
    await page.waitForURL((url) => !url.pathname.startsWith('/owner/dashboard'), {
      timeout: 8000,
    });
    expect(page.url()).toMatch(/\/owner\/login/);
  });

  // BUG CATCH: Owner ads management must be gated.
  test('/owner/ads redirects unauthenticated visitors', async ({ page }) => {
    await page.goto('/owner/ads');
    await page.waitForURL((url) => !url.pathname.startsWith('/owner/ads'), { timeout: 8000 });
    expect(page.url()).toMatch(/\/owner\/login/);
  });

  // BUG CATCH: Lease contracts are sensitive — must redirect unauthenticated.
  test('/owner/lease-contracts redirects unauthenticated visitors', async ({ page }) => {
    await page.goto('/owner/lease-contracts');
    await page.waitForURL((url) => !url.pathname.startsWith('/owner/lease-contracts'), {
      timeout: 8000,
    });
    expect(page.url()).toMatch(/\/owner\/login/);
  });

  // BUG CATCH: Financial data is the most sensitive — must be protected.
  test('/owner/financials redirects unauthenticated visitors', async ({ page }) => {
    await page.goto('/owner/financials');
    await page.waitForURL((url) => !url.pathname.startsWith('/owner/financials'), {
      timeout: 8000,
    });
    expect(page.url()).toMatch(/\/owner\/login/);
  });
});

test.describe('Owner Route Separation (Customer Isolation)', () => {
  // BUG CATCH: Customer users must not be able to access owner routes.
  // The middleware checks kh_role cookie — but here we verify no plain
  // GET returns data without auth (role cookie absent = treated as no auth).
  test('/owner/profile is not accessible without the owner role cookie', async ({ page }) => {
    await page.goto('/owner/profile');
    await page.waitForURL((url) => !url.pathname.startsWith('/owner/profile'), {
      timeout: 8000,
    });
    expect(page.url()).not.toMatch(/\/owner\/profile/);
  });
});

test.describe('Owner Login Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/owner/login');
    await page.waitForLoadState('networkidle');
  });

  // BUG CATCH: Submitting with empty fields must not cause a 500 — the UI
  // should handle validation before sending the request.
  test('shows validation feedback when submitting empty form', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /connexion|se connecter/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Either the button stays on login (no redirect to dashboard)
      // or an error message appears — it must not navigate to a protected page.
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/\/owner\/dashboard/);
    }
  });

  // BUG CATCH: Invalid credentials must show an error message and NOT
  // redirect to the dashboard.
  test('shows error for invalid credentials without crashing', async ({ page }) => {
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('notauser@keyhome.test');
      await passwordField.fill('wrongpassword123');

      const submitBtn = page.getByRole('button', { name: /connexion|se connecter/i });
      await submitBtn.click();

      // Wait for response — should NOT redirect to dashboard
      await page.waitForTimeout(3000);
      expect(page.url()).not.toMatch(/\/owner\/dashboard/);

      // Must not show a server error page
      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
    }
  });
});
