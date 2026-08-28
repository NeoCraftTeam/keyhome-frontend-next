import HomePage from '@/app/(dashboard)/home/page';
import { adsService } from '@/services/ads.service';
import { recommendationsService } from '@/services/users.service';
import type { Ad, CursorPaginatedResponse } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { firstname: 'Marie' } }),
}));

vi.mock('@/services/ads.service', () => ({
  adsService: { feed: vi.fn() },
}));

vi.mock('@/services/users.service', () => ({
  recommendationsService: { list: vi.fn() },
}));

vi.mock('@/services/cities.service', () => ({
  citiesService: { list: vi.fn() },
}));

vi.mock('@/hooks/useScrollRestoration', () => ({
  useScrollRestoration: () => undefined,
}));

vi.mock('@/hooks/useGreeting', () => ({ useGreeting: () => 'Bonjour' }));

vi.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({ items: [] }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('next/dynamic', () => ({ default: () => () => null }));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src?: string; alt?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} />;
  },
}));

vi.mock('@/components/ads/HeroSearch', () => ({ default: () => null }));
vi.mock('@/components/dashboard/ClientProfileBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/ads/AdCard', () => ({
  default: ({ ad }: { ad: Ad }) => (
    <div data-testid={`ad-${ad.id}`}>{ad.title}</div>
  ),
}));

vi.mock('@/components/ads/AdCardSkeleton', () => ({
  default: () => <div data-testid="ad-skeleton" />,
}));

function makeAd(id: number, title: string): Ad {
  return { id: String(id), title } as unknown as Ad;
}

function feedPage(ads: Ad[]): CursorPaginatedResponse<Ad> {
  return {
    data: ads,
    meta: { next_cursor: null },
    total_approximate: ads.length,
  } as unknown as CursorPaginatedResponse<Ad>;
}

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(adsService.feed).mockReset();
  vi.mocked(recommendationsService.list).mockReset();
  localStorage.clear();
  sessionStorage.clear();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

  class IO {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  vi.stubGlobal('IntersectionObserver', IO);
});

describe('HomePage — feed caching / recommendations de-dup', () => {
  it('drops ads already shown in the recommendations strip from the main grid', async () => {
    vi.mocked(recommendationsService.list).mockResolvedValue({
      data: [makeAd(1, 'Reco A')],
      meta: { source: 'test' },
    });
    vi.mocked(adsService.feed).mockResolvedValue(
      feedPage([makeAd(1, 'Reco A'), makeAd(2, 'Feed B')])
    );

    renderHome();

    // Feed ad #2 is rendered in the main grid.
    await screen.findByTestId('ad-2');

    // Ad #1 is surfaced once (recommendations strip), never duplicated in the grid.
    await waitFor(() => {
      expect(screen.getAllByTestId('ad-1')).toHaveLength(1);
    });
    expect(screen.getByTestId('ad-2')).toBeInTheDocument();
  });

  it('never sends exclude_ids and does not refetch the feed when recommendations load', async () => {
    vi.mocked(recommendationsService.list).mockResolvedValue({
      data: [makeAd(1, 'Reco A')],
      meta: { source: 'test' },
    });
    vi.mocked(adsService.feed).mockResolvedValue(
      feedPage([makeAd(1, 'Reco A'), makeAd(2, 'Feed B')])
    );

    renderHome();

    await screen.findByTestId('ad-2');
    // Recommendations resolve after the feed; this must NOT retrigger a fetch,
    // which is what keeps the persisted feed cache valid across a reload.
    await screen.findByTestId('ad-1');

    const calls = vi.mocked(adsService.feed).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [params] of calls) {
      expect(params ?? {}).not.toHaveProperty('exclude_ids');
    }
    expect(calls).toHaveLength(1);
  });
});
