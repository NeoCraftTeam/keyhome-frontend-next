import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom doesn't ship IntersectionObserver — framer-motion's viewport features
// need it to mount. We register a no-op stub before importing the component.
class IOStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (
    globalThis as unknown as { IntersectionObserver: typeof IOStub }
  ).IntersectionObserver = IOStub;
}

import NewsletterSection from '@/components/landing/NewsletterSection';

// Stable env (avoids any host-specific URL prefix flake)
const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_URL;

describe('NewsletterSection', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL_ENV;
  });

  it('renders the email field with French labels', () => {
    render(<NewsletterSection />);
    expect(
      screen.getByLabelText(/adresse e-mail pour la newsletter/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /s'abonner/i })
    ).toBeInTheDocument();
  });

  it('rejects an invalid email format without calling the API', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<NewsletterSection />);
    const input = screen.getByLabelText(
      /adresse e-mail pour la newsletter/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalide/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the success state after a successful subscribe', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' }),
        } as unknown as Response)
      )
    );

    render(<NewsletterSection />);
    const input = screen.getByLabelText(
      /adresse e-mail pour la newsletter/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  hello@keyhome.app  ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /inscription réussie/i
      );
    });
  });

  it('surfaces a server-provided error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: 'Cet e-mail est déjà abonné.',
            }),
        } as unknown as Response)
      )
    );

    render(<NewsletterSection />);
    const input = screen.getByLabelText(
      /adresse e-mail pour la newsletter/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'duplicate@keyhome.app' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà abonné/i);
  });
});
