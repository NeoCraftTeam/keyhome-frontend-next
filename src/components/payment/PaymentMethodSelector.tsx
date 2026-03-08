'use client';

import { PaymentMethod } from '@/types';
import { CreditCard, PhoneIphone } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';

interface PaymentOption {
  method: PaymentMethod;
  label: string;
  shortLabel: string;
  color: string;
  icon: React.ReactNode;
  logoText: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    method: PaymentMethod.MOBILE_MONEY,
    label: 'MTN Mobile Money',
    shortLabel: 'MTN MoMo',
    color: '#FFCC00',
    icon: <PhoneIphone sx={{ fontSize: 28 }} />,
    logoText: 'MTN',
  },
  {
    method: PaymentMethod.ORANGE_MONEY,
    label: 'Orange Money',
    shortLabel: 'Orange',
    color: '#FF6600',
    icon: <PhoneIphone sx={{ fontSize: 28 }} />,
    logoText: 'OM',
  },
  {
    method: PaymentMethod.CARD,
    label: 'Carte Bancaire',
    shortLabel: 'Carte',
    color: '#1A1F71',
    icon: <CreditCard sx={{ fontSize: 28 }} />,
    logoText: 'VISA',
  },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  selected,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {PAYMENT_OPTIONS.map((option) => {
        const isSelected = selected === option.method;
        return (
          <Box
            key={option.method}
            onClick={() => { if (!disabled) { onChange(option.method); } }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={isSelected}
            aria-label={option.label}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onChange(option.method);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 3,
              border: '2px solid',
              borderColor: isSelected ? option.color : isDark ? 'rgba(255,255,255,0.1)' : 'divider',
              bgcolor: isSelected
                ? `${option.color}18`
                : isDark
                  ? 'rgba(255,255,255,0.03)'
                  : 'background.paper',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
              userSelect: 'none',
              '&:hover': !disabled
                ? {
                    borderColor: option.color,
                    bgcolor: `${option.color}10`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 16px ${option.color}28`,
                  }
                : {},
            }}
          >
            {/* Color chip with icon */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: isSelected ? option.color : `${option.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#fff' : option.color,
                flexShrink: 0,
                transition: 'all 0.2s ease',
                fontWeight: 900,
                fontSize: '0.75rem',
                letterSpacing: 0.5,
              }}
            >
              {option.icon}
            </Box>

            {/* Labels */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color: isSelected ? option.color : 'text.primary', lineHeight: 1.2 }}
              >
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {option.method === PaymentMethod.CARD
                  ? 'Visa, Mastercard, etc.'
                  : 'Paiement mobile instantané'}
              </Typography>
            </Box>

            {/* Selection indicator */}
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: isSelected ? option.color : isDark ? 'rgba(255,255,255,0.2)' : 'grey.300',
                bgcolor: isSelected ? option.color : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {isSelected && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                  }}
                />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
