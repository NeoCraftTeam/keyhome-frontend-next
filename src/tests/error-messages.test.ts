import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getSafeErrorMessage } from '@/lib/error-messages';

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
});
