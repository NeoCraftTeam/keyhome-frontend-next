'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Portal from '@mui/material/Portal';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { brandAgent } from '@/theme/tokens';

interface PublishingOverlayProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  /** MUI SvgIcon component to display. Defaults to CloudUploadOutlined. */
  Icon?: SvgIconComponent;
  /**
   * Accent colour for icon background, progress bar and icon. Defaults to the
   * owner teal (`brandAgent.primary`) — this is an owner-panel component, so it
   * must never fall back to the visitor coral brand.
   */
  accentColor?: string;
  /**
   * Optional real progress (0–100). When provided the bar is *controlled* and
   * reflects this value exactly. When omitted, the overlay simulates a smooth,
   * decelerating climb toward ~92% while `open` is true (Facebook / nprogress
   * style): the publish request rarely reports byte progress, so the
   * simulation gives a credible sense of movement instead of an indeterminate
   * bar that could spin forever.
   */
  progress?: number;
}

const SIMULATED_START = 8;
const SIMULATED_CEILING = 92;

export default function PublishingOverlay({
  open,
  title = 'En cours de publication…',
  subtitle = 'Ne quittez pas cette page — votre annonce est en cours de soumission.',
  Icon = CloudUploadOutlined,
  accentColor = brandAgent.primary,
  progress,
}: PublishingOverlayProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isControlled = typeof progress === 'number';

  const [simulated, setSimulated] = useState(SIMULATED_START);

  useEffect(() => {
    if (isControlled || !open) {
      setSimulated(SIMULATED_START);
      return;
    }

    setSimulated(SIMULATED_START);
    const id = setInterval(() => {
      setSimulated((prev) => {
        if (prev >= SIMULATED_CEILING) {
          return prev;
        }
        // Decelerating step: fast at first, crawling near the ceiling.
        const step = Math.max(0.5, (SIMULATED_CEILING - prev) * 0.12);
        return Math.min(SIMULATED_CEILING, prev + step);
      });
    }, 240);

    return () => clearInterval(id);
  }, [open, isControlled]);

  if (!open) {
    return null;
  }

  const value = isControlled
    ? Math.min(100, Math.max(0, progress as number))
    : simulated;
  const rounded = Math.round(value);

  // Convert hex to rgba for backgrounds with opacity
  const bgAlpha = (opacity: number) => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  return (
    <Portal>
      {/* Backdrop */}
      <Box
        role="status"
        aria-live="assertive"
        aria-label={title}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          bgcolor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,15,25,0.55)',
        }}
      >
        {/* Card */}
        <Box
          sx={{
            bgcolor: isDark ? 'grey.900' : 'background.paper',
            borderRadius: 4,
            p: { xs: 3.5, sm: 5 },
            maxWidth: 400,
            width: '88%',
            textAlign: 'center',
            boxShadow: isDark
              ? '0 32px 80px rgba(0,0,0,0.8)'
              : '0 32px 80px rgba(0,0,0,0.22)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {/* Animated icon */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: bgAlpha(0.1),
              mb: 2.5,
              animation: 'overlayPulse 1.8s ease-in-out infinite',
              '@keyframes overlayPulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.08)', opacity: 0.8 },
              },
            }}
          >
            <Icon sx={{ fontSize: 32, color: accentColor }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 0.75, color: 'text.primary' }}
          >
            {title}
          </Typography>

          {/* Progress bar with live percentage */}
          <Box sx={{ my: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                mb: 0.75,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                Progression
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: accentColor,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {rounded}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={value}
              sx={{
                borderRadius: 2,
                height: 6,
                bgcolor: bgAlpha(isDark ? 0.12 : 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: accentColor,
                  borderRadius: 2,
                  transition: 'transform 0.35s ease',
                },
              }}
            />
          </Box>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', lineHeight: 1.55 }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Portal>
  );
}
