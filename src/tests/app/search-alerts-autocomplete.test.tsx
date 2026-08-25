import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

// The page fetches its alert list + ad types via react-query, and the nested
// CityAutocomplete fetches cities. Return per-queryKey fixtures so no network
// (queryFn) ever runs.
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    if (key === 'adTypes') {
      return {
        data: [
          { id: 't1', name: 'Appartement', desc: '' },
          { id: 't2', name: 'Maison', desc: '' },
        ],
      };
    }
    if (key === 'cities') {
      return { data: { data: [] }, isFetching: false };
    }
    return { data: { data: [] }, isLoading: false };
  },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

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

import SearchAlertsPage from '@/app/(dashboard)/search-alerts/page';

describe('SearchAlertsPage — ville & type de bien autocomplete', () => {
  it('renders the city and property-type fields as autocompletes', async () => {
    render(<SearchAlertsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nouvelle alerte/i }));

    const ville = await screen.findByLabelText('Ville');
    expect(ville).toHaveAttribute('role', 'combobox');
    expect(ville).toHaveAttribute('placeholder', 'Rechercher une ville…');

    const type = screen.getByLabelText('Type de bien');
    expect(type).toHaveAttribute('role', 'combobox');

    // The former free-text inputs are gone.
    expect(
      screen.queryByPlaceholderText('Ex: Douala, Yaoundé')
    ).not.toBeInTheDocument();
  });

  it('surfaces the available ad types in the type autocomplete', async () => {
    render(<SearchAlertsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nouvelle alerte/i }));

    const type = await screen.findByLabelText('Type de bien');
    fireEvent.mouseDown(type);
    fireEvent.keyDown(type, { key: 'ArrowDown' });

    expect(await screen.findByText('Maison')).toBeInTheDocument();
    expect(screen.getByText('Appartement')).toBeInTheDocument();
  });
});
