import NavDrawer from '@/components/layout/NavDrawer';
import { creditsService } from '@/services/credits.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ChatBadgeIcon / CurrencySelector pull in their own providers + queries; the
// drawer nav test only cares about the link list, so stub them out.
vi.mock('@/components/chat/ChatBadgeIcon', () => ({
  ChatBadgeIcon: () => null,
}));

vi.mock('@/components/layout/CurrencySelector', () => ({
  CurrencySelector: () => null,
}));

vi.mock('@/services/credits.service', () => ({
  creditsService: { getBalance: vi.fn() },
}));

function renderDrawer(overrides: Record<string, unknown> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onNavigate = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <NavDrawer
        open
        onClose={vi.fn()}
        onNavigate={onNavigate}
        onLogoutClick={vi.fn()}
        user={null}
        isAuthenticated
        comparatorCount={0}
        pathname={null}
        isStandalone={false}
        {...overrides}
      />
    </QueryClientProvider>
  );
  return { onNavigate };
}

describe('NavDrawer — mobile browser menu', () => {
  beforeEach(() => {
    vi.mocked(creditsService.getBalance).mockResolvedValue(0);
  });

  it('shows the rent estimator entry to authenticated users', () => {
    renderDrawer();

    expect(
      screen.getByRole('button', { name: /Estimer le loyer/i })
    ).toBeInTheDocument();
  });

  it('navigates to /prix-marche when the estimator entry is tapped', () => {
    const { onNavigate } = renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Estimer le loyer/i }));

    expect(onNavigate).toHaveBeenCalledWith('/prix-marche');
  });
});
