import KeyScoreBadge from '@/components/ads/KeyScoreBadge';
import { adsService } from '@/services/ads.service';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/ads.service', () => ({
  adsService: { getNeighborhoodScorecard: vi.fn() },
}));

type Scorecard = Awaited<
  ReturnType<typeof adsService.getNeighborhoodScorecard>
>;

function scorecard(overrides: Partial<Scorecard['data']> = {}): Scorecard {
  return {
    data: {
      global_score: 82,
      status: 'ok',
      cached: true,
      computed_at: '2026-01-01T00:00:00Z',
      categories: {
        transport: {
          score: 75,
          poi_count: 3,
          label: 'Transport',
          radius_m: 500,
          nearest_poi: null,
        },
        commerce: {
          score: 60,
          poi_count: 2,
          label: 'Commerces',
          radius_m: 500,
          nearest_poi: null,
        },
      },
      ...overrides,
    },
  } as Scorecard;
}

const theme = createTheme();

function renderBadge(props: React.ComponentProps<typeof KeyScoreBadge>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <KeyScoreBadge {...props} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('KeyScoreBadge (neighborhood KeyScore)', () => {
  beforeEach(() => {
    vi.mocked(adsService.getNeighborhoodScorecard).mockReset();
  });

  it('renders the neighborhood global_score with a KeyScore aria-label', async () => {
    vi.mocked(adsService.getNeighborhoodScorecard).mockResolvedValue(
      scorecard()
    );

    renderBadge({ adId: 'ad-1' });

    const badge = await screen.findByLabelText(/^KeyScore 82 sur 100/);
    expect(badge).toBeInTheDocument();
    expect(badge.getAttribute('role')).toBe('button');
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders nothing when the scorecard is unavailable', async () => {
    vi.mocked(adsService.getNeighborhoodScorecard).mockResolvedValue(
      scorecard({ status: 'unavailable', global_score: 0, categories: {} })
    );

    const { container } = renderBadge({ adId: 'ad-2' });

    await waitFor(() =>
      expect(adsService.getNeighborhoodScorecard).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(container.querySelector('[aria-label^="KeyScore"]')).toBeNull()
    );
  });

  it('renders nothing when the fetch fails', async () => {
    vi.mocked(adsService.getNeighborhoodScorecard).mockRejectedValue(
      new Error('422')
    );

    const { container } = renderBadge({ adId: 'ad-3' });

    await waitFor(() =>
      expect(adsService.getNeighborhoodScorecard).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(container.querySelector('[aria-label^="KeyScore"]')).toBeNull()
    );
  });

  it('shares its query key with the KeyScore card so it costs no extra request', async () => {
    vi.mocked(adsService.getNeighborhoodScorecard).mockResolvedValue(
      scorecard()
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>
          <KeyScoreBadge adId="ad-4" />
          <KeyScoreBadge adId="ad-4" size="small" />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findAllByLabelText(/^KeyScore 82 sur 100/);
    expect(adsService.getNeighborhoodScorecard).toHaveBeenCalledTimes(1);
  });
});
