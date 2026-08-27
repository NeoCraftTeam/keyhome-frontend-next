'use client';

import { brand } from '@/theme/tokens';
import type { StripePaymentMethod } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { Box, Button, Radio, Typography } from '@mui/material';

interface SavedCardPickerProps {
  /** Saved cards as returned by `GET /payments/stripe/payment-methods`. */
  cards: StripePaymentMethod[];
  /**
   * Currently selected saved-card ID. `null` means the "Nouvelle carte"
   * row is selected. The parent owns the state so the picker stays a
   * controlled component (no internal-state surprises on remount).
   */
  selectedId: string | null;
  /** Called when the user picks a row (radio change). */
  onSelectionChange: (id: string | null) => void;
  /**
   * Called when the user clicks "Payer maintenant".
   *  - `cardId` = saved card UUID → trigger off-session reuse.
   *  - `null` → "Nouvelle carte" → fall back to the regular new-card
   *    flow with Stripe Elements.
   */
  onContinue: (cardId: string | null) => void;
  /** Back to the method selector step. */
  onBack: () => void;
  /** Disables both buttons while the parent is initiating the payment. */
  isSubmitting?: boolean;
}

/**
 * Maps Stripe `brand` strings to a small French label. Stripe returns
 * lowercase brand names (e.g. `'visa'`, `'mastercard'`, `'amex'`).
 */
function brandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
    case 'american_express':
      return 'American Express';
    case 'discover':
      return 'Discover';
    case 'jcb':
      return 'JCB';
    case 'diners':
    case 'diners_club':
      return 'Diners';
    case 'unionpay':
      return 'UnionPay';
    default:
      return brand.charAt(0).toUpperCase() + brand.slice(1);
  }
}

/**
 * Format expiry month + year as `MM/YY` (Stripe convention).
 */
function formatExpiry(month: number, year: number): string {
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

/**
 * Saved-card picker step — rendered after the user picks the "Carte
 * bancaire" method when at least one saved Stripe `PaymentMethod` is
 * attached to their Customer.
 *
 * UX:
 *  - One radio row per saved card (•••• 4242 Visa exp 12/27 [Par défaut])
 *  - One "+ Nouvelle carte" radio row at the bottom.
 *  - "Payer maintenant" continues with the selected option.
 *  - "Retour" goes back to the method selector (`select-method`).
 */
export default function SavedCardPicker({
  cards,
  selectedId,
  onSelectionChange,
  onContinue,
  onBack,
  isSubmitting = false,
}: SavedCardPickerProps): React.ReactElement {
  // `selectedId === null` represents the "Nouvelle carte" row so we can
  // treat both branches with a single `value` on the radio group.
  const groupValue = selectedId === null ? '__new__' : selectedId;

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          textAlign: 'center',
          color: 'text.secondary',
          letterSpacing: 1.5,
          fontSize: '0.65rem',
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        Vos cartes enregistrées
      </Typography>

      <Box
        role="radiogroup"
        aria-label="Choix d'une carte enregistrée"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {cards.map((card) => {
          const isChecked = groupValue === card.id;
          return (
            <Box
              key={card.id}
              role="radio"
              aria-checked={isChecked}
              tabIndex={0}
              onClick={() => onSelectionChange(card.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectionChange(card.id);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1.25,
                border: '2px solid',
                borderColor: isChecked ? brand.primary : 'divider',
                borderRadius: 2.5,
                bgcolor: isChecked ? brand.primaryAlpha10 : 'transparent',
                cursor: 'pointer',
                transition:
                  'border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                '&:hover': {
                  borderColor: isChecked ? brand.primary : 'text.disabled',
                },
                '&:focus-visible': {
                  outline: `2px solid ${brand.primary}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Radio
                checked={isChecked}
                value={card.id}
                tabIndex={-1}
                sx={{
                  p: 0,
                  color: 'text.disabled',
                  '&.Mui-checked': { color: brand.primary },
                }}
                inputProps={{ 'aria-label': brandLabel(card.brand) }}
              />
              <CreditCardIcon
                sx={{
                  color: isChecked ? brand.primary : 'text.secondary',
                  fontSize: 24,
                  flexShrink: 0,
                }}
                aria-hidden
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {brandLabel(card.brand)} •••• {card.last4}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block', fontSize: '0.72rem' }}
                >
                  Expire {formatExpiry(card.exp_month, card.exp_year)}
                  {card.is_default ? ' · Par défaut' : ''}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {/* "Nouvelle carte" row — always last so "regulars" find their saved
            cards first. */}
        <Box
          role="radio"
          aria-checked={groupValue === '__new__'}
          tabIndex={0}
          onClick={() => onSelectionChange(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectionChange(null);
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1.25,
            border: '2px dashed',
            borderColor:
              groupValue === '__new__' ? brand.primary : 'text.disabled',
            borderRadius: 2.5,
            bgcolor:
              groupValue === '__new__' ? brand.primaryAlpha10 : 'transparent',
            cursor: 'pointer',
            transition:
              'border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            '&:focus-visible': {
              outline: `2px solid ${brand.primary}`,
              outlineOffset: 2,
            },
          }}
        >
          <Radio
            checked={groupValue === '__new__'}
            value="__new__"
            tabIndex={-1}
            sx={{
              p: 0,
              color: 'text.disabled',
              '&.Mui-checked': { color: brand.primary },
            }}
            inputProps={{ 'aria-label': 'Utiliser une autre carte' }}
          />
          <AddIcon
            sx={{
              color:
                groupValue === '__new__' ? brand.primary : 'text.secondary',
              fontSize: 24,
              flexShrink: 0,
            }}
            aria-hidden
          />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: groupValue === '__new__' ? brand.primary : 'text.primary',
            }}
          >
            Utiliser une autre carte
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={isSubmitting}
          sx={{ flex: 1, py: 1.4, borderRadius: 3, fontWeight: 600 }}
        >
          Retour
        </Button>
        <Button
          variant="contained"
          onClick={() => onContinue(selectedId)}
          disabled={isSubmitting}
          sx={{
            flex: 2,
            py: 1.4,
            borderRadius: 3,
            fontWeight: 700,
            bgcolor: brand.primary,
            '&:hover': { bgcolor: brand.primaryDark },
            '&:disabled': {
              bgcolor: brand.primaryAlpha30,
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {isSubmitting ? <ButtonSpinner size={20} /> : 'Payer maintenant'}
        </Button>
      </Box>
    </Box>
  );
}
