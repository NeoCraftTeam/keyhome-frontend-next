'use client';

import type { PointPackage } from '@/types';
import { CheckCircleRounded, LocalFireDepartment, Toll, WorkspacePremium } from '@mui/icons-material';
import { Box, Button, Chip, CircularProgress, Typography, useTheme } from '@mui/material';
import { neutral } from '@/theme/tokens';

export default function PackageCard({
  pkg,
  loading,
  onPurchase,
  wouldBeEnough,
}: {
  pkg: PointPackage;
  loading: boolean;
  onPurchase: (pkg: PointPackage) => void;
  wouldBeEnough?: boolean;
}) {
  const theme = useTheme();
  const isPopular = pkg.is_popular;
  const isPremium = !isPopular && !wouldBeEnough && (pkg.points_awarded ?? 0) >= 100;
  const isDark = theme.palette.mode === 'dark';

  const gradient = wouldBeEnough
    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, #1B5E20 100%)`
    : isPopular
      ? (theme.palette.gradient?.primary135 ?? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`)
      : isPremium
        ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.primary.dark} 100%)`
        : isDark
          ? `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`
          : `linear-gradient(135deg, ${theme.palette.grey[500]} 0%, ${theme.palette.grey[600]} 100%)`;

  const glowColor = wouldBeEnough
    ? `${theme.palette.success.main}40`
    : isPopular
      ? `${theme.palette.primary.main}50`
      : isPremium
        ? `${theme.palette.primary.main}35`
        : isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.12)';

  return (
    <Box
      onClick={() => !loading && onPurchase(pkg)}
      sx={{
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: loading ? 'wait' : 'pointer',
        background: gradient,
        boxShadow: `0 8px 32px ${glowColor}`,
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: `0 16px 48px ${glowColor}`,
        },
        '&:active': { transform: 'scale(0.98)' },
      }}
    >
      {/* Decorative blobs */}
      <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -30, left: -15, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      {/* Badge row */}
      <Box sx={{ px: 2, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {wouldBeEnough ? (
            <CheckCircleRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.95)' }} />
          ) : isPopular ? (
            <LocalFireDepartment sx={{ fontSize: 18, color: 'rgba(255,255,255,0.95)' }} />
          ) : isPremium ? (
            <WorkspacePremium sx={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
          ) : (
            <Toll sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
          )}
          <Typography variant="caption" fontWeight={800} sx={{
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem',
          }}>
            {wouldBeEnough ? 'Suffisant' : pkg.badge ?? (isPopular ? 'Le + populaire' : isPremium ? 'Meilleur rapport' : 'Starter')}
          </Typography>
        </Box>
        {pkg.points_awarded > 10 && !wouldBeEnough && (
          <Chip
            label={`-${Math.round((1 - pkg.price / (pkg.points_awarded * 100)) * 100)}%`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: neutral.white, fontWeight: 800, fontSize: '0.65rem', height: 20 }}
          />
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: neutral.white, letterSpacing: -0.3, lineHeight: 1.1, mb: 0.5 }}>
          {pkg.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: neutral.white, letterSpacing: -1, lineHeight: 1 }}>
            {pkg.points_awarded}
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            credits
          </Typography>
        </Box>

        {pkg.description && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: 1.4, mb: 1.5 }}>
            {pkg.description}
          </Typography>
        )}

        {pkg.features && pkg.features.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
            {pkg.features.map((feature, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                <CheckCircleRounded sx={{
                  fontSize: 14, mt: 0.1, flexShrink: 0,
                  color: 'rgba(255,255,255,0.85)',
                }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', lineHeight: 1.3 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Price + CTA */}
        <Box sx={{
          mt: 'auto', pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
        }}>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: neutral.white, letterSpacing: -0.5, lineHeight: 1 }}>
              {pkg.price.toLocaleString('fr-FR')}
              <Typography component="span" variant="caption" fontWeight={700} sx={{ ml: 0.4, color: 'rgba(255,255,255,0.6)' }}>
                FCFA
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
              {Math.round(pkg.price / pkg.points_awarded).toLocaleString('fr-FR')} FCFA/credit
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); onPurchase(pkg); }}
            sx={{
              borderRadius: 2.5, textTransform: 'none', fontWeight: 800, fontSize: '0.82rem',
              px: 2.5, py: 0.75, bgcolor: 'rgba(255,255,255,0.22)', color: neutral.white,
              backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading ? <CircularProgress size={15} sx={{ color: neutral.white }} /> : 'Acheter'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
