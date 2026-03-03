'use client';

import type { PointPackage } from '@/types';
import { CheckCircle, Toll } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';

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
  const isPopular = pkg.is_popular;

  const borderColor = wouldBeEnough
    ? 'success.light'
    : isPopular
      ? 'primary.main'
      : 'divider';

  return (
    <Box
      sx={{
        position: 'relative',
        border: '1.5px solid',
        borderColor,
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: wouldBeEnough
          ? 'rgba(0,138,5,0.03)'
          : isPopular
            ? 'rgba(246,71,95,0.02)'
            : 'transparent',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: isPopular
            ? '0 6px 20px rgba(246,71,95,0.18)'
            : '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Top accent bar for popular */}
      {isPopular && !wouldBeEnough && (
        <Box
          sx={{
            height: 3,
            background: 'linear-gradient(to right, #F6475F, #D93A50)',
          }}
        />
      )}

      {/* Sufficient accent bar */}
      {wouldBeEnough && (
        <Box
          sx={{
            height: 3,
            bgcolor: 'success.main',
          }}
        />
      )}

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header: Name + Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, flex: 1 }}>
            {pkg.name}
          </Typography>

          {pkg.badge && !wouldBeEnough && (
            <Chip
              label={pkg.badge}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.6rem',
                height: 22,
                bgcolor: isPopular ? 'primary.main' : 'warning.main',
                color: '#fff',
                letterSpacing: 0.3,
              }}
            />
          )}

          {wouldBeEnough && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14, color: '#fff !important' }} />}
              label="Suffisant"
              size="small"
              sx={{
                bgcolor: 'success.main',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.6rem',
                height: 22,
              }}
            />
          )}
        </Box>

        {/* Credits amount */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'rgba(246,71,95,0.08)',
            borderRadius: 1.5,
            px: 1,
            py: 0.35,
            mb: 1,
          }}
        >
          <Toll sx={{ fontSize: 15, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {pkg.points_awarded} crédits
          </Typography>
        </Box>

        {/* Description */}
        {pkg.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'block', mb: 1.25, lineHeight: 1.4, fontSize: '0.8rem' }}
          >
            {pkg.description}
          </Typography>
        )}

        {/* Features */}
        {pkg.features && pkg.features.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
            {pkg.features.map((feature, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckCircle sx={{ fontSize: 13, color: 'success.main', flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Divider */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
                {pkg.price.toLocaleString('fr-FR')}
                <Typography component="span" variant="caption" fontWeight={600} sx={{ ml: 0.5 }}>
                  FCFA
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {Math.round(pkg.price / pkg.points_awarded).toLocaleString('fr-FR')} FCFA/crédit
              </Typography>
            </Box>
            <Button
              size="small"
              variant={isPopular ? 'contained' : 'outlined'}
              onClick={() => onPurchase(pkg)}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                px: 2.5,
                py: 0.6,
                ...(isPopular && {
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                  '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                }),
                ...(!isPopular && {
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(246,71,95,0.04)' },
                }),
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {loading ? (
                <CircularProgress size={16} sx={{ color: isPopular ? '#fff' : 'primary.main' }} />
              ) : (
                'Acheter'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
