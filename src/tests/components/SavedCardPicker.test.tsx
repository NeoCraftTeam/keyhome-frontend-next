/**
 * Tests for the SavedCardPicker — the radio-group surfaced between the
 * "Carte bancaire" method selection and the Stripe Elements form when
 * the authenticated user has at least one saved Stripe PaymentMethod.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SavedCardPicker from '@/components/payment/SavedCardPicker';
import type { StripePaymentMethod } from '@/types';

const CARDS: StripePaymentMethod[] = [
  {
    id: 'pm_visa_4242',
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2027,
    is_default: true,
  },
  {
    id: 'pm_mastercard_5555',
    brand: 'mastercard',
    last4: '5555',
    exp_month: 6,
    exp_year: 2028,
    is_default: false,
  },
];

describe('SavedCardPicker', () => {
  it('renders one row per saved card + the "Nouvelle carte" row', () => {
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId="pm_visa_4242"
        onSelectionChange={vi.fn()}
        onContinue={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText(/Visa •••• 4242/i)).toBeInTheDocument();
    expect(screen.getByText(/Mastercard •••• 5555/i)).toBeInTheDocument();
    expect(screen.getByText(/Utiliser une autre carte/i)).toBeInTheDocument();
  });

  it('marks the default card with "Par défaut"', () => {
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId={null}
        onSelectionChange={vi.fn()}
        onContinue={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // The Par défaut suffix is attached to the Visa card.
    const visa = screen.getByText(/Visa •••• 4242/i).closest('div');
    expect(visa).not.toBeNull();
    expect(screen.getByText(/Expire 12\/27 · Par défaut/i)).toBeInTheDocument();
  });

  it('calls onSelectionChange when clicking a row', () => {
    const onSelectionChange = vi.fn();
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId="pm_visa_4242"
        onSelectionChange={onSelectionChange}
        onContinue={vi.fn()}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Mastercard •••• 5555/i));
    expect(onSelectionChange).toHaveBeenCalledWith('pm_mastercard_5555');
  });

  it('calls onSelectionChange(null) when clicking "Utiliser une autre carte"', () => {
    const onSelectionChange = vi.fn();
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId="pm_visa_4242"
        onSelectionChange={onSelectionChange}
        onContinue={vi.fn()}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Utiliser une autre carte/i));
    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('forwards the selected id to onContinue', () => {
    const onContinue = vi.fn();
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId="pm_mastercard_5555"
        onSelectionChange={vi.fn()}
        onContinue={onContinue}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Payer maintenant/i }));
    expect(onContinue).toHaveBeenCalledWith('pm_mastercard_5555');
  });

  it('forwards null to onContinue when "Nouvelle carte" is selected', () => {
    const onContinue = vi.fn();
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId={null}
        onSelectionChange={vi.fn()}
        onContinue={onContinue}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Payer maintenant/i }));
    expect(onContinue).toHaveBeenCalledWith(null);
  });

  it('disables both buttons while submitting', () => {
    render(
      <SavedCardPicker
        cards={CARDS}
        selectedId="pm_visa_4242"
        onSelectionChange={vi.fn()}
        onContinue={vi.fn()}
        onBack={vi.fn()}
        isSubmitting
      />
    );

    expect(screen.getByRole('button', { name: /Retour/i })).toBeDisabled();
    // While submitting the "Payer maintenant" label is replaced by a
    // spinner, so we look up the button via its accessible role.
    const submit = screen
      .getAllByRole('button')
      .find((b) => b !== screen.getByRole('button', { name: /Retour/i }));
    expect(submit).toBeDisabled();
  });
});
