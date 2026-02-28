import { getSafeErrorMessage } from '@/lib/error-messages';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

function makeAxiosError(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
    statusText: String(status),
  } as AxiosResponse;

  const error = new AxiosError('Request failed', String(status), {} as InternalAxiosRequestConfig, null, response);
  return error;
}

describe('getSafeErrorMessage', () => {
  it('returns fallback for non-Axios errors', () => {
    expect(getSafeErrorMessage(new Error(), 'Fallback')).toBe('Fallback');
  });

  it('returns the error message for plain Error instances', () => {
    expect(getSafeErrorMessage(new Error('Compte inexistant'))).toBe('Compte inexistant');
  });

  it('returns Laravel validation error messages (422)', () => {
    const err = makeAxiosError(422, {
      errors: { email: ['Email déjà utilisé.'], phone_number: ['Numéro invalide.'] },
    });
    const msg = getSafeErrorMessage(err);
    expect(msg).toContain('Email déjà utilisé.');
    expect(msg).toContain('Numéro invalide.');
  });

  it('returns .message from 422 response when no errors array', () => {
    const err = makeAxiosError(422, { message: 'Champ requis.' });
    expect(getSafeErrorMessage(err)).toBe('Champ requis.');
  });

  it('returns .message for 401 responses', () => {
    const err = makeAxiosError(401, { message: 'Non authentifié.' });
    expect(getSafeErrorMessage(err)).toBe('Non authentifié.');
  });

  it('returns .message for 403 responses', () => {
    const err = makeAxiosError(403, { message: 'Accès refusé.' });
    expect(getSafeErrorMessage(err)).toBe('Accès refusé.');
  });

  it('returns .message for 500 responses', () => {
    const err = makeAxiosError(500, { message: 'Erreur serveur.' });
    expect(getSafeErrorMessage(err)).toBe('Erreur serveur.');
  });

  it('returns fallback when response has no message', () => {
    const err = makeAxiosError(500, {});
    expect(getSafeErrorMessage(err, 'Défaut')).toBe('Défaut');
  });

  // BUG CATCH: `null` slipping through as error argument should not crash
  // the error handler. It must return the fallback.
  it('returns fallback for null error', () => {
    expect(getSafeErrorMessage(null)).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  // BUG CATCH: `undefined` error must be handled gracefully.
  it('returns fallback for undefined error', () => {
    expect(getSafeErrorMessage(undefined)).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  // BUG CATCH: A string thrown (e.g., `throw "something went wrong"`)
  // should return the fallback, not crash.
  it('returns fallback for string error', () => {
    expect(getSafeErrorMessage('string error', 'Fallback')).toBe('Fallback');
  });

  // BUG CATCH: Network errors (no internet) have no response object.
  // AxiosError extends Error, so error.message is returned via the
  // `instanceof Error` branch — NOT the custom fallback.
  it('returns AxiosError.message for network errors (no response)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    // No response attached — falls through to instanceof Error branch
    expect(getSafeErrorMessage(error, 'Réseau indisponible')).toBe('Network Error');
  });

  // BUG CATCH: 422 with empty errors object should fall through to
  // the message field or fallback, not return empty string.
  it('handles 422 with empty errors object', () => {
    const err = makeAxiosError(422, { errors: {} });
    expect(getSafeErrorMessage(err)).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  // BUG CATCH: 404 responses should return the API message.
  it('returns .message for 404 responses', () => {
    const err = makeAxiosError(404, { message: 'Annonce introuvable.' });
    expect(getSafeErrorMessage(err)).toBe('Annonce introuvable.');
  });

  // BUG CATCH: The default fallback (no custom fallback) must be the French message.
  it('uses the default French error message when no fallback is provided', () => {
    expect(getSafeErrorMessage({})).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  // BUG CATCH: Error with an empty .message value should return fallback.
  it('returns fallback for Error with empty message', () => {
    expect(getSafeErrorMessage(new Error(''))).toBe('Une erreur est survenue. Veuillez réessayer.');
  });
});
