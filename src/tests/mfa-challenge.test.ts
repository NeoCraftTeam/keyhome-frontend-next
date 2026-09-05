import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  consumeMfaChallenge,
  extractMfaChallenge,
  forgetMfaChallenge,
  isTerminalMfaError,
  mfaAttemptsRemaining,
  mfaChallengePathFor,
  mfaErrorMessage,
  mfaLoginPathFor,
  mfaRetryAfterSeconds,
  parseMfaChallengePayload,
  peekMfaChallenge,
  rememberMfaChallenge,
  updateMfaChallengeAttempts,
  MFA_CHALLENGE_LOST_MESSAGE,
  MFA_NETWORK_ERROR_MESSAGE,
  type MfaChallengePayload,
} from '@/lib/auth/mfa-challenge';

/** The exact 403 body the API returns when a login owes a second factor. */
const CHALLENGE_BODY = {
  message: 'Vérification en deux étapes requise.',
  mfa_required: true,
  code: 'MFA_CHALLENGE_REQUIRED',
  mfa_token: 'a'.repeat(64),
  methods: ['totp', 'email'],
  has_recovery_codes: true,
  masked_email: 'j***@example.com',
  expires_in_minutes: 10,
  attempts_remaining: 5,
};

function axiosErrorWith(
  status: number,
  data: unknown,
  headers: Record<string, string> = {}
): AxiosError {
  const error = new AxiosError('Request failed');

  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() },
  };

  return error;
}

/** A network failure: `response` is undefined, which must not be treated as a 403. */
function networkError(): AxiosError {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK);
}

const payload: MfaChallengePayload = {
  mfaToken: 'b'.repeat(64),
  methods: ['totp'],
  hasRecoveryCodes: true,
  maskedEmail: 'j***@example.com',
  expiresInMinutes: 10,
  attemptsRemaining: 5,
};

afterEach(() => {
  forgetMfaChallenge();
});

describe('parseMfaChallengePayload', () => {
  it('maps the API body to the typed payload', () => {
    expect(parseMfaChallengePayload(CHALLENGE_BODY)).toEqual({
      mfaToken: CHALLENGE_BODY.mfa_token,
      methods: ['totp', 'email'],
      hasRecoveryCodes: true,
      maskedEmail: 'j***@example.com',
      expiresInMinutes: 10,
      attemptsRemaining: 5,
    });
  });

  // BUG CATCH: a 403 also means `email_verification_required`. Without the
  // `code` discriminator the user would be sent to /verify-2fa with no ticket.
  it('rejects a 403 body that is not an MFA challenge', () => {
    expect(
      parseMfaChallengePayload({
        message: 'Email non vérifié.',
        email_verification_required: true,
        email: 'jane@example.com',
      })
    ).toBeNull();
  });

  it('rejects a challenge without a usable token', () => {
    expect(
      parseMfaChallengePayload({ ...CHALLENGE_BODY, mfa_token: '   ' })
    ).toBeNull();
    expect(
      parseMfaChallengePayload({ ...CHALLENGE_BODY, mfa_token: 42 })
    ).toBeNull();
  });

  // BUG CATCH: an unknown method would render a button the API cannot honour.
  it('drops unknown methods and keeps the known ones in order', () => {
    const parsed = parseMfaChallengePayload({
      ...CHALLENGE_BODY,
      methods: ['sms', 'totp', 'carrier-pigeon', 'recovery'],
    });

    expect(parsed?.methods).toEqual(['totp', 'recovery']);
  });

  it('falls back to safe defaults for missing counters', () => {
    const parsed = parseMfaChallengePayload({
      code: 'MFA_CHALLENGE_REQUIRED',
      mfa_token: 'c'.repeat(64),
    });

    expect(parsed).toMatchObject({
      methods: [],
      hasRecoveryCodes: false,
      maskedEmail: '',
      expiresInMinutes: 10,
      attemptsRemaining: 5,
    });
  });

  it('ignores non-object payloads', () => {
    expect(parseMfaChallengePayload(null)).toBeNull();
    expect(parseMfaChallengePayload('MFA_CHALLENGE_REQUIRED')).toBeNull();
    expect(parseMfaChallengePayload([CHALLENGE_BODY])).toBeNull();
  });
});

describe('extractMfaChallenge', () => {
  it('reads the challenge out of the 403 answer', () => {
    const challenge = extractMfaChallenge(axiosErrorWith(403, CHALLENGE_BODY));

    expect(challenge?.mfaToken).toBe(CHALLENGE_BODY.mfa_token);
  });

  // BUG CATCH: only a 403 carries the ticket. A 401 with a leftover body must
  // not park the user on the challenge page with a token the API refuses.
  it('ignores every other status and non-Axios errors', () => {
    expect(extractMfaChallenge(axiosErrorWith(401, CHALLENGE_BODY))).toBeNull();
    expect(extractMfaChallenge(axiosErrorWith(422, CHALLENGE_BODY))).toBeNull();
    expect(extractMfaChallenge(networkError())).toBeNull();
    expect(extractMfaChallenge(new Error('boom'))).toBeNull();
  });
});

