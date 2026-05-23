import type { Ad, City } from '@/types';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/search',
}));

// Framer-motion: passthrough — includes LayoutGroup + AnimatePresence
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, prop: string) => {
        const Comp = React.forwardRef(
          (props: Record<string, unknown>, ref: unknown) => {
            const {
              children,
              layout,
              initial,
              animate,
              exit,
              variants,
              transition,
              ...rest
            } = props;
            void layout;
            void initial;
            void animate;
            void exit;
            void variants;
            void transition;
            return React.createElement(
              prop as string,
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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  MotionConfig: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// AdCard — lightweight stub to avoid pulling in all its dependencies
vi.mock('@/components/ads/AdCard', () => ({
  default: ({ ad }: { ad: Ad }) => (
    <div data-testid={`ad-card-${ad.id}`} role="article">
      {ad.title}
    </div>
  ),
}));

vi.mock('@/components/ads/AdCardSkeleton', () => ({
  default: () => <div data-testid="ad-card-skeleton" />,
}));

vi.mock('@/components/ads/SearchAlertButton', () => ({
  default: () => null,
}));

// ── Imports ─────────────────────────────────────────────────────────────────
import SearchResultsList from '@/app/search/SearchResultsList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeAd(id: string, title = `Annonce ${id}`): Ad {
  return {
    id,
    title,
    slug: `slug-${id}`,
    description: '',
    price: 100000,
    surface_area: 50,
    bedrooms: 2,
    bathrooms: 1,
    has_parking: false,
    status: 'available',
    images: [
      {
        id: 1,
        url: '/img.jpg',
        thumb: '/img.jpg',
        large: '/img.jpg',
        mime_type: 'image/jpeg',
        is_primary: true,
        placeholder: null,
      },
    ],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    expires_at: null,
    user: null,
    agency: null,
    published_by: 'owner',
    quarter: { id: 'q1', name: 'Bastos', city_id: 'c1', city_name: 'Yaoundé' },
    type: { id: 't1', name: 'Appartement', desc: '' },
  } as Ad;
}

const defaultProps = {
  total: 0,
  totalPages: 1,
  page: 1,
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
  sortAnchor: null,
  setSortAnchor: vi.fn(),
  sortBy: 'created_at',
  setSortBy: vi.fn(),
  sortOrder: 'desc' as const,
  setSortOrder: vi.fn(),
  sortLabel: 'Plus récents',
  setPage: vi.fn(),
  isAuthenticated: false,
  selectedCity: null as City | null,
  setCityInput: vi.fn(),
  setSelectedCity: vi.fn(),
  clearFilters: vi.fn(),
};

function renderList(ads: Ad[], overrides = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <SearchResultsList
        ads={ads}
        {...defaultProps}
        total={ads.length}
        {...overrides}
      />
    </ThemeProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SearchResultsList', () => {
  describe('loading state', () => {
    it('renders skeletons when isLoading=true', () => {
      renderList([], { isLoading: true });
      const skeletons = screen.getAllByTestId('ad-card-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render ad cards while loading', () => {
      renderList([makeAd('1')], { isLoading: true });
      expect(screen.queryByRole('article')).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows error message when isError=true', () => {
      renderList([], { isError: true });
      expect(screen.getByText(/Connexion interrompue/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows no-results message when ads array is empty', () => {
      renderList([]);
      expect(
        screen.getByText(/Pas encore d.annonces ici/i)
      ).toBeInTheDocument();
    });
  });

  describe('ads grid', () => {
    it('renders one card per ad', () => {
      const ads = [makeAd('1'), makeAd('2'), makeAd('3')];
      renderList(ads);
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(3);
    });

    it('renders ad titles', () => {
      renderList([
        makeAd('1', 'Villa à Bonapriso'),
        makeAd('2', 'Studio Akwa'),
      ]);
      expect(screen.getByText('Villa à Bonapriso')).toBeInTheDocument();
      expect(screen.getByText('Studio Akwa')).toBeInTheDocument();
    });

    it('renders all cards when ads array changes (AnimatePresence popLayout)', () => {
      const { rerender } = renderList([makeAd('a'), makeAd('b')]);
      expect(screen.getAllByRole('article')).toHaveLength(2);

      rerender(
        <ThemeProvider theme={theme}>
          <SearchResultsList
            ads={[makeAd('a'), makeAd('b'), makeAd('c')]}
            {...defaultProps}
            total={3}
          />
        </ThemeProvider>
      );
      expect(screen.getAllByRole('article')).toHaveLength(3);
    });

    it('removes card when ad is filtered out (AnimatePresence exit)', () => {
      const { rerender } = renderList([makeAd('a'), makeAd('b'), makeAd('c')]);
      expect(screen.getAllByRole('article')).toHaveLength(3);

      rerender(
        <ThemeProvider theme={theme}>
          <SearchResultsList
            ads={[makeAd('a'), makeAd('c')]}
            {...defaultProps}
            total={2}
          />
        </ThemeProvider>
      );
      expect(screen.getAllByRole('article')).toHaveLength(2);
    });
  });

  describe('sort controls', () => {
    it('displays current sort label', () => {
      renderList([makeAd('1')], { sortLabel: 'Prix croissant' });
      expect(screen.getByText(/Prix croissant/i)).toBeInTheDocument();
    });
  });

  describe('result count', () => {
    it('shows total result count', () => {
      renderList([makeAd('1'), makeAd('2')], { total: 42, totalPages: 3 });
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });
  });
});
