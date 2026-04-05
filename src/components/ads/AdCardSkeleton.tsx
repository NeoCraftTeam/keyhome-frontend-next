'use client';

import { Box, useTheme } from '@mui/material';

export default function AdCardSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shimmerBg = isDark
    ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)'
    : 'linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 100%)';

  const shimmerBase = {
    background: shimmerBg,
    backgroundSize: '200% 100%',
    animation: 'adCardShimmer 1.5s ease-in-out infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  };

  return (
    <Box
      sx={{
        width: '100%',
        '@keyframes adCardShimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      }}
    >
      {/* Image placeholder */}
      <Box
        sx={{
          width: '100%',
          paddingTop: '66.67%',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: isDark ? 'grey.800' : 'grey.100',
          ...shimmerBase,
        }}
      />

      {/* Text content */}
      <Box
        sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}
      >
        {/* Title row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              height: 14,
              width: '65%',
              borderRadius: 1,
              ...shimmerBase,
            }}
          />
          <Box
            sx={{
              height: 12,
              width: '16%',
              borderRadius: 1,
              ...shimmerBase,
            }}
          />
        </Box>

        {/* Location */}
        <Box
          sx={{
            height: 13,
            width: '50%',
            borderRadius: 1,
            ...shimmerBase,
          }}
        />

        {/* Features row */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
          <Box
            sx={{ height: 11, width: '18%', borderRadius: 1, ...shimmerBase }}
          />
          <Box
            sx={{ height: 11, width: '18%', borderRadius: 1, ...shimmerBase }}
          />
          <Box
            sx={{ height: 11, width: '22%', borderRadius: 1, ...shimmerBase }}
          />
        </Box>

        {/* Price row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.25,
          }}
        >
          <Box
            sx={{ height: 14, width: '40%', borderRadius: 1, ...shimmerBase }}
          />
          <Box
            sx={{ height: 20, width: 36, borderRadius: 1, ...shimmerBase }}
          />
        </Box>
      </Box>
    </Box>
  );
}
