'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Portal from '@mui/material/Portal';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

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
}

export default function PublishingOverlay({
  open,
  title = 'En cours de publication…',
  subtitle = 'Ne quittez pas cette page — votre annonce est en cours de soumission.',
  Icon = CloudUploadOutlined,
  accentColor = brandAgent.primary,
}: PublishingOverlayProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Convert hex to rgba for backgrounds with opacity
  const bgAlpha = (opacity: number) => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  if (!open) return null;

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

          {/* Progress bar */}
          <LinearProgress
            sx={{
              my: 2.5,
              borderRadius: 2,
              height: 5,
              bgcolor: bgAlpha(isDark ? 0.12 : 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: accentColor,
              },
            }}
          />

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
