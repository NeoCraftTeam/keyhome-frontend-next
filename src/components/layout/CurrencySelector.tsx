'use client';

import {
  CURRENCY_FLAGS,
  CURRENCY_LABELS,
  CURRENCY_REGIONS,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from '@/lib/currency';
import { useCurrency } from '@/providers/CurrencyProvider';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  ButtonBase,
  Divider,
  InputAdornment,
  ListItemButton,
  Popover,
  TextField,
  Typography,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useMemo, useState } from 'react';

interface CurrencySelectorProps {
  /** Tighter layout for the mobile drawer (full-width trigger). */
  variant?: 'desktop' | 'drawer';
  sx?: SxProps<Theme>;
}

/**
 * Beautiful Airbnb-style currency picker.
 *
 * Trigger: pill-shaped button with the country flag + ISO code (desktop) or
 * full-width row with flag + label (drawer). Click opens a Popover with a
 * search box and currencies grouped by region. Active currency is marked
 * with a check + brand-coloured highlight.
 *
 * Persisted in `kh_currency` cookie via `CurrencyProvider#setCurrency`
 * (30 days). The middleware honours an existing supported value, so the
 * user's choice survives geo-detection.
 */
export function CurrencySelector({
  variant = 'desktop',
  sx,
}: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const open = Boolean(anchorEl);

  const isDrawer = variant === 'drawer';

  // Filter regions/codes by search term — match against ISO code, label, symbol.
  const filteredRegions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCY_REGIONS;

    const matches = (code: SupportedCurrency) =>
      code.toLowerCase().includes(q) ||
      CURRENCY_LABELS[code].toLowerCase().includes(q) ||
      CURRENCY_SYMBOLS[code].toLowerCase().includes(q);

    const result: typeof CURRENCY_REGIONS = { ...CURRENCY_REGIONS };
    (
      Object.keys(CURRENCY_REGIONS) as Array<keyof typeof CURRENCY_REGIONS>
    ).forEach((region) => {
      const codes = CURRENCY_REGIONS[region].codes.filter(matches);
      result[region] = { ...CURRENCY_REGIONS[region], codes };
    });
    return result;
  }, [query]);

  const handleSelect = (next: SupportedCurrency) => {
    setCurrency(next);
    setAnchorEl(null);
    setQuery('');
  };

  const handleClose = () => {
    setAnchorEl(null);
    setQuery('');
  };

  // ── Trigger ────────────────────────────────────────────────────────────────
  const trigger = isDrawer ? (
    <ButtonBase
      onClick={(e) => setAnchorEl(e.currentTarget)}
      aria-haspopup="dialog"
      aria-label="Choisir une devise"
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.75,
        py: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        textAlign: 'left',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        '&:hover': {
          borderColor: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        ...sx,
      }}
    >
      <Box component="span" sx={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
        {CURRENCY_FLAGS[currency]}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
          {currency} — {CURRENCY_SYMBOLS[currency]}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {CURRENCY_LABELS[currency]}
        </Typography>
      </Box>
      <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    </ButtonBase>
  ) : (
    <ButtonBase
      onClick={(e) => setAnchorEl(e.currentTarget)}
      aria-haspopup="dialog"
      aria-label="Choisir une devise"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        height: 38,
        px: 1.5,
        borderRadius: 99,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        fontSize: 13,
        fontWeight: 600,
        color: 'text.primary',
        transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.15s',
        '&:hover': {
          borderColor: 'text.primary',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        },
        '&:active': { transform: 'scale(0.97)' },
        ...sx,
      }}
    >
      <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }} aria-hidden>
        {CURRENCY_FLAGS[currency]}
      </Box>
      <Box component="span" sx={{ letterSpacing: 0.2 }}>
        {currency}
      </Box>
      <KeyboardArrowDownIcon
        sx={{
          fontSize: 16,
          color: 'text.secondary',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </ButtonBase>
  );

  // ── Popover ────────────────────────────────────────────────────────────────
  return (
    <>
      {trigger}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        // Keep popover DOM under Drawer/Modal tree so axe does not flag focusable descendants of aria-hidden app root.
        disablePortal={isDrawer}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 320, sm: 360 },
              maxHeight: 480,
              borderRadius: 3,
              boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Header — title + search */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <LanguageIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Choisir une devise
            </Typography>
          </Box>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (ex: euro, USD, ¥)"
            size="small"
            fullWidth
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ fontSize: 18, color: 'text.secondary' }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 99,
                fontSize: 13,
                bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'divider' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
        </Box>

        {/* Body — scrollable region list */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
          {(
            Object.keys(filteredRegions) as Array<keyof typeof filteredRegions>
          ).map((region, idx) => {
            const { label, codes } = filteredRegions[region];
            if (codes.length === 0) return null;

            return (
              <Box key={region}>
                {idx > 0 && <Divider sx={{ my: 0.5, mx: 1.5 }} />}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 2,
                    py: 0.75,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                  }}
                >
                  {label}
                </Typography>
                {codes.map((code) => {
                  const isActive = code === currency;
                  return (
                    <ListItemButton
                      key={code}
                      onClick={() => handleSelect(code)}
                      selected={isActive}
                      sx={{
                        mx: 1,
                        my: 0.25,
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        gap: 1.5,
                        transition: 'background-color 0.15s',
                        '&.Mui-selected': {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                          '&:hover': {
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                          },
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ fontSize: 22, lineHeight: 1 }}
                        aria-hidden
                      >
                        {CURRENCY_FLAGS[code]}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 0.75,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={isActive ? 700 : 600}
                            sx={{
                              color: isActive ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {code}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: 11 }}
                          >
                            {CURRENCY_SYMBOLS[code]}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: 12,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {CURRENCY_LABELS[code]}
                        </Typography>
                      </Box>
                      {isActive && (
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: 'primary.main',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </ListItemButton>
                  );
                })}
              </Box>
            );
          })}

          {/* Empty state */}
          {Object.values(filteredRegions).every(
            (r) => r.codes.length === 0
          ) && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Aucune devise ne correspond à « {query} »
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer hint */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) => alpha(t.palette.text.primary, 0.025),
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 11 }}
          >
            Les prix sont enregistrés en FCFA. La conversion suit le taux du
            jour (mis à jour toutes les heures).
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
