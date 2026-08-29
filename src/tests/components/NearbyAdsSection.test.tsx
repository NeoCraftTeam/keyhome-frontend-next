import NearbyAdsSection from '@/components/ads/NearbyAdsSection';
import { adsService } from '@/services/ads.service';
import type { Ad } from '@/types';
import { lightTheme } from '@/theme/theme';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseUserLocation = vi.fn();
vi.mock('@/hooks/useUserLocation', () => ({
  useUserLocation: () => mockUseUserLocation(),
}));

vi.mock('@/services/ads.service', () => ({
  adsService: { nearby: vi.fn() },
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

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={lightTheme}>
        <NearbyAdsSection />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(adsService.nearby).mockReset();
  mockUseUserLocation.mockReset();

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
});

describe('NearbyAdsSection', () => {
  it('renders nothing and never queries when geolocation is unavailable', () => {
    mockUseUserLocation.mockReturnValue({
      location: null,
      loading: false,
      error: 'denied',
      refresh: vi.fn(),
    });

    renderSection();

    expect(screen.queryByText('À proximité')).not.toBeInTheDocument();
    expect(adsService.nearby).not.toHaveBeenCalled();
  });

  it('shows the strip and queries with the resolved coordinates', async () => {
    mockUseUserLocation.mockReturnValue({
      location: {
        latitude: 4.05,
        longitude: 9.7,
        accuracy: 10,
        isApproximate: false,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(adsService.nearby).mockResolvedValue([
      makeAd(1, 'Proche A'),
      makeAd(2, 'Proche B'),
    ]);

    renderSection();

    await screen.findByText('À proximité');
    await screen.findByTestId('ad-1');
    expect(screen.getByTestId('ad-2')).toBeInTheDocument();

    expect(adsService.nearby).toHaveBeenCalledWith({
      latitude: 4.05,
      longitude: 9.7,
      radius: 10_000,
    });
  });

  it('self-hides when the position resolves but nothing is nearby', async () => {
    mockUseUserLocation.mockReturnValue({
      location: {
        latitude: 4.05,
        longitude: 9.7,
        accuracy: 10,
        isApproximate: false,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(adsService.nearby).mockResolvedValue([]);

    renderSection();

    await waitFor(() => {
      expect(screen.queryByText('À proximité')).not.toBeInTheDocument();
    });
  });
});
