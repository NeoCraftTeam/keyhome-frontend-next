import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

// Price reads the active currency; keep it deterministic in tests.
vi.mock('@/providers/CurrencyProvider', () => ({
  useCurrency: () => ({
    format: (n: number) => `${n} FCFA`,
    formatCompact: (n: number) => `${n}`,
    currency: 'XAF',
    isLoading: false,
  }),
}));

import ComparisonTable from '@/components/ads/ComparisonTable';
import { getAttributeLabel } from '@/lib/attribute-labels';
import { Ad } from '@/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

function makeAd(overrides: Partial<Ad>): Ad {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Bien',
    slug: 'bien',
    description: '',
    adresse: null,
    price: 150000,
    surface_area: 40,
    bedrooms: 1,
    bathrooms: 1,
    has_parking: true,
    location: null,
    status: 'available',
    expires_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user: null,
    agency: null,
    published_by: '',
    quarter: { id: 'q1', name: 'Bastos', city_id: 'c1', city_name: 'Yaoundé' },
    type: { id: 't1', name: 'Studio', desc: '' },
    transaction_type: 'location',
    price_period: 'mois',
    images: [],
    ...overrides,
  } as unknown as Ad;
}

function renderTable(items: Ad[], props = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ComparisonTable items={items} {...props} />
    </ThemeProvider>
  );
}

describe('ComparisonTable', () => {
  it('renders grouped criterion section headers', () => {
    renderTable([makeAd({ price: 100000 }), makeAd({ price: 200000 })]);
    expect(screen.getByText('Prix & surface')).toBeInTheDocument();
    expect(screen.getByText('Caractéristiques')).toBeInTheDocument();
    expect(screen.getByText('Emplacement & KeyScore')).toBeInTheDocument();
    expect(screen.getByText('Confiance')).toBeInTheDocument();
  });

  it('uses a per-month rent label when every ad is a monthly rental', () => {
    renderTable([
      makeAd({ transaction_type: 'location', price_period: 'mois' }),
      makeAd({ transaction_type: 'location', price_period: 'mois' }),
    ]);
    expect(screen.getByText('Loyer / mois')).toBeInTheDocument();
  });

  it('uses a sale label when every ad is for sale', () => {
    renderTable([
      makeAd({ transaction_type: 'vente', price_period: null }),
      makeAd({ transaction_type: 'vente', price_period: null }),
    ]);
    expect(screen.getByText('Prix de vente')).toBeInTheDocument();
  });

  it('shows the KeyScore row and each ad score when available', () => {
    renderTable([makeAd({ keyscore: 82 }), makeAd({ keyscore: 61 })]);
    expect(screen.getByText('KeyScore quartier')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
  });

  it('hides the KeyScore row when no ad has a score', () => {
    renderTable([makeAd({ keyscore: null }), makeAd({ keyscore: undefined })]);
    expect(screen.queryByText('KeyScore quartier')).not.toBeInTheDocument();
  });

  it('renders an amenity row for allowlisted attributes present on an ad', () => {
    renderTable([makeAd({ attributes: ['wifi'] }), makeAd({ attributes: [] })]);
    expect(screen.getByText('Équipements')).toBeInTheDocument();
    expect(screen.getByText(getAttributeLabel('wifi'))).toBeInTheDocument();
  });

  it('renders a "Voir" action per ad when showActions is set', () => {
    renderTable([makeAd({}), makeAd({})], { showActions: true });
    expect(screen.getAllByRole('button', { name: /Voir/ })).toHaveLength(2);
  });

  it('calls onRemove with the ad id when the remove control is clicked', () => {
    const onRemove = vi.fn();
    renderTable([makeAd({ id: 'remove-me' }), makeAd({})], { onRemove });
    const buttons = screen.getAllByLabelText(/Retirer .* du comparateur/);
    fireEvent.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith('remove-me');
  });
});
