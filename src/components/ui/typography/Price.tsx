'use client';

import { formatPrice as formatPriceXAF } from '@/lib/constants';
import { useCurrency } from '@/providers/CurrencyProvider';
import { Box } from '@mui/material';
import type { ComponentProps } from 'react';

interface PriceProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * Amount in XAF (canonical in DB). Laravel may historically emit a decimal
   * string in JSON — we normalise in `toFiniteXaf`.
   */
  amountXAF: number | string | null | undefined;
  /**
   * Which currency is the **primary** display.
   * - `'local'` (default) — converts to the visitor's currency. Use for
   *   marketing, listings, charges. Pair with `showOriginal` to keep FCFA
   *   as a small reference.
   * - `'xaf'` — keeps FCFA as primary and appends the local conversion as
   *   a small subtitle. Use for **payment contexts** (the gateway bills
   *   XAF only — receipts, history, payment modals must stay canonical).
   */
  primary?: 'local' | 'xaf';
  /**
   * Only meaningful with `primary='local'`. Renders the original FCFA value
   * as a small subtitle below the converted amount (when active currency
   * differs from XAF/XOF).
   */
  showOriginal?: boolean;
  /** Compact format (e.g. `1,5M €`) — for cards & map labels. */
  compact?: boolean;
  /** Display class name forwarded on the outer wrapper. */
  className?: string;
}

/**
 * `<Price>` — visitor-facing price display.
 *
 * Reads the active currency from `useCurrency()` and renders the converted
 * amount. **Never** use this on the owner panel: bailleurs saisissent et
 * gèrent leurs prix exclusivement en FCFA (XAF est la BDD-of-record).
 */
function toFiniteXaf(
  amountXAF: number | string | null | undefined
): number | null {
  if (amountXAF == null || amountXAF === '') {
    return null;
  }
  const n = typeof amountXAF === 'number' ? amountXAF : Number(amountXAF);
  return Number.isFinite(n) ? n : null;
}

export function Price({
  amountXAF,
  primary = 'local',
  showOriginal = false,
  compact = false,
  className,
  ...rest
}: PriceProps) {
  const { format, formatCompact, currency, isLoading } = useCurrency();

  const xaf = toFiniteXaf(amountXAF);
  if (xaf == null) {
    return (
      <span className={className} {...rest}>
        Prix non défini
      </span>
    );
  }

  // Skeleton placeholder while the first rate fetch is in flight (only
  // shown for non-XAF/XOF visitors — locals never see it).
  if (isLoading && primary === 'local') {
    return (
      <Box
        component="span"
        className={className}
        aria-label="Prix en cours de chargement"
        sx={{
          display: 'inline-block',
          width: '6ch',
          height: '1em',
          bgcolor: 'action.hover',
          borderRadius: 0.5,
          verticalAlign: 'middle',
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 },
          },
        }}
        {...rest}
      />
    );
  }

  const isLocale = currency !== 'XAF' && currency !== 'XOF';

  // ── Mode "xaf" : FCFA primary + local conversion as small subtitle ───────
  if (primary === 'xaf') {
    const xafLabel = formatPriceXAF(xaf);
    if (!isLocale || isLoading) {
      return (
        <span className={className} {...rest}>
          {xafLabel}
        </span>
      );
    }
    const localLabel = compact ? formatCompact(xaf) : format(xaf);
    return (
      <span className={className} {...rest}>
        <span>{xafLabel}</span>
        <Box
          component="span"
          sx={{
            display: 'block',
            fontSize: '0.72em',
            fontWeight: 400,
            color: 'text.secondary',
            mt: 0.25,
          }}
        >
          ≈ {localLabel}
        </Box>
      </span>
    );
  }

  // ── Mode "local" (default) : convert + optional FCFA reference ───────────
  const main = compact ? formatCompact(xaf) : format(xaf);
  const showSubtitle = showOriginal && isLocale;

  if (!showSubtitle) {
    return (
      <span className={className} {...rest}>
        {main}
      </span>
    );
  }

  return (
    <span className={className} {...rest}>
      <span>{main}</span>
      <Box
        component="span"
        sx={{
          display: 'block',
          fontSize: '0.72em',
          fontWeight: 400,
          color: 'text.secondary',
          mt: 0.25,
        }}
      >
        ≈ {formatPriceXAF(xaf)}
      </Box>
    </span>
  );
}
