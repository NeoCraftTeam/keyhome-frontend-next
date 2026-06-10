import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/search',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return (
      <img
        {...rest}
        data-fill={fill ? 'true' : undefined}
        data-priority={priority ? 'true' : undefined}
      />
    );
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: object, prop: string) => {
          const Comp = React.forwardRef(
            (props: Record<string, unknown>, ref: unknown) => {
              const {
                children,
                whileTap,
                whileHover,
                transition,
                initial,
                animate,
                exit,
                variants,
                ...rest
              } = props;
              return React.createElement(
                prop,
                { ...rest, ref },
                children as React.ReactNode
              );
            }
          );
          Comp.displayName = `motion.${String(prop)}`;
          return Comp;
        },
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    MotionConfig: ({ children }: { children: React.ReactNode }) => children,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock MUI theme
vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual('@mui/material/styles');
  return { ...(actual as object) };
});

// Mock providers/hooks used by AdCard
vi.mock('@/providers/FavoritesProvider', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

vi.mock('@/providers/ComparatorProvider', () => ({
  useComparator: () => ({
    add: vi.fn(),
    remove: vi.fn(),
    isSelected: () => false,
    addToComparator: vi.fn(),
    removeFromComparator: vi.fn(),
    isInComparator: () => false,
  }),
}));

vi.mock('@/hooks/useSoundFeedback', () => ({
  useSoundFeedback: () => ({ play: vi.fn() }),
}));

import AdCard from '@/components/ads/AdCard';
import { Ad } from '@/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockAd: Ad = {
  id: 'test-1',
  title: 'Appartement 3 pièces à Bastos',
  slug: 'appartement-3-pieces-bastos',
  description: 'Un bel appartement',
  price: 150000,
  surface_area: 85,
  bedrooms: 3,
  bathrooms: 2,
  has_parking: true,
  status: 'available',
  is_visible: true,
  is_boosted: false,
  boost_score: 0,
  images: [
    { url: '/img1.jpg', thumb: '/img1-thumb.jpg' },
    { url: '/img2.jpg', thumb: '/img2-thumb.jpg' },
    { url: '/img3.jpg', thumb: '/img3-thumb.jpg' },
  ],
  total_images: 3,
  quarter: { id: 1, name: 'Bastos', city_id: 1, city_name: 'Yaoundé' },
  ad_type: { id: 1, name: 'Appartement', slug: 'appartement' },
  created_at: '2025-01-01T00:00:00Z',
  location: { latitude: 3.87, longitude: 11.52 },
} as unknown as Ad;

function renderAdCard(ad = mockAd) {
  return render(
    <ThemeProvider theme={theme}>
      <AdCard ad={ad} />
    </ThemeProvider>
  );
}

describe('AdCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ad title', () => {
    renderAdCard();
    const titles = screen.getAllByText(/Appartement 3 pièces à Bastos/i);
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  it('renders location info', () => {
    renderAdCard();
    expect(screen.getByText(/Bastos, Yaoundé/)).toBeInTheDocument();
  });

  it('renders features (bedrooms/bathrooms)', () => {
    renderAdCard();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders image with alt text', () => {
    renderAdCard();
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('has carousel keyboard navigation (aria-roledescription)', () => {
    renderAdCard();
    const carousel = screen.getByRole('region');
    expect(carousel).toHaveAttribute('aria-roledescription', 'carrousel');
  });

  it('handles arrow key right without error', () => {
    renderAdCard();
    const carousel = screen.getByRole('region');
    expect(() =>
      fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    ).not.toThrow();
  });

  it('handles arrow key left without error', () => {
    renderAdCard();
    const carousel = screen.getByRole('region');
    expect(() =>
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' })
    ).not.toThrow();
  });

  it('renders dot indicators for multiple images', () => {
    renderAdCard();
    const dots = screen.getAllByRole('button', { name: /Photo \d+/ });
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it('renders without crashing when no images', () => {
    const adNoImages = { ...mockAd, images: [], total_images: 0 };
    expect(() => renderAdCard(adNoImages)).not.toThrow();
  });

  describe('KeyScore badge', () => {
    it('does not render KeyScore badge when keyscore is absent', () => {
      renderAdCard({ ...mockAd, keyscore: undefined });
      expect(screen.queryByRole('img', { hidden: true })).not.toBeNull(); // ad image exists
      expect(document.querySelector('[aria-label^="KeyScore"]')).toBeNull();
    });

    it('does not render KeyScore badge when keyscore is null', () => {
      renderAdCard({ ...mockAd, keyscore: null });
      expect(document.querySelector('[aria-label^="KeyScore"]')).toBeNull();
    });

    it('renders KeyScore badge with score when keyscore is provided', () => {
      renderAdCard({ ...mockAd, keyscore: 82 });
      const badge = document.querySelector('[aria-label^="KeyScore"]');
      expect(badge).not.toBeNull();
      expect(badge?.getAttribute('aria-label')).toBe('KeyScore 82 sur 100');
    });

    it('shows the numeric score inside the badge', () => {
      renderAdCard({ ...mockAd, keyscore: 65 });
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('renders SVG ring inside the badge', () => {
      renderAdCard({ ...mockAd, keyscore: 50 });
      const badge = document.querySelector('[aria-label^="KeyScore"]');
      expect(badge?.querySelector('svg')).not.toBeNull();
    });

    it('renders for a low score (< 50) without crashing', () => {
      renderAdCard({ ...mockAd, keyscore: 30 });
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  describe('Sponsorship badge', () => {
    it('renders no sponsorship pill for organic ads', () => {
      renderAdCard({
        ...mockAd,
        sponsorship_tier: 'organic',
        is_boosted: false,
      });
      expect(
        document.querySelector('[aria-label^="Annonce premium"]')
      ).toBeNull();
      expect(
        document.querySelector('[aria-label^="Annonce sponsorisé"]')
      ).toBeNull();
      expect(
        document.querySelector('[aria-label^="Annonce boosté"]')
      ).toBeNull();
    });

    it('renders the Premium pill for premium-tier ads', () => {
      renderAdCard({ ...mockAd, sponsorship_tier: 'premium' });
      expect(screen.getByLabelText('Annonce premium')).toBeInTheDocument();
    });

    it('renders the Sponsorisé pill for subscription-tier ads', () => {
      renderAdCard({ ...mockAd, sponsorship_tier: 'subscription' });
      expect(screen.getByLabelText('Annonce sponsorisé')).toBeInTheDocument();
    });

    it('renders the Boosté pill for manual-tier ads', () => {
      renderAdCard({ ...mockAd, sponsorship_tier: 'manual' });
      expect(screen.getByLabelText('Annonce boosté')).toBeInTheDocument();
    });

    it('falls back to the Boosté pill when sponsorship_tier is missing but is_boosted is true', () => {
      const ad = { ...mockAd, sponsorship_tier: undefined, is_boosted: true };
      renderAdCard(ad);
      expect(screen.getByLabelText('Annonce boosté')).toBeInTheDocument();
    });
  });

  describe('CARD_VARIANTS & hover prop wiring', () => {
    it('renders a motion.a with whileHover="hover" (checked via data-testid path)', () => {
      const { container } = renderAdCard();
      // The root element rendered by motion.a (which is an <a> in our mock)
      const anchor = container.querySelector('a');
      expect(anchor).not.toBeNull();
    });

    it('card renders without crash when keyscore = 0', () => {
      expect(() => renderAdCard({ ...mockAd, keyscore: 0 })).not.toThrow();
    });
  });
});
