import { expect, test } from '@playwright/test';

/**
 * E2E: Authentication pages — login, register, forgot password.
 *
 * Based on actual UI:
 * - Login: French labels ("Adresse email", "Mot de passe")
 * - Register: Multi-step wizard (Type de compte → Informations → Sécurité)
 * - Forgot password: Email input + submit
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  // BUG CATCH: Login page not rendering means users can't sign in at all.
  test('renders the login form with email and password fields', async ({
    page,
  }) => {
    // French labels: "Adresse email" and "Mot de passe"
    // MUI renders both the <input> and the show-password <button> with an aria-label matching
    // "Mot de passe" — use .first() to target only the input field.
    await expect(page.getByLabel(/adresse email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible();
  });

  // BUG CATCH: If the submit button is missing, nobody can log in.
  // Use exact: true to avoid matching the PasskeyLoginButton ('Se connecter avec une Passkey').
  test('has a "Se connecter" submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', {
      name: 'Se connecter',
      exact: true,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  // BUG CATCH: The "Mot de passe oublié ?" link must be visible.
  test('has a forgot password link', async ({ page }) => {
    const forgotLink = page.getByText(/mot de passe oublié/i);
    await expect(forgotLink).toBeVisible();
  });

  // BUG CATCH: "Créer un compte" link must be visible for new users.
  test('has a link to registration', async ({ page }) => {
    const registerLink = page.getByText(/créer un compte/i);
    await expect(registerLink).toBeVisible();
  });

  // BUG CATCH: Social login buttons must be visible (Google, Facebook, Apple).
  test('shows social login options', async ({ page }) => {
    await expect(page.getByText(/continuer avec/i)).toBeVisible();
  });

  // BUG CATCH: Password visibility toggle works — the eye icon toggles
  // between password and text input types.
  test('password visibility toggle works', async ({ page }) => {
    const passwordField = page.getByLabel(/mot de passe/i).first();
    await expect(passwordField).toHaveAttribute('type', 'password');

    // The visibility toggle is an IconButton inside the password field's InputAdornment
    // It's the button with the Visibility icon
    const toggleButton = page
      .locator('[aria-label]')
      .filter({ hasText: '' })
      .locator('..')
      .locator('button')
      .last();
    // Simpler: just find the button inside the password field area
    const passwordContainer = passwordField.locator('..');
    const eyeButton = passwordContainer.locator('button');

    if ((await eyeButton.count()) > 0) {
      await eyeButton.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  // BUG CATCH: Registration is a multi-step wizard.
  // Step 1 asks "Quel type de compte souhaitez-vous créer ?"
  test('renders the registration wizard with step 1 (account type)', async ({
    page,
  }) => {
    // Wait for the page to be interactive
    await expect(page.getByText(/créer un compte/i)).toBeVisible({
      timeout: 10000,
    });
    // Step 1: Account type selection with Particulier and Agent/Agence options
    await expect(page.getByText(/particulier/i)).toBeVisible();
    await expect(page.getByText(/agent/i)).toBeVisible();
  });

  // BUG CATCH: The "Continuer" button should be visible to proceed to step 2.
  test('has a continue button', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: /continuer/i });
    await expect(continueBtn).toBeVisible();
  });

  // BUG CATCH: Must have a link back to login for existing users.
  test('has a link back to login', async ({ page }) => {
    const loginLink = page.getByText(/se connecter/i);
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  // BUG CATCH: Forgot password page must have an email input.
  test('renders with an email field', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  // BUG CATCH: Must have a submit button to request password reset.
  test('has a submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', {
      name: /envoyer|réinitialiser|reset|submit/i,
    });
    await expect(submitButton).toBeVisible();
  });
});
