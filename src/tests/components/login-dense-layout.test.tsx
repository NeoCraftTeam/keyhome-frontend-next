import PasskeyLoginButton from '@/components/auth/PasskeyLoginButton';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Les deux pages de connexion (client et bailleur) doivent tenir dans la
 * hauteur de l'écran sans scroll : les liens de pied de page sont ancrés et
 * les blocs OAuth / passkey passent en rythme `dense`.
 *
 * Ces tests verrouillent le contrat `dense` des deux composants partagés :
 * il resserre l'espacement SANS descendre sous la cible tactile de 44px
 * (WCAG 2.5.8) ni retirer une méthode de connexion.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ loginWithOAuth: vi.fn(), setUser: vi.fn() }),
}));

vi.mock('@/lib/auth/oauth-providers', () => ({
  getConfiguredOAuthProviders: () => ['google', 'facebook', 'github'],
}));

const passkeyState = vi.hoisted(() => ({
  supported: true,
  unsupportedReason: null as string | null,
  isLoading: false,
  error: '' as string,
}));

vi.mock('@/hooks/usePasskey', () => ({
  usePasskeyLogin: () => ({
    ...passkeyState,
    setError: vi.fn(),
    loginWithPasskey: vi.fn(),
    clearError: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe('SocialLoginButtons — rythme dense des pages de connexion', () => {
  // BUG CATCH: si `dense` masquait un fournisseur, l'utilisateur perdrait une
  // méthode de connexion en gagnant de la place — inacceptable.
  it('affiche tous les fournisseurs configurés en mode dense', () => {
    render(<SocialLoginButtons dense />);

    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Facebook' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument();
  });

  // BUG CATCH: le gain de hauteur ne doit jamais rendre les pastilles OAuth
  // plus petites que la cible tactile minimale de 44px (WCAG 2.5.8).
  it('garde des pastilles OAuth au-dessus de la cible tactile de 44px', () => {
    render(<SocialLoginButtons dense />);

    const google = screen.getByRole('button', { name: 'Google' });
    expect(google).toHaveStyle({ width: '46px', height: '46px' });
  });

  it('reste plus généreux hors mode dense (inscription, autres pages)', () => {
    render(<SocialLoginButtons />);

    const google = screen.getByRole('button', { name: 'Google' });
    expect(google).toHaveStyle({ width: '52px', height: '52px' });
  });
});

describe('PasskeyLoginButton — rythme dense des pages de connexion', () => {
  // BUG CATCH: le mode dense ne doit pas escamoter la connexion par passkey,
  // seule méthode sans mot de passe des deux panels.
  it('affiche le bouton passkey en mode dense', () => {
    render(<PasskeyLoginButton loginContext="client" dense />);

    expect(
      screen.getByRole('button', { name: /passkey/i })
    ).toBeInTheDocument();
  });

  it('affiche le bouton passkey hors mode dense', () => {
    render(<PasskeyLoginButton loginContext="owner" />);

    expect(
      screen.getByRole('button', { name: /passkey/i })
    ).toBeInTheDocument();
  });
});