describe('mfaErrorMessage', () => {
  it('maps a known code to its French copy', () => {
    expect(
      mfaErrorMessage(axiosErrorWith(422, { code: 'MFA_INVALID_CODE' }))
    ).toBe('Code incorrect. Vérifiez le code puis réessayez.');
    expect(
      mfaErrorMessage(axiosErrorWith(403, { code: 'MFA_CHALLENGE_INVALID' }))
    ).toBe(MFA_CHALLENGE_LOST_MESSAGE);
  });

  // BUG CATCH: backend strings must never reach the UI verbatim — a message
  // can leak a class name, a route, or whether the account exists.
  it('never echoes the backend message', () => {
    const message = mfaErrorMessage(
      axiosErrorWith(500, {
        message:
          'SQLSTATE[42S02]: Base table or view not found: users at /app/Services/Auth/MfaService.php:120',
      }),
      'Repli lisible.'
    );

    expect(message).toBe('Repli lisible.');
  });

  it('reports a network failure rather than a generic error', () => {
    expect(mfaErrorMessage(networkError())).toBe(MFA_NETWORK_ERROR_MESSAGE);
  });

  it('maps a 429 without a code to the rate-limit copy', () => {
    expect(mfaErrorMessage(axiosErrorWith(429, { message: 'Slow down' }))).toBe(
      'Trop de tentatives. Patientez un instant avant de réessayer.'
    );
  });

  it('falls back for a plain error', () => {
    expect(mfaErrorMessage(new Error('boom'), 'Repli.')).toBe('Repli.');
  });
});

describe('mfaRetryAfterSeconds / mfaAttemptsRemaining / isTerminalMfaError', () => {
  it('reads retry_after from the body, then from the header', () => {
    expect(mfaRetryAfterSeconds(axiosErrorWith(429, { retry_after: 42 }))).toBe(
      42
    );
    expect(
      mfaRetryAfterSeconds(axiosErrorWith(429, {}, { 'retry-after': '17' }))
    ).toBe(17);
    expect(mfaRetryAfterSeconds(axiosErrorWith(429, {}))).toBeNull();
    expect(mfaRetryAfterSeconds(new Error('boom'))).toBeNull();
  });

  // BUG CATCH: 0 is a legitimate value — the last attempt was just spent — and
  // must be distinguishable from "the API did not say".
  it('keeps a zero attempt count but reports an absent one as null', () => {
    expect(
      mfaAttemptsRemaining(axiosErrorWith(422, { attempts_remaining: 0 }))
    ).toBe(0);
    expect(
      mfaAttemptsRemaining(axiosErrorWith(422, { attempts_remaining: 3 }))
    ).toBe(3);
    expect(mfaAttemptsRemaining(axiosErrorWith(422, {}))).toBeNull();
  });

  it('flags the codes that kill the ticket', () => {
    expect(
      isTerminalMfaError(axiosErrorWith(403, { code: 'MFA_CHALLENGE_INVALID' }))
    ).toBe(true);
    expect(
      isTerminalMfaError(
        axiosErrorWith(403, { code: 'MFA_CHALLENGE_EXHAUSTED' })
      )
    ).toBe(true);
    expect(
      isTerminalMfaError(axiosErrorWith(422, { code: 'MFA_INVALID_CODE' }))
    ).toBe(false);
  });
});

describe('mfaChallengePathFor / mfaLoginPathFor', () => {
  it('routes each login surface to its own pages', () => {
    expect(mfaChallengePathFor('client')).toBe('/verify-2fa');
    expect(mfaChallengePathFor('owner')).toBe('/owner/auth/verify-2fa');
    expect(mfaLoginPathFor('client')).toBe('/login');
    expect(mfaLoginPathFor('owner')).toBe('/owner/login');
  });
});

describe('in-memory pending challenge', () => {
  it('remembers the ticket with its login context', () => {
    const stored = rememberMfaChallenge(payload, 'owner');

    expect(stored.context).toBe('owner');
    expect(peekMfaChallenge()).toMatchObject({
      mfaToken: payload.mfaToken,
      context: 'owner',
    });
  });

  it('consumes the ticket exactly once', () => {
    rememberMfaChallenge(payload, 'client');

    expect(consumeMfaChallenge()?.mfaToken).toBe(payload.mfaToken);
    expect(consumeMfaChallenge()).toBeNull();
    expect(peekMfaChallenge()).toBeNull();
  });

  it('forgets the ticket when the challenge is abandoned', () => {
    rememberMfaChallenge(payload, 'client');
    forgetMfaChallenge();

    expect(peekMfaChallenge()).toBeNull();
  });

  it('keeps the attempt counter in sync and never goes negative', () => {
    rememberMfaChallenge(payload, 'client');

    expect(updateMfaChallengeAttempts(2)?.attemptsRemaining).toBe(2);
    expect(updateMfaChallengeAttempts(-5)?.attemptsRemaining).toBe(0);
    expect(peekMfaChallenge()?.attemptsRemaining).toBe(0);
  });

  it('cannot update the counter once the ticket is gone', () => {
    expect(updateMfaChallengeAttempts(3)).toBeNull();
  });

  // BUG CATCH: the UI must not offer a ticket the API has already expired —
  // the store adds a small grace so it never expires *before* the server.
  it('expires the ticket after its TTL plus the grace period', () => {
    vi.useFakeTimers();

    try {
      rememberMfaChallenge({ ...payload, expiresInMinutes: 1 }, 'client');

      vi.advanceTimersByTime(60_000 + 29_000);
      expect(peekMfaChallenge()).not.toBeNull();

      vi.advanceTimersByTime(2_000);
      expect(peekMfaChallenge()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
