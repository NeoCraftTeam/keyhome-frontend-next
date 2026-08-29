import { describe, expect, it } from 'vitest';
import {
  getLaravelNestedApiError,
  getLaravelNestedApiErrorCode,
  parseLaravelNestedApiErrorPayload,
} from '@/lib/api-errors';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const dummyConfig = {} as InternalAxiosRequestConfig;

function axiosWith(data: unknown, status = 409): AxiosError {
  const err = new AxiosError(`Request failed with status code ${status}`);
  err.response = {
    data,
    status,
    statusText: 'Conflict',
    headers: {},
    config: dummyConfig,
  };
  return err;
}

describe('parseLaravelNestedApiErrorPayload', () => {
  it('parses the legacy nested { error: { code, message, hint } } shape', () => {
    const parsed = parseLaravelNestedApiErrorPayload({
      error: {
        code: 'SLOT_NOT_AVAILABLE',
        message: 'Ce créneau n’est pas disponible.',
        hint: 'Choisissez un autre horaire.',
      },
    });

    expect(parsed).toEqual({
      code: 'SLOT_NOT_AVAILABLE',
      message: 'Ce créneau n’est pas disponible.',
      hint: 'Choisissez un autre horaire.',
    });
  });

  it('parses the flat top-level { code, message, hint } envelope', () => {
    const parsed = parseLaravelNestedApiErrorPayload({
      code: 'SLOT_NOT_AVAILABLE',
      message: 'Ce créneau n’est pas disponible.',
      hint: 'Choisissez un autre horaire.',
    });

    expect(parsed).toEqual({
      code: 'SLOT_NOT_AVAILABLE',
      message: 'Ce créneau n’est pas disponible.',
      hint: 'Choisissez un autre horaire.',
    });
  });

  it('drops an empty hint to undefined on the flat envelope', () => {
    const parsed = parseLaravelNestedApiErrorPayload({
      code: 'SLOT_ALREADY_RESERVED',
      message: 'Créneau déjà réservé.',
      hint: '   ',
    });

    expect(parsed).toEqual({
      code: 'SLOT_ALREADY_RESERVED',
      message: 'Créneau déjà réservé.',
      hint: undefined,
    });
  });

  it('returns null for a generic { message } body without a code', () => {
    expect(
      parseLaravelNestedApiErrorPayload({ message: 'Champs invalides.' })
    ).toBeNull();
  });

  it('returns null for a validation { message, errors } body without a code', () => {
    expect(
      parseLaravelNestedApiErrorPayload({
        message: 'Champs invalides.',
        errors: { title: ['Le titre est obligatoire.'] },
      })
    ).toBeNull();
  });

  it('returns null when the flat code is blank', () => {
    expect(
      parseLaravelNestedApiErrorPayload({ code: '   ', message: 'Erreur.' })
    ).toBeNull();
  });

  it('returns null when the nested envelope carries no message', () => {
    expect(
      parseLaravelNestedApiErrorPayload({ error: { code: 'X' } })
    ).toBeNull();
  });

  it('returns null for null, arrays and non-objects', () => {
    expect(parseLaravelNestedApiErrorPayload(null)).toBeNull();
    expect(parseLaravelNestedApiErrorPayload([{ code: 'X' }])).toBeNull();
    expect(parseLaravelNestedApiErrorPayload('nope')).toBeNull();
  });
});

describe('getLaravelNestedApiError / getLaravelNestedApiErrorCode', () => {
  it('reads the flat envelope from an Axios error response', () => {
    const err = axiosWith({
      code: 'CLIENT_ACTIVE_RESERVATION_EXISTS',
      message: 'Vous avez déjà une réservation active.',
    });

    expect(getLaravelNestedApiError(err)?.message).toBe(
      'Vous avez déjà une réservation active.'
    );
    expect(getLaravelNestedApiErrorCode(err)).toBe(
      'CLIENT_ACTIVE_RESERVATION_EXISTS'
    );
  });

  it('still reads the legacy nested envelope from an Axios error response', () => {
    const err = axiosWith({
      error: { code: 'SELF_RESERVATION_NOT_ALLOWED', message: 'Interdit.' },
    });

    expect(getLaravelNestedApiErrorCode(err)).toBe(
      'SELF_RESERVATION_NOT_ALLOWED'
    );
  });

  it('returns null for a non-axios error and for a code-less body', () => {
    expect(getLaravelNestedApiError(new Error('boom'))).toBeNull();
    expect(getLaravelNestedApiErrorCode(new Error('boom'))).toBeNull();
    expect(
      getLaravelNestedApiErrorCode(axiosWith({ message: 'Sans code.' }))
    ).toBeNull();
  });
});
