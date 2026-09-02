import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/theme/tokens', () => ({
  brand: {
    primary: '#F6475F',
    primaryHover: '#E03E54',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #F6475F, #FF8A65)',
    primaryHover: 'linear-gradient(135deg, #E03050, #F07050)',
  },
}));

vi.mock('@mui/icons-material', () => ({
  ErrorOutline: () => <svg data-testid="error-icon" />,
}));

import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThrowOnRender({
  message = 'Test error',
}: {
  message?: string;
}): React.ReactNode {
  throw new Error(message);
}

function SafeChild({ label }: { label: string }) {
  return <div data-testid="safe-child">{label}</div>;
}

describe('ErrorBoundary', () => {
  let consoleError: typeof console.error;

  beforeEach(() => {
    // Suppress expected React error boundary console output during tests
    consoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
  });

  // BUG CATCH: If ErrorBoundary doesn't render children, every page in the
  // app is blank — it would be a complete outage.
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <SafeChild label="Contenu normal" />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('safe-child')).toBeInTheDocument();
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  // BUG CATCH: If the fallback UI isn't shown on error, users see a blank
  // white screen with no explanation or recovery path.
  it('renders French error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(
      screen.getByText(/quelque chose s.est mal passé/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/erreur inattendue/i)).toBeInTheDocument();
  });

  // BUG CATCH: The "Réessayer" button must actually reset the error state.
  // If it doesn't, the user is stuck on the error screen with no way out.
  it('resets error state when "Réessayer" is clicked', () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <div data-testid="recovered">Récupéré</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/quelque chose s.est mal passé/i)
    ).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  // BUG CATCH: If the custom fallback prop is ignored and the default UI shows
  // instead, feature teams can't customize error states per-section.
  it('renders the custom fallback prop when provided', () => {
    const customFallback = (
      <div data-testid="custom-fallback">Oops, section unavailable</div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(
      screen.queryByText(/quelque chose s.est mal passé/i)
    ).not.toBeInTheDocument();
  });

  // BUG CATCH: Both "Réessayer" and "Recharger la page" buttons must be present
  // in the default fallback. Missing buttons leave the user without a recovery path.
  it('renders both recovery action buttons in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(
      screen.getByRole('button', { name: /réessayer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /recharger/i })
    ).toBeInTheDocument();
  });

  // BUG CATCH: If ErrorBoundary doesn't catch a second error after reset,
  // the user ends up with a blank screen on the next failure.
  it('catches a second error after reset correctly', () => {
    let throwCount = 0;

    function CountingThrow(): React.ReactNode {
      throwCount++;
      throw new Error(`Error #${throwCount}`);
    }

    const { rerender } = render(
      <ErrorBoundary>
        <CountingThrow />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/quelque chose s.est mal passé/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    rerender(
      <ErrorBoundary>
        <CountingThrow />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/quelque chose s.est mal passé/i)
    ).toBeInTheDocument();
  });

  // BUG CATCH: Multiple independent ErrorBoundary instances must not share
  // error state — one section crashing should not affect another.
  it('independent instances do not share error state', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowOnRender message="Section A error" />
        </ErrorBoundary>
        <ErrorBoundary>
          <SafeChild label="Section B is fine" />
        </ErrorBoundary>
      </div>
    );

    expect(
      screen.getByText(/quelque chose s.est mal passé/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Section B is fine')).toBeInTheDocument();
  });
});
