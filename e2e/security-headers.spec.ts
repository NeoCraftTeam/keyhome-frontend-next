import { expect, test } from '@playwright/test';

/**
 * E2E: Security headers — verify CSP, HSTS, and other security headers.
 *
 * These tests catch regressions in next.config.ts security headers.
 * If a header is missing, the app is vulnerable to XSS, clickjacking, etc.
 */

test.describe('Security Headers', () => {
  let headers: Record<string, string>;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const response = await page.goto('/');
    const responseHeaders = response?.headers() ?? {};
    headers = responseHeaders;
    await page.close();
  });

  // BUG CATCH: Without CSP, any injected script runs with full privileges.
  // This is the #1 defense against XSS attacks.
  test('Content-Security-Policy header is present', () => {
    expect(headers['content-security-policy']).toBeDefined();
  });

  // BUG CATCH: CSP must allow self, mapbox (maps), clerk (auth), and the API.
  // Nonce-based CSP is now set via src/proxy.ts with 'strict-dynamic'.
  test('CSP allows required sources', () => {
    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('api.mapbox.com');
    expect(csp).toContain('clerk');
  });

  test('CSP allows Firebase / Google APIs (connect-src)', () => {
    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain('googleapis.com');
  });

  test('CSP uses nonce-based script-src', () => {
    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).toMatch(/'strict-dynamic'|'unsafe-eval'/);
  });

  // BUG CATCH: CSP img-src must include keyhome.app for the new domain.
  test('CSP img-src allows keyhome.app domain', () => {
    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain('keyhome.app');
  });

  // BUG CATCH: Without HSTS, browsers may connect over plain HTTP,
  // making the connection vulnerable to MITM attacks.
  test('Strict-Transport-Security header is present', () => {
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  // BUG CATCH: Without X-Frame-Options, the app can be embedded in
  // a malicious iframe for clickjacking attacks.
  test('X-Frame-Options prevents clickjacking', () => {
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-frame-options'].toUpperCase()).toBe('SAMEORIGIN');
  });

  // BUG CATCH: Without nosniff, browsers may MIME-sniff responses
  // and execute uploaded files as scripts.
  test('X-Content-Type-Options is set to nosniff', () => {
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  // BUG CATCH: Without Referrer-Policy, full URLs (including tokens
  // in query strings) leak to third-party analytics.
  test('Referrer-Policy is set', () => {
    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['referrer-policy']).toContain('origin');
  });

  // BUG CATCH: Without Permissions-Policy, third-party scripts
  // could access the camera/microphone.
  test('Permissions-Policy restricts sensitive APIs', () => {
    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=(self)');
  });
});
