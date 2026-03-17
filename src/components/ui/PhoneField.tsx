'use client';

import {
    Box,
    ClickAwayListener,
    Divider,
    InputAdornment,
    List,
    ListItemButton,
    Paper,
    Popper,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'CM', dialCode: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'SN', dialCode: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'CI', dialCode: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GA', dialCode: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: 'CG', dialCode: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dialCode: '+243', flag: '🇨🇩', name: 'Congo (RDC)' },
  { code: 'TG', dialCode: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: 'BJ', dialCode: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'BF', dialCode: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'ML', dialCode: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'GN', dialCode: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'NE', dialCode: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: 'TD', dialCode: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: 'CF', dialCode: '+236', flag: '🇨🇫', name: 'Centrafrique' },
  { code: 'ET', dialCode: '+251', flag: '🇪🇹', name: 'Éthiopie' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'TZ', dialCode: '+255', flag: '🇹🇿', name: 'Tanzanie' },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', name: 'Afrique du Sud' },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', name: 'Égypte' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: 'CA', dialCode: '+1-CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'États-Unis' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳', name: 'Chine' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'Inde' },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷', name: 'Brésil' },
];

function realDialCode(dialCode: string): string {
  return dialCode.replace(/-[A-Z]+$/, '');
}

function parsePhone(value: string): { country: Country; number: string } {
  const defaultCountry = COUNTRIES[0];
  const cleaned = value?.trim() ?? '';
  if (!cleaned) { return { country: defaultCountry, number: '' }; }

  const normalized = cleaned.replace(/[\s\-()]/g, '');
  const sorted = [...COUNTRIES].sort(
    (a, b) => realDialCode(b.dialCode).length - realDialCode(a.dialCode).length
  );
  for (const c of sorted) {
    const prefix = realDialCode(c.dialCode);
    if (normalized.startsWith(prefix)) {
      return { country: c, number: normalized.slice(prefix.length) };
    }
  }
  return { country: defaultCountry, number: cleaned };
}

interface PhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

export default function PhoneField({
  value,
  onChange,
  label = 'Téléphone',
  placeholder = '6XX XXX XXX',
  disabled = false,
  error = false,
  helperText,
  required = false,
}: PhoneFieldProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parsePhone(value), [value]);
  const [country, setCountry] = useState<Country>(parsed.country);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const p = parsePhone(value);
    setCountry(p.country);
    setNumber(p.number);
  }, [value]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) { return COUNTRIES; }
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    onChange(`${realDialCode(c.dialCode)}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-]/g, '');
    setNumber(raw);
    onChange(`${realDialCode(country.dialCode)}${raw}`);
  };

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        required={required}
        inputMode="tel"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0 }}>
                {/* Flag + dial code button */}
                <Box
                  component="button"
                  ref={anchorRef}
                  type="button"
                  disabled={disabled}
                  onClick={() => setOpen((v) => !v)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    background: 'none',
                    border: 'none',
                    cursor: disabled ? 'default' : 'pointer',
                    px: 0.5,
                    py: 0,
                    mr: 0.75,
                    borderRadius: 1,
                    transition: 'background 0.15s',
                    '&:hover:not(:disabled)': { bgcolor: 'action.hover' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{country.flag}</span>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: disabled ? 'text.disabled' : 'text.secondary',
                      lineHeight: 1,
                    }}
                  >
                    {realDialCode(country.dialCode)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: disabled ? 'text.disabled' : 'text.secondary',
                      lineHeight: 1,
                      mt: 0.1,
                    }}
                  >
                    ▾
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mr: 1, my: 0.5 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* ── Country picker dropdown ────────── */}
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" sx={{ zIndex: 1400 }}>
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper elevation={8} sx={{ width: 280, borderRadius: 2, overflow: 'hidden', mt: 0.5 }}>
            {/* Search box */}
            <Box sx={{ p: 1 }}>
              <TextField
                inputRef={searchRef}
                fullWidth
                size="small"
                placeholder="Rechercher un pays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setOpen(false); }
                  if (e.key === 'Enter' && filtered.length > 0) { handleSelectCountry(filtered[0]); }
                }}
              />
            </Box>
            <Divider />
            {/* Results */}
            <List dense disablePadding sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun résultat
                  </Typography>
                </Box>
              )}
              {filtered.map((c) => (
                <ListItemButton
                  key={c.code}
                  selected={c.code === country.code}
                  onClick={() => handleSelectCountry(c)}
                  sx={{ px: 1.5, py: 0.75, gap: 1 }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 40, color: 'text.secondary', flexShrink: 0 }}
                  >
                    {realDialCode(c.dialCode)}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {c.name}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
