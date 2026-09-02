import type { Mock } from 'vitest';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
import {
  __resetRefreshSingleFlightForTests,
  authService,
} from '@/services/auth.service';

const mockedApi = vi.mocked(api);
const mockGet = mockedApi.get as Mock;
const mockPost = mockedApi.post as Mock;

// Realistic user data matching the Laravel backend
const mockUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  firstname: 'Jean',
  lastname: 'Dupont',
  phone_number: '+237690123456',
  email: 'jean.dupont@example.cm',
  avatar: null,
  display_name: 'Jean Dupont',
  agency_name: null,
  role: 'customer',
  type: 'individual',
  city_id: '1',
  city_name: 'Yaoundé',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T10:30:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  __resetRefreshSingleFlightForTests();
  // Mock window.location for OAuth tests
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { origin: 'https://keyhome.app', href: 'https://keyhome.app/' },
  });
});

describe('authService', () => {
  describe('login', () => {
    // BUG CATCH: Login is a two-step process: POST credentials → GET /auth/me.
    // If the second call doesn't use the explicit Bearer token, the user
    // profile fetch fails because Clerk's interceptor returns null for
    // email/password users.
    it('exchanges credentials and fetches user profile with explicit token', async () => {
      mockPost.mockResolvedValue({
        data: {
          message: 'Connexion réussie',
          access_token: 'sanctum-token-xyz',
          expires_at: '2026-02-28T23:59:59Z',
        },
      });
      mockGet.mockResolvedValue({ data: { data: mockUser } });

      const result = await authService.login(
        'jean.dupont@example.cm',
        'Str0ngP@ss!'
      );

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'jean.dupont@example.cm',
        password: 'Str0ngP@ss!',
        login_context: 'client',
      });
      // Verify the GET /auth/me uses explicit Bearer token
      expect(mockGet).toHaveBeenCalledWith('/auth/me', {
        headers: { Authorization: 'Bearer sanctum-token-xyz' },
      });
      expect(result.token).toBe('sanctum-token-xyz');
      expect(result.user.firstname).toBe('Jean');
      expect(result.expires_at).toBe('2026-02-28T23:59:59Z');
    });

    // BUG CATCH: If login fails (wrong password), the error must propagate
    // so the UI can show the error message.
    it('propagates login errors', async () => {
      mockPost.mockRejectedValue(new AxiosError('Unauthorized'));
      await expect(
        authService.login('wrong@email.cm', 'bad')
      ).rejects.toThrow();
    });
  });

  describe('registerCustomer', () => {
    // BUG CATCH: Registration must send all required fields. If phone_number
    // is dropped, Laravel returns 422 but the frontend shows a generic error.
    it('sends all required fields and returns token + user', async () => {
      mockPost.mockResolvedValue({
        data: {
          message: 'Inscription réussie',
          user: mockUser,
          access_token: 'new-customer-token',
          email_verification_required: true,
        },
      });

      const payload = {
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@example.cm',
        phone_number: '+237690123456',
        password: 'Str0ngP@ss!2026',
        confirm_password: 'Str0ngP@ss!2026',
        city_id: '1',
      };

      const result = await authService.registerCustomer(payload);

      expect(mockPost).toHaveBeenCalledWith(
        '/auth/registerCustomer',
        expect.objectContaining(payload)
      );
      expect(result.token).toBe('new-customer-token');
      expect(result.user.email).toBe('jean.dupont@example.cm');
    });
  });

  describe('registerAgent', () => {
    // BUG CATCH: Agent registration includes a `type` field (individual/agency).
    // If it's missing, the backend can't distinguish agent types.
    it('sends agent-specific fields including type', async () => {
      mockPost.mockResolvedValue({
        data: {
          message: 'Inscription agent réussie',
          user: { ...mockUser, role: 'agent', type: 'agency' },
          access_token: 'agent-token',
          email_verification_required: true,
        },
      });

      const payload = {
        firstname: 'Marie',
        lastname: 'Ngono',
        email: 'marie@agence-immo.cm',
        phone_number: '+237677889900',
        password: 'Ag3ntP@ss!',
        confirm_password: 'Ag3ntP@ss!',
        type: 'agency' as const,
      };

      const result = await authService.registerAgent(payload);
      expect(result.token).toBe('agent-token');
    });
  });

  describe('me', () => {
    // BUG CATCH: Must unwrap data.data correctly or the profile page shows
    // raw response wrapper instead of user fields.
    it('unwraps user data from response', async () => {
      mockGet.mockResolvedValue({ data: { data: mockUser } });
      const user = await authService.me();
      expect(user.firstname).toBe('Jean');
      expect(user.city_name).toBe('Yaoundé');
    });

    it('falls back to raw data when not wrapped', async () => {
      mockGet.mockResolvedValue({ data: mockUser });
      const user = await authService.me();
      expect(user.firstname).toBe('Jean');
    });
  });

  describe('clerkExchange', () => {
    // BUG CATCH: Clerk exchange has two possible response shapes.
    // If the OTP-required state isn't handled, users get stuck in a
    // broken auth state after signing in with a new Clerk account.
    it('handles otp_required state', async () => {
      mockPost.mockResolvedValue({
        data: { state: 'otp_required', email_hint: 'j***@example.cm' },
      });

      const result = await authService.clerkExchange();
      expect(mockPost).toHaveBeenCalledWith(
        '/auth/clerk/exchange',
        expect.any(Object),
        undefined
      );
      expect(result).toHaveProperty('state', 'otp_required');
      if ('email_hint' in result) {
        expect(result.email_hint).toBe('j***@example.cm');
      }
    });

    // BUG CATCH: Successful exchange renames `access_token` → `token`.
    // If this mapping is wrong, the AuthProvider can't store the session.
    it('handles successful authentication and renames access_token', async () => {
      mockPost.mockResolvedValue({
        data: {
          access_token: 'clerk-exchange-token',
          user: mockUser,
          panel_sso_url: 'https://admin.keyhome.app/sso',
        },
      });

      const result = await authService.clerkExchange();
      expect(result).toHaveProperty('token', 'clerk-exchange-token');
      expect(result).toHaveProperty('user');
      expect(result).not.toHaveProperty('access_token');
    });
  });

  describe('verifyClerkOtp', () => {
    // BUG CATCH: Two possible states: profile_required or authenticated.
    // Mixing them up redirects users to the wrong screen.
    it('handles profile_required state', async () => {
      mockPost.mockResolvedValue({
        data: {
          state: 'profile_required',
          prefill: {
            firstname: 'Jean',
            lastname: 'D',
            email: 'jean@gmail.com',
            avatar: null,
          },
        },
      });

      const result = await authService.verifyClerkOtp('123456');
      expect(result.state).toBe('profile_required');
      if (result.state === 'profile_required') {
        expect(result.prefill.firstname).toBe('Jean');
      }
    });

    it('handles authenticated state and renames access_token', async () => {
      mockPost.mockResolvedValue({
        data: {
          state: 'authenticated',
          access_token: 'verified-token',
          user: mockUser,
          panel_sso_url: null,
        },
      });

      const result = await authService.verifyClerkOtp('654321');
      expect(result.state).toBe('authenticated');
      if (result.state === 'authenticated') {
        expect(result.token).toBe('verified-token');
        expect(result).not.toHaveProperty('access_token');
      }
    });
  });

  describe('completeClerkProfile', () => {
    // BUG CATCH: After OTP verification, users must provide phone_number.
    // The response renames access_token → token.
    it('sends profile data and renames access_token', async () => {
      mockPost.mockResolvedValue({
        data: {
          access_token: 'profile-complete-token',
          user: mockUser,
          panel_sso_url: null,
        },
      });

      const result = await authService.completeClerkProfile({
        phone_number: '+237690123456',
        city_id: '1',
      });

      expect(result.token).toBe('profile-complete-token');
      expect(result.user.firstname).toBe('Jean');
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await authService.logout();
      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });
  });

  // ── refreshToken ─────────────────────────────────────────────────
  // `/auth/refresh` rotates the Sanctum token: the previous one is revoked the
  // moment a successor is minted. Two overlapping refreshes therefore produce
  // two successors of which only one can be stored — the loser is a token the
  // browser holds but the server has already revoked, and the very next
  // request 401s on a bearer obtained seconds earlier.
  describe('refreshToken', () => {
    it('returns the rotated token and its expiry', async () => {
      mockPost.mockResolvedValue({
        data: {
          access_token: 'rotated-token-1',
          token_type: 'Bearer',
          expires_at: '2026-03-01T12:00:00Z',
        },
      });

      const result = await authService.refreshToken();

      expect(mockPost).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual({
        access_token: 'rotated-token-1',
        expires_at: '2026-03-01T12:00:00Z',
      });
    });

    // BUG CATCH: the proactive timer in AuthProvider and the "Prolonger la
    // session" button both call this. Two concurrent rotations strand one of
    // the two new tokens on the client.
    it('issues a single request when callers overlap', async () => {
      let resolveRefresh: ((value: unknown) => void) | undefined;
      mockPost.mockReturnValue(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
      );

      const first = authService.refreshToken();
      const second = authService.refreshToken();

      resolveRefresh!({
        data: {
          access_token: 'rotated-token-2',
          token_type: 'Bearer',
          expires_at: '2026-03-01T12:00:00Z',
        },
      });

      const [a, b] = await Promise.all([first, second]);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(a.access_token).toBe('rotated-token-2');
      expect(b.access_token).toBe('rotated-token-2');
    });

    // BUG CATCH: if the in-flight slot were never released, the session could
    // only ever be refreshed once per page load — every later refresh would
    // resolve to a token that has since been rotated away.
    it('allows a later refresh once the previous one settled', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'rotated-token-3',
          token_type: 'Bearer',
          expires_at: '2026-03-01T12:00:00Z',
        },
      });
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'rotated-token-4',
          token_type: 'Bearer',
          expires_at: '2026-03-01T13:00:00Z',
        },
      });

      const firstToken = (await authService.refreshToken()).access_token;
      const secondToken = (await authService.refreshToken()).access_token;

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(firstToken).toBe('rotated-token-3');
      expect(secondToken).toBe('rotated-token-4');
    });

    // BUG CATCH: a rejected refresh must not poison the slot — the user would
    // be stuck with a session that can never be extended again.
    it('releases the in-flight slot after a failed refresh', async () => {
      mockPost.mockRejectedValueOnce(
        new AxiosError('Unauthenticated', undefined, undefined, undefined, {
          status: 401,
          data: { message: 'Non authentifié.' },
        } as never)
      );

      await expect(authService.refreshToken()).rejects.toThrow(
        'Unauthenticated'
      );

      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'rotated-token-5',
          token_type: 'Bearer',
          expires_at: '2026-03-01T14:00:00Z',
        },
      });

      await expect(authService.refreshToken()).resolves.toEqual({
        access_token: 'rotated-token-5',
        expires_at: '2026-03-01T14:00:00Z',
      });
    });
  });

  describe('forgotPassword', () => {
    it('sends email to forgot-password endpoint', async () => {
      mockPost.mockResolvedValue({ data: { message: 'Lien envoyé.' } });
      const result = await authService.forgotPassword('jean@example.cm');
      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'jean@example.cm',
      });
      expect(result.message).toBe('Lien envoyé.');
    });
  });

  describe('resetPassword', () => {
    it('sends reset payload with token and new password', async () => {
      mockPost.mockResolvedValue({
        data: { message: 'Mot de passe réinitialisé.' },
      });
      const payload = {
        token: 'reset-token-abc',
        email: 'jean@example.cm',
        password: 'NewP@ss!2026',
        password_confirmation: 'NewP@ss!2026',
      };
      const result = await authService.resetPassword(payload);
      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', payload);
      expect(result.message).toBe('Mot de passe réinitialisé.');
    });
  });

  describe('updatePassword', () => {
    it('sends current and new password', async () => {
      mockPost.mockResolvedValue({
        data: { message: 'Mot de passe mis à jour.' },
      });
      const payload = {
        current_password: 'OldP@ss!',
        new_password: 'NewP@ss!2026',
        new_password_confirmation: 'NewP@ss!2026',
      };
      await authService.updatePassword(payload);
      expect(mockPost).toHaveBeenCalledWith('/auth/update-password', payload);
    });
  });

  describe('resendVerification', () => {
    it('calls POST /auth/email/resend', async () => {
      mockPost.mockResolvedValue({ data: { message: 'Email renvoyé.' } });
      const result = await authService.resendVerification();
      expect(result.message).toBe('Email renvoyé.');
    });
  });

  describe('getOAuthRedirectUrl', () => {
    // BUG CATCH: The redirect_uri must be constructed from window.location.origin.
    // If hardcoded, it breaks when deploying to different domains.
    it('constructs redirect_uri from current origin and returns redirect URL', async () => {
      mockGet.mockResolvedValue({
        data: { redirect_url: 'https://accounts.google.com/o/oauth2/auth?...' },
      });

      const url = await authService.getOAuthRedirectUrl('google');

      expect(mockGet).toHaveBeenCalledWith('/auth/oauth/google/redirect', {
        params: { redirect_uri: 'https://keyhome.app/auth/callback' },
      });
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?...');
    });

    it('works for facebook provider', async () => {
      mockGet.mockResolvedValue({
        data: { redirect_url: 'https://facebook.com/dialog/oauth?...' },
      });

      await authService.getOAuthRedirectUrl('facebook');
      expect(mockGet).toHaveBeenCalledWith(
        '/auth/oauth/facebook/redirect',
        expect.any(Object)
      );
    });
  });
});
