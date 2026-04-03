'use client';

import { Box, type SxProps, type Theme } from '@mui/material';

interface ShimmerBoxProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  sx?: SxProps<Theme>;
}

/**
 * A single shimmer line/block — use to compose skeleton layouts.
 * The shimmer sweeps left-to-right using a CSS gradient animation.
 */
export function ShimmerBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  sx,
}: ShimmerBoxProps) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&::after': { animation: 'none' },
        },
        ...sx,
      }}
    />
  );
}

/**
 * Pre-built ad card skeleton — matches AdCard layout proportions.
 */
export function ShimmerAdCard() {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Image area — 3:2 ratio like AdCard */}
      <ShimmerBox
        height={0}
        sx={{
          paddingTop: '66.67%',
          height: 'auto',
          borderRadius: '12px',
          mb: 1.5,
        }}
      />
      {/* Title */}
      <ShimmerBox height={14} width="80%" sx={{ mb: 0.75 }} />
      {/* Subtitle */}
      <ShimmerBox height={12} width="55%" sx={{ mb: 0.75 }} />
      {/* Features row */}
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
        <ShimmerBox height={10} width={48} borderRadius={6} />
        <ShimmerBox height={10} width={48} borderRadius={6} />
        <ShimmerBox height={10} width={48} borderRadius={6} />
      </Box>
      {/* Price */}
      <ShimmerBox height={16} width="40%" />
    </Box>
  );
}

/**
 * Owner stat card skeleton.
 */
export function ShimmerStatCard() {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <ShimmerBox height={12} width="50%" sx={{ mb: 1.5 }} />
      <ShimmerBox height={32} width="60%" sx={{ mb: 1 }} />
      <ShimmerBox height={10} width="40%" />
    </Box>
  );
}
