import { describe, expect, it } from 'vitest';
import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const dummyConfig = {} as InternalAxiosRequestConfig;

describe('getLaravelApiErrorMessage', () => {
  it('returns main message and validation errors from axios response', () => {
    const err = new AxiosError('Request failed with status code 422');
    err.response = {
      data: {
        message: 'Champs invalides.',
        errors: { title: ['Le titre est obligatoire.'], price: ['Invalide'] },
      },
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: dummyConfig,
    };

    const msg = getLaravelApiErrorMessage(err, 'fallback');
    expect(msg).toContain('Champs invalides.');
    expect(msg).toContain('Le titre est obligatoire.');
    expect(msg).toContain('Invalide');
  });

  it('appends debug.message alongside user-facing message when present', () => {
    const err = new AxiosError('Request failed');
    err.response = {
      data: {
        message: 'Une erreur interne est survenue.',
        code: 'SERVER_ERROR',
        debug: { message: 'Meilisearch connection refused' },
      },
      status: 500,
      statusText: 'Error',
      headers: {},
      config: dummyConfig,
    };

    const msg = getLaravelApiErrorMessage(err, 'fb');
    expect(msg).toContain('Une erreur interne est survenue.');
    expect(msg).toContain('Meilisearch connection refused');
  });

  it('uses debug.message when no API message or errors', () => {
    const err = new AxiosError('Request failed with status code 500');
    err.response = {
      data: {
        code: 'SERVER_ERROR',
        debug: { message: 'PDOException in …' },
      },
      status: 500,
      statusText: 'Error',
      headers: {},
      config: dummyConfig,
    };

    expect(getLaravelApiErrorMessage(err, 'fb')).toBe('PDOException in …');
  });

  it('returns fallback for unknown axios errors', () => {
    const err = new AxiosError('Request failed with status code 500');
    err.response = {
      data: null,
      status: 500,
      statusText: 'Error',
      headers: {},
      config: dummyConfig,
    };
    expect(getLaravelApiErrorMessage(err, 'fb')).toBe('fb');
  });

  it('returns non-axios Error message when not generic', () => {
    expect(getLaravelApiErrorMessage(new Error('réseau'), 'fb')).toBe('réseau');
  });

  it('hides Laravel ModelNotFoundException text from API message', () => {
    const err = new AxiosError('Request failed with status code 404');
    err.response = {
      data: {
        message:
          'No query results for model [App\\Models\\Ad] 019e4198-287b-713c-a536-6071afde0104',
        code: 'NOT_FOUND',
      },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: dummyConfig,
    };

    expect(getLaravelApiErrorMessage(err, 'Annonce introuvable.')).toBe(
      'Annonce introuvable.'
    );
  });
});
