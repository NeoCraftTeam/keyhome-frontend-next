import api from '@/lib/api';
import type { MfaMethod } from '@/lib/auth/mfa-challenge';
import type { User, UserRole } from '@/types';

/**
 * Every `/auth/mfa/*` endpoint, typed exactly as the Laravel API answers.
 *
 * Errors are left to propagate as `AxiosError` — callers turn them into copy
 * with `mfaErrorMessage()` so no backend string ever reaches the UI verbatim.
 */

// ── Enrolment state ──────────────────────────────────────────────────────────

export interface MfaStatusResponse {
  /** True when the account's role *must* carry a second factor (admins). */
  mfa_required: boolean;
  mfa_configured: boolean;
  /** True when the current Sanctum token already cleared a second factor. */
  mfa_verified: boolean;
  methods: MfaMethod[];
  recovery_codes_remaining: number;
}

export interface TotpSetupStartResponse {
  secret: string;
  otpauth_url: string;
  /** `data:image/svg+xml;base64,…` — null when the server-side render failed. */
  qr_code: string | null;
  holder: string;
  company: string;
  expires_in_minutes: number;
}

export interface RecoveryCodesResponse {
  message: string;
  mfa_method: 'totp';
  /** Plaintext, shown exactly once — the API only keeps hashes. */
  recovery_codes: string[];
}

export interface MfaDisabledResponse {
  message: string;
  mfa_method: MfaMethod;
  disabled: true;
}

export interface MfaCodeSentResponse {
  message: string;
  code_sent: true;
  /** `j***@example.com` — the API never returns the full address pre-auth. */
  masked_email?: string;
  retry_after?: number;
}

export interface MfaMethodConfirmedResponse {
  message: string;
  mfa_method: MfaMethod;
}

export interface MfaStepUpResponse {
  message: string;
  mfa_verified: true;
  mfa_method: MfaMethod;
  recovery_codes_remaining: number;
  expires_in_minutes: number;
}

/** 200 body of `POST /auth/mfa/challenge` — a full login response. */
export interface MfaChallengeSuccessResponse {
  message: string;
  access_token: string;
  /** Alias of `access_token` kept for the mobile/OAuth clients. */
  token: string;
  expires_at: string | null;
  role: UserRole;
  type: string | null;
  user: User;
  is_new_user: boolean;
  mfa_method: MfaMethod;
  recovery_codes_remaining: number;
  panel_sso_url: string | null;
}

/** `UserResource` may or may not arrive wrapped in `data` depending on config. */
function unwrapUser(raw: User | { data: User }): User {
  const candidate = raw as User & { data?: User };

  return candidate.data ?? candidate;
}

export const mfaService = {
  // ── Status ─────────────────────────────────────────────────────────────

  async status(): Promise<MfaStatusResponse> {
    const { data } = await api.get<MfaStatusResponse>('/auth/mfa/status');

    return data;
  },

  // ── TOTP enrolment (authenticated) ─────────────────────────────────────

  /** Mints a *pending* secret; nothing is persisted until `confirmTotp`. */
  async startTotp(): Promise<TotpSetupStartResponse> {
    const { data } = await api.post<TotpSetupStartResponse>(
      '/auth/mfa/setup/totp/start'
    );

    return data;
  },

  /** Persists the pending secret and returns the one-time recovery codes. */
  async confirmTotp(code: string): Promise<RecoveryCodesResponse> {
    const { data } = await api.post<RecoveryCodesResponse>(
      '/auth/mfa/setup/totp/confirm',
      { code }
    );

    return data;
  },

  /** Accepts a TOTP **or** a recovery code — a lost authenticator must not lock. */
  async disableTotp(code: string): Promise<MfaDisabledResponse> {
    const { data } = await api.post<MfaDisabledResponse>(
      '/auth/mfa/setup/totp/disable',
      { code }
    );

    return data;
  },

  async regenerateRecoveryCodes(code: string): Promise<RecoveryCodesResponse> {
    const { data } = await api.post<RecoveryCodesResponse>(
      '/auth/mfa/setup/totp/recovery-codes/regenerate',
      { code }
    );

    return data;
  },

  // ── Email second factor (authenticated) ────────────────────────────────

  /** 202 — mails a 6-digit code, the flag is flipped by `confirmEmail`. */
  async enableEmail(): Promise<MfaCodeSentResponse> {
    const { data } = await api.post<MfaCodeSentResponse>(
      '/auth/mfa/setup/email/enable'
    );

    return data;
  },

  async confirmEmail(code: string): Promise<MfaMethodConfirmedResponse> {
    const { data } = await api.post<MfaMethodConfirmedResponse>(
      '/auth/mfa/setup/email/confirm',
      { code }
    );

    return data;
  },

  /**
   * Two-step: no `code` mails one (202), then the same call with the code
   * flips the flag off (200). `'disabled' in data` tells the two apart.
   */
  async disableEmail(
    code?: string
  ): Promise<MfaCodeSentResponse | MfaDisabledResponse> {
    const { data } = await api.post<MfaCodeSentResponse | MfaDisabledResponse>(
      '/auth/mfa/setup/email/disable',
      code ? { code } : {}
    );

    return data;
  },

  // ── Step-up on an already-authenticated token ──────────────────────────

  /**
   * Marks the *current* Sanctum token as MFA-verified. `method` is a hint only:
   * a recovery code passed as `totp` is still accepted.
   */
  async verifyStepUp(
    method: MfaMethod,
    code?: string
  ): Promise<MfaStepUpResponse | MfaCodeSentResponse> {
    const { data } = await api.post<MfaStepUpResponse | MfaCodeSentResponse>(
      '/auth/mfa/verify',
      code ? { method, code } : { method }
    );

    return data;
  },

  // ── Login challenge (unauthenticated, `mfa_token` only) ────────────────

  /**
   * Finishes a login parked behind a second factor. Returns the Sanctum token,
   * so it is the only call whose failure must never be retried silently: each
   * wrong code spends one of the ticket's attempts.
   */
  async completeChallenge(
    mfaToken: string,
    code: string,
    method?: MfaMethod
  ): Promise<MfaChallengeSuccessResponse> {
    const { data } = await api.post<MfaChallengeSuccessResponse>(
      '/auth/mfa/challenge',
      method
        ? { mfa_token: mfaToken, method, code }
        : { mfa_token: mfaToken, code }
    );

    return { ...data, user: unwrapUser(data.user) };
  },

  /** 202 — mails a code for a challenge whose second factor is email. */
  async sendChallengeEmailCode(mfaToken: string): Promise<MfaCodeSentResponse> {
    const { data } = await api.post<MfaCodeSentResponse>(
      '/auth/mfa/challenge',
      {
        mfa_token: mfaToken,
        method: 'email',
      }
    );

    return data;
  },
};
