import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  explainPasskeyUnsupported,
  formatWebAuthnClientError,
  isLocalhostLikeHostname,
} from '@/lib/auth/passkey-support';

describe('isLocalhostLikeHostname', () => {
  it.each([
    ['localhost', true],
    ['127.0.0.1', true],
    ['app.localhost', true],
    ['keyhome.test', true],
    ['sub.keyhome.test', true],
    ['keyhome.app', false],
    ['192.168.1.1', false],
  ])('%s → %s', (host, expected) => {
    expect(isLocalhostLikeHostname(host)).toBe(expected);
  });
});

describe('explainPasskeyUnsupported', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mentions HTTPS when context is not secure and host is not dev-like', () => {
    const locationGetter = vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'example.com',
    } as Location);

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });

    expect(explainPasskeyUnsupported()).toContain('HTTPS');

    locationGetter.mockRestore();
    Reflect.deleteProperty(window, 'isSecureContext');
  });

  it('mentions browser when WebAuthn primitives are missing', () => {
    const locationGetter = vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'localhost',
    } as Location);

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });

    const pk = globalThis.PublicKeyCredential;
    // @ts-expect-error test stub
    globalThis.PublicKeyCredential = undefined;

    const msg = explainPasskeyUnsupported();
    expect(msg).toMatch(/navigateur|WebAuthn/i);

    globalThis.PublicKeyCredential = pk;
    locationGetter.mockRestore();
    Reflect.deleteProperty(window, 'isSecureContext');
  });
});

describe('formatWebAuthnClientError', () => {
  it('maps known DOMException names to French copy', () => {
    expect(
      formatWebAuthnClientError({ name: 'NotAllowedError' }, 'fallback')
    ).toContain('annulée');

    expect(
      formatWebAuthnClientError({ name: 'InvalidStateError' }, 'fallback')
    ).toContain('déjà');

    expect(
      formatWebAuthnClientError({ name: 'NotSupportedError' }, 'f')
    ).toContain('non prise en charge');

    expect(formatWebAuthnClientError({ name: 'SecurityError' }, 'f')).toContain(
      'sécurité'
    );

    expect(formatWebAuthnClientError({ name: 'AbortError' }, 'f')).toContain(
      'interrompue'
    );
  });

  it('returns Error message when name is unknown', () => {
    expect(formatWebAuthnClientError(new Error('  custom  '), 'fallback')).toBe(
      'custom'
    );
  });

  it('returns fallback for non-Error unknown values', () => {
    expect(formatWebAuthnClientError(null, 'fb')).toBe('fb');
    expect(formatWebAuthnClientError({ name: 'UnknownDomError' }, 'fb')).toBe(
      'fb'
    );
  });
});
