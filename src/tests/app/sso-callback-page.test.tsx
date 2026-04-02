import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockHandleRedirectCallback = vi.fn().mockResolvedValue(undefined);
const mockReplace = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ handleRedirectCallback: mockHandleRedirectCallback }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import SSOCallbackPage from '@/app/sso-callback/page';

describe('SSOCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockHandleRedirectCallback.mockResolvedValue(undefined);
  });

  it('passes owner fallbacks when kh_registration_intent is agent', async () => {
    sessionStorage.setItem('kh_registration_intent', 'agent');

    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(mockHandleRedirectCallback).toHaveBeenCalled();
    });

    const arg = mockHandleRedirectCallback.mock.calls[0][0] as {
      signInFallbackRedirectUrl: string;
      signUpFallbackRedirectUrl: string;
    };

    expect(arg.signInFallbackRedirectUrl).toContain('/owner/login');
    expect(arg.signUpFallbackRedirectUrl).toContain('/owner/login');
  });

  it('passes customer fallbacks when intent is not agent', async () => {
    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(mockHandleRedirectCallback).toHaveBeenCalled();
    });

    const arg = mockHandleRedirectCallback.mock.calls[0][0] as {
      signInFallbackRedirectUrl: string;
      signUpFallbackRedirectUrl: string;
    };

    expect(arg.signInFallbackRedirectUrl).toContain('/home');
    expect(arg.signUpFallbackRedirectUrl).toContain('/home');
  });
});
