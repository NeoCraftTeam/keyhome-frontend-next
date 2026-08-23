import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AuthLayout ne doit plus afficher de splash bloquant (l'ancien overlay
 * « premium » de 1,4 s avant le formulaire de connexion) :
 *  - un invité résolu voit ses enfants IMMÉDIATEMENT, sans overlay de splash ;
 *  - pendant la résolution (isLoading) → loader léger, pas les enfants ;
 *  - un utilisateur authentifié (hors vérification) est redirigé ;
 *  - les pages de vérification restent visibles même authentifié.
 */

const { mockReplace, mockAuthState, mockPathnameRef } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockAuthState: {
    current: {
      isAuthenticated: false,
      isLoading: false,
      user: null as null | { role: string },
    },
  },
  mockPathnameRef: { current: '/login' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathnameRef.current,
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => mockAuthState.current,
}));

import AuthLayout from '@/app/(auth)/layout';

beforeEach(() => {
  vi.clearAllMocks();
  mockPathnameRef.current = '/login';
  mockAuthState.current = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
  };
  sessionStorage.clear();
});

describe('AuthLayout', () => {
  it('affiche les enfants immédiatement pour un invité résolu — aucun splash bloquant', () => {
    render(
      <AuthLayout>
        <div>login-form</div>
      </AuthLayout>
    );

    expect(screen.getByText('login-form')).toBeInTheDocument();
    // L'overlay de splash (aria-label dédié) ne doit plus jamais gater l'auth.
    expect(
      screen.queryByLabelText("Chargement de l'application")
    ).not.toBeInTheDocument();
  });

  it('affiche un loader (pas les enfants) tant que l’auth se résout', () => {
    mockAuthState.current = {
      isAuthenticated: false,
      isLoading: true,
      user: null,
    };

    render(
      <AuthLayout>
        <div>login-form</div>
      </AuthLayout>
    );

    expect(screen.queryByText('login-form')).not.toBeInTheDocument();
  });

  it('redirige un utilisateur authentifié (non-invité) hors des pages auth', () => {
    mockAuthState.current = {
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'customer' },
    };

    const { container } = render(
      <AuthLayout>
        <div>login-form</div>
      </AuthLayout>
    );

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });

  it('garde les pages de vérification visibles même authentifié', () => {
    mockPathnameRef.current = '/verify-email';
    mockAuthState.current = {
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'customer' },
    };

    render(
      <AuthLayout>
        <div>verify-form</div>
      </AuthLayout>
    );

    expect(screen.getByText('verify-form')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
