import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionBoundary } from '@/components/ui/SectionBoundary';

function ThrowOnRender({
  message = 'boom',
}: {
  message?: string;
}): React.ReactNode {
  throw new Error(message);
}

function SafeChild() {
  return <div data-testid="safe">OK</div>;
}

describe('SectionBoundary', () => {
  let consoleError: typeof console.error;

  beforeEach(() => {
    consoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
  });

  it('renders children when no error is thrown', () => {
    render(
      <SectionBoundary title="Quartier">
        <SafeChild />
      </SectionBoundary>
    );
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });

  it('renders compact French fallback with section title when child throws', () => {
    render(
      <SectionBoundary title="Quartier">
        <ThrowOnRender />
      </SectionBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/impossible de charger.*quartier/i)
    ).toBeInTheDocument();
  });

  it('exposes a "Réessayer" button that resets the error state', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('first');
      return <div data-testid="ok">recovered</div>;
    }

    const { rerender } = render(
      <SectionBoundary title="Avis">
        <MaybeThrow />
      </SectionBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    rerender(
      <SectionBoundary title="Avis">
        <MaybeThrow />
      </SectionBoundary>
    );

    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('failing sections do not impact sibling sections', () => {
    render(
      <div>
        <SectionBoundary title="A">
          <ThrowOnRender message="A failed" />
        </SectionBoundary>
        <SectionBoundary title="B">
          <SafeChild />
        </SectionBoundary>
      </div>
    );

    expect(screen.getByText(/impossible de charger.*a/i)).toBeInTheDocument();
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });

  it('uses the custom fallback when provided', () => {
    render(
      <SectionBoundary
        title="Quartier"
        fallback={({ reset }) => (
          <div>
            <span data-testid="custom-fb">custom fallback</span>
            <button onClick={reset}>retry</button>
          </div>
        )}
      >
        <ThrowOnRender />
      </SectionBoundary>
    );
    expect(screen.getByTestId('custom-fb')).toBeInTheDocument();
  });
});
