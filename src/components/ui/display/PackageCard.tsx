'use client';

import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { Price } from '@/components/ui/typography/Price';
import { neutral } from '@/theme/tokens';
import type { PointPackage } from '@/types';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Toll from '@mui/icons-material/Toll';
import WorkspacePremium from '@mui/icons-material/WorkspacePremium';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';

export default function PackageCard({
  pkg,
  loading,
  onPurchase,
  wouldBeEnough,
  compact = false,
  dense = false,
}: {
  pkg: PointPackage;
  loading: boolean;
  onPurchase: (pkg: PointPackage) => void;
  wouldBeEnough?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  const theme = useTheme();
  const isPopular = pkg.is_popular;
  const isPremium =
    !isPopular && !wouldBeEnough && (pkg.points_awarded ?? 0) >= 100;
  const isDark = theme.palette.mode === 'dark';
  const discount = Math.round(
    (1 - pkg.price / (pkg.points_awarded * 100)) * 100
  );

  const gradient = wouldBeEnough
    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, #1B5E20 100%)`
    : isPopular
      ? (theme.palette.gradient?.primary135 ??
        `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`)
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
        borderRadius: compact ? 2.5 : 4,
        overflow: 'hidden',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: loading ? 'wait' : 'pointer',
        background: gradient,
        boxShadow: `0 8px 32px ${glowColor}`,
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        // Shine sweep on hover
        '&::before':
          isPopular || wouldBeEnough
            ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-75%',
                width: '60%',
                height: '100%',
                background:
                  'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
                transition: 'left 0.5s ease',
                pointerEvents: 'none',
                zIndex: 1,
              }
            : {},
        '&:hover::before':
          isPopular || wouldBeEnough
            ? {
                left: '130%',
              }
            : {},
        height: '100%',
        minHeight: 0,
        '&:hover': {
          transform: compact ? 'none' : 'translateY(-3px)',
          boxShadow: `0 20px 56px ${glowColor}`,
        },
        '&:active': { transform: 'scale(0.98)' },
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -15,
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* Original diagonal marker: kept separate from the discount chip. */}
      {isPopular && (
        <Box
          sx={{
            position: 'absolute',
            top: compact ? 10 : 16,
            right: -24,
            width: 90,
            bgcolor: 'rgba(255,255,255,0.28)',
            backdropFilter: 'blur(4px)',
            transform: 'rotate(35deg)',
            textAlign: 'center',
            py: '3px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            ⭐ Top
          </Typography>
        </Box>
      )}

      {/* Badge row */}
      <Box
        sx={{
          px: compact ? 1.5 : 2,
          pt: compact ? 1.25 : dense ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            minWidth: 0,
          }}
        >
          {wouldBeEnough ? (
            <CheckCircleRounded
              sx={{ fontSize: 18, color: 'rgba(255,255,255,0.95)' }}
            />
          ) : isPopular ? (
            <LocalFireDepartment
              sx={{ fontSize: 18, color: 'rgba(255,255,255,0.95)' }}
            />
          ) : isPremium ? (
            <WorkspacePremium
              sx={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}
            />
          ) : (
            <Toll sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
          )}
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: '0.62rem',
              lineHeight: 1.25,
            }}
          >
            {wouldBeEnough
              ? 'Suffisant'
              : (pkg.badge ??
                (isPopular
                  ? 'Le + populaire'
                  : isPremium
                    ? 'Meilleur rapport'
                    : 'Starter'))}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.5,
            flexShrink: 0,
          }}
        >
          {pkg.points_awarded > 10 && !wouldBeEnough && discount > 0 && (
            <Chip
              label={`−${discount}%`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: neutral.white,
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 22,
                mr: isPopular ? 5 : 0,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          px: compact ? 1.5 : 2,
          pt: compact ? 0.75 : dense ? 0.75 : 1.25,
          pb: compact ? 1.25 : dense ? 1 : 1.5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: neutral.white,
            letterSpacing: -0.3,
            lineHeight: 1.1,
            mb: compact || dense ? 0.25 : 0.5,
            fontSize: compact ? '0.95rem' : undefined,
            overflowWrap: 'anywhere',
          }}
        >
          {pkg.name}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
            mb: compact ? 0.5 : dense ? 0.75 : 1.5,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              color: neutral.white,
              letterSpacing: -1,
              lineHeight: 1,
              fontSize: compact ? '1.45rem' : undefined,
            }}
          >
            {pkg.points_awarded}
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {pkg.points_awarded > 1 ? 'crédits' : 'crédit'}
          </Typography>
        </Box>

        {pkg.description && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: compact ? '0.8rem' : dense ? '0.75rem' : '0.8rem',
              lineHeight: compact ? 1.35 : dense ? 1.35 : 1.5,
              mb: compact ? 0.75 : dense ? 0.75 : 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {pkg.description}
          </Typography>
        )}

        {pkg.features && pkg.features.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: compact ? 0.45 : dense ? 0.35 : 0.6,
              mb: compact ? 0.75 : dense ? 0.75 : 1.25,
              minHeight: 0,
            }}
          >
            {pkg.features.map((feature, idx) => (
              <Box
                key={idx}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}
              >
                <CheckCircleRounded
                  sx={{
                    fontSize: compact ? 11 : dense ? 12 : 14,
                    mt: 0.1,
                    flexShrink: 0,
                    color: 'rgba(255,255,255,0.85)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: compact
                      ? '0.75rem'
                      : dense
                        ? '0.72rem'
                        : '0.78rem',
                    lineHeight: compact ? 1.25 : dense ? 1.25 : 1.4,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Price + CTA */}
        <Box
          sx={{
            mt: 'auto',
            pt: compact ? 0.75 : dense ? 0.75 : 1.5,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="div"
              fontWeight={900}
              sx={{ color: neutral.white, letterSpacing: -0.5, lineHeight: 1 }}
            >
              <Price amountXAF={pkg.price} showOriginal />
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}
            >
              {Math.round(pkg.price / (pkg.points_awarded / 2)).toLocaleString(
                'fr-FR'
              )}{' '}
              FCFA/contact
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            disabled={loading}
            endIcon={
              loading ? null : (
                <ArrowForward sx={{ fontSize: '14px !important' }} />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              onPurchase(pkg);
            }}
            // The hover bg turns solid white for ALL variants, so the text
            // colour MUST be dark at rest *and* at hover — otherwise the
            // "Starter" button (which keeps white text on a 22% white bg at
            // rest) renders invisible when hovered. We compute one colour
            // that works in both states.
            sx={{
              borderRadius: 99,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: compact ? '0.72rem' : '0.8rem',
              px: compact ? 1.5 : 2,
              py: compact ? 0.5 : 0.65,
              minHeight: compact ? 36 : undefined,
              bgcolor:
                isPopular || wouldBeEnough
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.95)',
              color: wouldBeEnough ? '#1B5E20' : theme.palette.primary.dark,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              flexShrink: 0,
              boxShadow: isPopular ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
              '&:hover': {
                bgcolor: '#fff',
                color: wouldBeEnough ? '#1B5E20' : theme.palette.primary.dark,
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading ? (
              <ButtonSpinner size={14} />
            ) : wouldBeEnough ? (
              'Débloquer maintenant'
            ) : (
              'Acheter'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
