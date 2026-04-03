import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@/types';

/* ── Hoisted mock variables (available inside vi.mock factories) ──── */

const {
  mockPush,
  mockReplace,
  mockGetToken,
  mockSignOut,
  mockSignIn,
  mockAuthService,
  mockPathnameRef,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockGetToken: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
  mockSignOut: vi.fn(),
  mockSignIn: { authenticateWithRedirect: vi.fn() },
  mockAuthService: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    clerkExchange: vi.fn(),
  },
  mockPathnameRef: { current: '/home' },
}));

/* ── Mocks ─────────────────────────────────────────────────────────── */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathnameRef.current,
}));

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: mockSignOut }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: mockGetToken,
  }),
  useSignIn: () => ({ signIn: mockSignIn }),
  useUser: () => ({ user: null }),
}));

vi.mock('@/services/auth.service', () => ({
  authService: mockAuthService,
  OAuthProvider: { google: 'google', facebook: 'facebook', apple: 'apple' },
}));

vi.mock('@/lib/auth-token', () => ({
  registerTokenGetter: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock('@/lib/auth-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-session')>();
  return {
    ...actual,
    // Keep real implementations — they manage module-level state needed by tests
  };
});

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  resetCsrfState: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

vi.mock('@/lib/trusted-redirect', () => ({
  redirectToTrustedUrl: vi.fn(() => true),
}));

// Import AFTER mocks are set up
import { registerTokenGetter } from '@/lib/auth-token';
import {
  AuthProvider,
  useAuth,
  __resetModuleStateForTests,
} from '@/providers/AuthProvider';

/* ── Helpers ───────────────────────────────────────────────────────── */

const mockUser = {
  id: 'user-uuid-1',
  firstname: 'Jean',
  lastname: 'Dupont',
  email: 'jean@keyhome.app',
  phone_number: '+237690123456',
  role: 'customer' as const,
  type: 'individual',
  avatar: null,
  display_name: 'Jean Dupont',
  agency_name: null,
  city_id: '1',
  city_name: 'Yaoundé',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T10:30:00Z',
};

/** Renders AuthProvider and returns the auth context via a test consumer */
function AuthConsumer({
  onContext,
}: {
  onContext: (ctx: ReturnType<typeof useAuth>) => void;
}) {
  const ctx = useAuth();
  React.useEffect(() => {
    onContext(ctx);
  });
  return (
    <div>
      <span data-testid="user">{ctx.user?.firstname ?? 'none'}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
    </div>
  );
}

function renderWithProvider() {
  let authContext: ReturnType<typeof useAuth> | null = null;
  const onContext = (ctx: ReturnType<typeof useAuth>) => {
    authContext = ctx;
  };

  const result = render(
    <AuthProvider>
      <AuthConsumer onContext={onContext} />
    </AuthProvider>
  );

  return { ...result, getContext: () => authContext! };
}

/** Render and wait for the initial auth flow to complete via DOM polling. */
async function renderAndWaitForAuth(
  expectedState: 'authenticated' | 'unauthenticated' = 'unauthenticated'
) {
  const result = renderWithProvider();
  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
    if (expectedState === 'authenticated') {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    }
  });
  return result;
}

