import CreditsWidget from '@/components/layout/CreditsWidget';
import { creditsService } from '@/services/credits.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      point_balance: 12,
      onboarding_completed_at: '2026-08-19T00:00:00Z',
    },
  }),
}));

vi.mock('@/components/ui/overlay/PurchaseCreditsModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="credits-modal" /> : null,
}));

vi.mock('@/services/credits.service', () => ({
  creditsService: { getBalance: vi.fn() },
}));

function renderWidget() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CreditsWidget />
    </QueryClientProvider>
  );
}

describe('CreditsWidget', () => {
  beforeEach(() => {
    vi.mocked(creditsService.getBalance).mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows the authenticated user balance instead of a false zero while syncing', () => {
    vi.mocked(creditsService.getBalance).mockReturnValue(
      new Promise<number>(() => undefined)
    );

    renderWidget();

    expect(
      screen.getByRole('button', { name: /solde de crédits : 12/i })
    ).toHaveTextContent('12');
  });

  it('opens the packs and refreshes the balance immediately on click', async () => {
    vi.mocked(creditsService.getBalance).mockResolvedValue(18);
    renderWidget();

    await screen.findByRole('button', { name: /solde de crédits : 18/i });
    const callsBeforeClick = vi.mocked(creditsService.getBalance).mock.calls
      .length;

    fireEvent.click(
      screen.getByRole('button', { name: /solde de crédits : 18/i })
    );

    expect(screen.getByTestId('credits-modal')).toBeInTheDocument();
    await waitFor(() =>
      expect(creditsService.getBalance).toHaveBeenCalledTimes(
        callsBeforeClick + 1
      )
    );
  });
});
