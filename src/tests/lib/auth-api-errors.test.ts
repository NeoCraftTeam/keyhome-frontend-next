import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it } from 'vitest';

import {
  AUTH_LOGIN_FAILURE_MESSAGE,
  AUTH_PANEL_UNAVAILABLE_MESSAGE,
  getAuthApiErrorMessage,
  isLeakyAuthMessage,
  messageForAuthErrorCode,
} from '@/lib/auth-api-errors';

function makeAxiosError(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
    statusText: String(status),
  } as AxiosResponse;

  return new AxiosError(
    'Request failed',
    String(status),
    {} as InternalAxiosRequestConfig,
    null,
    response
  );
}

describe('auth-api-errors', () => {
  it('flags leaky role/panel strings', () => {
    expect(isLeakyAuthMessage('Utilisez le panneau administrateur.')).toBe(
      true
    );
    expect(isLeakyAuthMessage('Accès réservé aux clients.')).toBe(true);
    expect(isLeakyAuthMessage(AUTH_LOGIN_FAILURE_MESSAGE)).toBe(false);
  });

  it('maps PANEL_ACCESS_DENIED to login-safe copy on login context', () => {
    expect(messageForAuthErrorCode('PANEL_ACCESS_DENIED', 'login')).toBe(
      AUTH_LOGIN_FAILURE_MESSAGE
    );
    expect(messageForAuthErrorCode('PANEL_ACCESS_DENIED', 'panel')).toBe(
      AUTH_PANEL_UNAVAILABLE_MESSAGE
    );
  });

  it('returns generic login message for admin owner login API error', () => {
    const err = makeAxiosError(401, {
      code: 'PANEL_ACCESS_DENIED',
      message: 'Utilisez le panneau administrateur.',
    });

    expect(getAuthApiErrorMessage(err, 'login')).toBe(
      AUTH_LOGIN_FAILURE_MESSAGE
    );
  });

  it('falls back to login message on 401 without code', () => {
    const err = makeAxiosError(401, {});

    expect(getAuthApiErrorMessage(err, 'login')).toBe(
      AUTH_LOGIN_FAILURE_MESSAGE
    );
  });
});