/* ── Tests ─────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  mockPathnameRef.current = '/home';
  // Reset module-level inMemoryToken so tests are independent
  __resetModuleStateForTests();
  // Default: no active session
  mockAuthService.me.mockRejectedValue(new Error('Unauthenticated'));
  // Clear all cookies
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  });
  // Clear localStorage (legacy token migration reads it)
  localStorage.clear();
  sessionStorage.clear();
});

describe('AuthProvider', () => {
  describe('context contract', () => {
    // BUG CATCH: If useAuth is called outside the provider tree, every
    // component using it would silently get `undefined`, causing cascading
    // TypeErrors throughout the app.
    it('throws when useAuth is called outside AuthProvider', () => {
      const consoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        function Orphan() {
          useAuth();
          return null;
        }
        render(<Orphan />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = consoleError;
    });

    // BUG CATCH: The context value must include all required methods.
    // A missing method crashes every page that calls it.
    it('provides all required context methods', async () => {
      const { getContext } = renderWithProvider();

      await waitFor(() => {
        const ctx = getContext();
        expect(ctx).toBeDefined();
        expect(typeof ctx.login).toBe('function');
        expect(typeof ctx.loginOwner).toBe('function');
        expect(typeof ctx.loginWithOAuth).toBe('function');
        expect(typeof ctx.logout).toBe('function');
        expect(typeof ctx.setUser).toBe('function');
        expect(typeof ctx.refreshUser).toBe('function');
        expect(typeof ctx.finalizeAuth).toBe('function');
        expect(typeof ctx.getClerkToken).toBe('function');
      });
    });
  });

  describe('initial state', () => {
    // BUG CATCH: If isLoading starts as false, components render before
    // auth state is resolved, flashing unauthenticated content briefly.
    it('starts in loading state', () => {
      renderWithProvider();
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    // BUG CATCH: If user is non-null before auth resolves, protected
    // components might briefly allow access to an unauthenticated visitor.
    it('starts with no user', () => {
      renderWithProvider();
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  describe('session-first authentication', () => {
    // BUG CATCH: When the session cookie is valid, the app should use it
    // without requiring any token. If this fails, returning users see a
    // login screen despite having a valid session.
    it('resolves user from session cookie (httpOnly)', async () => {
      mockAuthService.me
        .mockRejectedValueOnce(new Error('first call fails'))
        .mockResolvedValueOnce(mockUser);
      // Actually: first call is with null token (session attempt), if it succeeds, user is set
      mockAuthService.me.mockReset();
      mockAuthService.me.mockResolvedValue(mockUser);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Jean');
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });
    });

    // BUG CATCH: When no session exists and no token is available,
    // the user must be unauthenticated (not stuck in loading).
    it('resolves to unauthenticated when no session or token exists', async () => {
      mockAuthService.me.mockRejectedValue(new Error('Unauthenticated'));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });
  });

  describe('password login', () => {
    // BUG CATCH: If login doesn't store the token in-memory or set the
    // user state, the app thinks the user is still unauthenticated after
    // a successful login, showing the login form again.
    it('sets user and token after successful customer login', async () => {
      mockAuthService.login.mockResolvedValue({
        token: 'sanctum-token-123',
        user: mockUser,
      });

      const { getContext } = await renderAndWaitForAuth();

      // Call login directly (not inside act) and wait for DOM update
      getContext().login('jean@keyhome.app', 'password123');

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Jean');
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'jean@keyhome.app',
        'password123',
        'client'
      );
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });

    // BUG CATCH: If a non-customer (agent/admin) logs in through the customer
    // login form, they should be rejected. Without this check, agents would
    // access the customer panel with incorrect permissions.
    it('rejects non-customer users on customer login', async () => {
      mockAuthService.login.mockResolvedValue({
        token: 'agent-token',
        user: { ...mockUser, role: UserRole.AGENT },
      });

      const { getContext } = await renderAndWaitForAuth();

      await expect(
        getContext().login('agent@keyhome.app', 'pass')
      ).rejects.toThrow(/réservé aux clients/i);
    });
  });

  describe('owner login', () => {
    // BUG CATCH: Owner login must redirect to /owner/dashboard.
    // If it redirects to /home, agents land on the customer-facing panel.
    it('sets user and redirects to /owner/dashboard', async () => {
      mockAuthService.login.mockResolvedValue({
        token: 'owner-token',
        user: { ...mockUser, role: UserRole.AGENT },
      });

      const { getContext } = await renderAndWaitForAuth();

      getContext().loginOwner('agent@keyhome.app', 'pass');

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Jean');
      });
      expect(mockReplace).toHaveBeenCalledWith('/owner/dashboard');
    });

    // BUG CATCH: If a customer logs in via the owner form, they should
    // be rejected to prevent confusion and permission issues.
    it('rejects customers on owner login', async () => {
      mockAuthService.login.mockResolvedValue({
        token: 'customer-token',
        user: mockUser,
      });

      const { getContext } = await renderAndWaitForAuth();

      await expect(
        getContext().loginOwner('customer@keyhome.app', 'pass')
      ).rejects.toThrow(/réservé aux propriétaires/i);
    });
  });

  describe('logout', () => {
    // BUG CATCH: If logout doesn't clear state, the user appears
    // authenticated after logging out, potentially accessing protected
    // resources.
    it('clears user state on logout', async () => {
      mockAuthService.me.mockResolvedValue(mockUser);
      const { getContext } = await renderAndWaitForAuth('authenticated');

      // Logout calls resetCsrfState and clears session immediately,
      // then waits for an overlay timer. Verify user is cleared.
      vi.useFakeTimers();
      getContext().logout('/home');

      // Advance past LOGOUT_OVERLAY_DURATION_MS (3500ms)
      vi.advanceTimersByTime(5000);
      vi.useRealTimers();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('none');
      });
    });
  });

  describe('role cookie management', () => {
    // BUG CATCH: The role cookie controls edge routing (customer vs owner).
    // If it's not set on login, the middleware can't route correctly.
    it('sets kh_role cookie on authentication', async () => {
      mockAuthService.me.mockResolvedValue(mockUser);
      await renderAndWaitForAuth('authenticated');

      expect(document.cookie).toContain('kh_role=customer');
    });

    // BUG CATCH: Agent/admin cookie is set with path=/owner. In jsdom,
    // cookies with a non-root path aren't visible via document.cookie,
    // so we verify the auth state resolved with the correct role instead.
    it('authenticates agent users and sets role state', async () => {
      mockAuthService.me.mockResolvedValue({
        ...mockUser,
        role: UserRole.AGENT,
      });
      const { getContext } = await renderAndWaitForAuth('authenticated');

      expect(getContext().user?.role).toBe(UserRole.AGENT);
    });
  });

  describe('401 auth-expired event', () => {
    // BUG CATCH: When the backend returns 401 on a non-auth route, the
    // frontend must clear its auth state. If it doesn't, the user sees
    // broken "loading" states on every API call until they refresh.
    it('clears auth state on kh:auth-expired event', async () => {
      mockAuthService.me.mockResolvedValue(mockUser);
      await renderAndWaitForAuth('authenticated');

      act(() => {
        window.dispatchEvent(new CustomEvent('kh:auth-expired'));
      });

      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  describe('refreshUser', () => {
    // BUG CATCH: After a profile update, refreshUser must fetch the latest
    // user data. If it fails, the UI shows stale data.
    it('updates user state with fresh data', async () => {
      mockAuthService.me.mockResolvedValue(mockUser);
      const { getContext } = await renderAndWaitForAuth('authenticated');

      // Now /me returns updated user
      mockAuthService.me.mockResolvedValue({
        ...mockUser,
        firstname: 'Pierre',
      });
      getContext().refreshUser();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Pierre');
      });
    });
  });

  describe('pending email verification routes', () => {
    it('registers kh_verify_token_owner getter and skips me without authenticating', async () => {
      mockPathnameRef.current = '/owner/auth/verify-otp';
      sessionStorage.setItem('kh_verify_token_owner', 'verify-session-token');

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('none');
      });

      expect(registerTokenGetter).toHaveBeenCalled();
      expect(mockAuthService.me).not.toHaveBeenCalled();
    });

    it('does the same for /verify-email when kh_verify_token_client is set', async () => {
      mockPathnameRef.current = '/verify-email';
      sessionStorage.setItem('kh_verify_token_client', 'verify-session-token');

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });

      expect(mockAuthService.me).not.toHaveBeenCalled();
    });

    it('resolves normally on verify-otp path when kh_verify_token_owner is absent', async () => {
      mockPathnameRef.current = '/owner/auth/verify-otp';
      mockAuthService.me.mockRejectedValue(new Error('Unauthenticated'));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });

      expect(mockAuthService.me).toHaveBeenCalled();
    });
  });

  describe('legacy token migration', () => {
    // BUG CATCH: Old versions stored tokens in localStorage. If migration
    // doesn't run, users with legacy tokens are logged out after the update.
    it('cleans up legacy localStorage keys on mount', async () => {
      localStorage.setItem('kh_sanctum_token', 'old-token');
      localStorage.setItem('kh_sanctum_token_client', 'old-client-token');
      localStorage.setItem('kh_sanctum_token_owner', 'old-owner-token');

      // The migrated token validation will fail
      mockAuthService.me.mockRejectedValue(new Error('Invalid'));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // All legacy keys should be removed regardless of migration success
      expect(localStorage.getItem('kh_sanctum_token')).toBeNull();
      expect(localStorage.getItem('kh_sanctum_token_client')).toBeNull();
      expect(localStorage.getItem('kh_sanctum_token_owner')).toBeNull();
    });
  });
});
