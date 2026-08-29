import { describe, expect, it } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  getSafeErrorMessage,
  isUnsafeBackendMessage,
} from '@/lib/error-messages';

const dummyConfig = {} as InternalAxiosRequestConfig;

function axiosWith(data: unknown, status: number): AxiosError {
  const err = new AxiosError(`Request failed with status code ${status}`);
  err.response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: dummyConfig,
  };
  return err;
}

describe('isUnsafeBackendMessage', () => {
  it('flags backend internals (routes, SQL, stack, infra names)', () => {
    expect(isUnsafeBackendMessage('Route [api/v1/ads] not found')).toBe(true);
    expect(isUnsafeBackendMessage('SQLSTATE[42S02] no such table')).toBe(true);
    expect(
      isUnsafeBackendMessage('Call to undefined method App\\Models\\Ad::foo()')
    ).toBe(true);
    expect(isUnsafeBackendMessage('Meilisearch connection refused')).toBe(true);
  });

  it('allows clean, user-facing French copy', () => {
    expect(
      isUnsafeBackendMessage('Ce créneau n’est pas disponible pour cette date.')
    ).toBe(false);
    expect(isUnsafeBackendMessage('Votre réservation a été enregistrée.')).toBe(
      false
    );
  });
});

describe('getSafeErrorMessage', () => {
  it('surfaces a flat domain envelope with its hint', () => {
    const err = axiosWith(
      {
        code: 'SLOT_NOT_AVAILABLE',
        message: 'Ce créneau n’est pas disponible pour la date demandée.',
        hint: 'Ce créneau n’existe pas ou la date est passée.',
      },
      410
    );

    expect(getSafeErrorMessage(err)).toBe(
      'Ce créneau n’est pas disponible pour la date demandée. · Ce créneau n’existe pas ou la date est passée.'
    );
  });

  it('surfaces a legacy nested domain envelope', () => {
    const err = axiosWith(
      {
        error: {
          code: 'SLOT_ALREADY_RESERVED',
          message: 'Ce créneau vient d’être réservé.',
        },
      },
      409
    );

    expect(getSafeErrorMessage(err)).toBe('Ce créneau vient d’être réservé.');
  });

  it('never surfaces a leaky-auth envelope even when it carries a code', () => {
    const err = axiosWith(
      {
        code: 'PANEL_ACCESS_DENIED',
        message: 'Accès réservé aux propriétaires.',
      },
      403
    );

    const msg = getSafeErrorMessage(err);
    expect(msg).not.toContain('réservé');
    expect(msg).toBe(
      "Vous n'avez pas l'autorisation d'effectuer cette action."
    );
  });

  it('drops an unsafe backend message and falls back to the status copy', () => {
    const err = axiosWith(
      { message: 'SQLSTATE[42000] syntax error near "SELECT"' },
      500
    );

    expect(getSafeErrorMessage(err)).toBe(
      "Une erreur inattendue s'est produite. Notre équipe a été notifiée."
    );
  });

  it('returns the network/timeout copy when no response is received', () => {
    const err = new AxiosError('timeout of 0ms exceeded', 'ECONNABORTED');
    expect(getSafeErrorMessage(err)).toContain(
      'Impossible de contacter le serveur'
    );
  });

  it('returns a clean non-axios Error message but hides unsafe ones', () => {
    expect(getSafeErrorMessage(new Error('Opération impossible.'), 'fb')).toBe(
      'Opération impossible.'
    );
    expect(
      getSafeErrorMessage(new Error('PDOException in /app/foo.php'), 'fb')
    ).toBe('fb');
  });
});
