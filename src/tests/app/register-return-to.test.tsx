import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams(
  'redirect=%2Fads%2Fstudio-douala%3Fsource%3Dsearch'
);

vi.mock('next/navigation', () => ({
  usePathname: () => '/register',
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/lib/city-autocomplete-config', () => ({
  useCityAutocompleteConfig: () => ({
    slotProps: {},
    renderOption: undefined,
    inputSx: {},
  }),
}));

vi.mock('@/hooks/useTurnstileEmailSubmitReady', () => ({
  useTurnstileEmailSubmitReady: () => ({
    siteKey: null,
    turnstileEnabled: false,
    emailPasswordReady: true,
  }),
}));

vi.mock('@/components/auth/AuthFlowStepper', () => ({ default: () => null }));
vi.mock('@/components/auth/SocialLoginButtons', () => ({
  default: () => null,
}));
vi.mock('@/components/auth/TurnstileConfigAlert', () => ({
  default: () => null,
}));
vi.mock('@/components/auth/TurnstileWidget', () => ({ default: () => null }));
vi.mock('@/components/ui/forms/PhoneField', () => ({ default: () => null }));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target: object, tag: string) => {
        const MotionElement = React.forwardRef<
          HTMLElement,
          Record<string, unknown> & { children?: React.ReactNode }
        >(({ children, initial, animate, exit, transition, ...props }, ref) => {
          void initial;
          void animate;
          void exit;
          void transition;

          return React.createElement(
            tag,
            { ...props, ref },
            children as React.ReactNode
          );
        });
        MotionElement.displayName = `MotionElement(${tag})`;

        return MotionElement;
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  MotionConfig: ({ children }: { children: React.ReactNode }) => children,
}));

import RegisterPage from '@/app/(auth)/register/page';

describe('RegisterPage return destination', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams(
      'redirect=%2Fads%2Fstudio-douala%3Fsource%3Dsearch'
    );
  });

  it('keeps the protected destination before removing auth query parameters', async () => {
    render(<RegisterPage />);

    await waitFor(() => {
      expect(sessionStorage.getItem('kh_redirect_after_login')).toBe(
        '/ads/studio-douala?source=search'
      );
    });

    expect(mockReplace).toHaveBeenCalledWith('/register', { scroll: false });
  });

  it('rejects an external post-registration destination', async () => {
    mockSearchParams = new URLSearchParams(
      'redirect=https%3A%2F%2Fevil.example%2Fphishing'
    );

    render(<RegisterPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register', { scroll: false });
    });

    expect(sessionStorage.getItem('kh_redirect_after_login')).toBeNull();
  });

  it('does not leak an owner destination into the visitor registration flow', async () => {
    mockSearchParams = new URLSearchParams('redirect=%2Fowner%2Fdashboard');

    render(<RegisterPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register', { scroll: false });
    });

    expect(sessionStorage.getItem('kh_redirect_after_login')).toBeNull();
  });
});
