import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
import { mfaService } from '@/services/mfa.service';
import type { User } from '@/types';
import { UserRole } from '@/types';

const mockedApi = vi.mocked(api);
const mockGet = mockedApi.get as Mock;
const mockPost = mockedApi.post as Mock;

const USER = {
  id: 7,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: UserRole.CUSTOMER,
} as unknown as User;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mfaService enrolment', () => {
  it('reads the enrolment status', async () => {
    mockGet.mockResolvedValue({
      data: {
        mfa_required: false,
        mfa_configured: true,
        mfa_verified: true,
        methods: ['totp'],
        recovery_codes_remaining: 8,
      },
    });

    const status = await mfaService.status();

    expect(mockGet).toHaveBeenCalledWith('/auth/mfa/status');
    expect(status.methods).toEqual(['totp']);
    expect(status.recovery_codes_remaining).toBe(8);
  });

  it('starts a TOTP setup without a body', async () => {
    mockPost.mockResolvedValue({
      data: {
        secret: 'JBSWY3DPEHPK3PXP',
        otpauth_url:
          'otpauth://totp/KeyHome:jane%40example.com?secret=JBSWY3DPEHPK3PXP',
        qr_code: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        holder: 'jane@example.com',
        company: 'KeyHome',
        expires_in_minutes: 10,
      },
    });

    const setup = await mfaService.startTotp();

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/totp/start');
    expect(setup.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(setup.qr_code).toContain('data:image/svg+xml;base64,');
  });

  // BUG CATCH: the QR render is server-side and may fail; the card must still
  // be able to offer the manual key, so `null` has to survive typing.
  it('accepts a null QR code', async () => {
    mockPost.mockResolvedValue({
      data: {
        secret: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/KeyHome:jane%40example.com',
        qr_code: null,
        holder: 'jane@example.com',
        company: 'KeyHome',
        expires_in_minutes: 10,
      },
    });

    expect((await mfaService.startTotp()).qr_code).toBeNull();
  });

  it('confirms the pending secret and returns the one-time recovery codes', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Vérification en deux étapes activée.',
        mfa_method: 'totp',
        recovery_codes: ['ABCDE-FGHJK', 'MNPQR-STUVW'],
      },
    });

    const result = await mfaService.confirmTotp('123456');

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/totp/confirm', {
      code: '123456',
    });
    expect(result.recovery_codes).toHaveLength(2);
  });

  it('disables the TOTP with the submitted code', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Désactivée.', mfa_method: 'totp', disabled: true },
    });

    await mfaService.disableTotp('ABCDE-FGHJK');

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/totp/disable', {
      code: 'ABCDE-FGHJK',
    });
  });

  it('regenerates the recovery codes', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Nouveaux codes.',
        mfa_method: 'totp',
        recovery_codes: ['11111-22222'],
      },
    });

    await mfaService.regenerateRecoveryCodes('654321');

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/mfa/setup/totp/recovery-codes/regenerate',
      { code: '654321' }
    );
  });
});

describe('mfaService email second factor', () => {
  it('mails a code with no body, then confirms with one', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Envoyé.', code_sent: true },
    });
    await mfaService.enableEmail();
    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/email/enable');

    mockPost.mockResolvedValue({
      data: { message: 'Activée.', mfa_method: 'email' },
    });
    await mfaService.confirmEmail('123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/email/confirm', {
      code: '123456',
    });
  });

  // BUG CATCH: the disable endpoint is two-step. Sending `{ code: undefined }`
  // instead of `{}` would make the API believe a code was submitted.
  it('omits the code entirely on the first disable call', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Envoyé.', code_sent: true },
    });

    await mfaService.disableEmail();

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/setup/email/disable', {});

    mockPost.mockResolvedValue({
      data: { message: 'Désactivée.', mfa_method: 'email', disabled: true },
    });

    await mfaService.disableEmail('123456');

    expect(mockPost).toHaveBeenLastCalledWith('/auth/mfa/setup/email/disable', {
      code: '123456',
    });
  });

  it('steps a token up, with or without a code', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Envoyé.', code_sent: true },
    });
    await mfaService.verifyStepUp('email');
    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/verify', {
      method: 'email',
    });

    mockPost.mockResolvedValue({
      data: {
        message: 'Vérifié.',
        mfa_verified: true,
        mfa_method: 'totp',
        recovery_codes_remaining: 8,
        expires_in_minutes: 15,
      },
    });
    await mfaService.verifyStepUp('totp', '123456');
    expect(mockPost).toHaveBeenLastCalledWith('/auth/mfa/verify', {
      method: 'totp',
      code: '123456',
    });
  });
});

describe('mfaService.completeChallenge', () => {
  it('posts the ticket and the code, and unwraps the user', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Connexion réussie.',
        access_token: 'sanctum-token',
        token: 'sanctum-token',
        expires_at: '2026-09-12T10:00:00+00:00',
        role: UserRole.CUSTOMER,
        type: null,
        user: { data: USER },
        is_new_user: false,
        mfa_method: 'totp',
        recovery_codes_remaining: 7,
        panel_sso_url: null,
      },
    });

    const result = await mfaService.completeChallenge('t'.repeat(64), '123456');

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/challenge', {
      mfa_token: 't'.repeat(64),
      code: '123456',
    });
    expect(result.user.email).toBe('jane@example.com');
  });

  it('accepts a user that is not wrapped in `data`', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Connexion réussie.',
        access_token: 'sanctum-token',
        token: 'sanctum-token',
        expires_at: null,
        role: UserRole.CUSTOMER,
        type: null,
        user: USER,
        is_new_user: false,
        mfa_method: 'recovery',
        recovery_codes_remaining: 6,
        panel_sso_url: null,
      },
    });

    const result = await mfaService.completeChallenge(
      't'.repeat(64),
      'ABCDE-FGHJK',
      'recovery'
    );

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/challenge', {
      mfa_token: 't'.repeat(64),
      method: 'recovery',
      code: 'ABCDE-FGHJK',
    });
    expect(result.user.email).toBe('jane@example.com');
  });

  it('asks for a fresh emailed code with the email method only', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Code envoyé.',
        code_sent: true,
        masked_email: 'j***@example.com',
      },
    });

    const result = await mfaService.sendChallengeEmailCode('t'.repeat(64));

    expect(mockPost).toHaveBeenCalledWith('/auth/mfa/challenge', {
      mfa_token: 't'.repeat(64),
      method: 'email',
    });
    expect(result.masked_email).toBe('j***@example.com');
  });
});
