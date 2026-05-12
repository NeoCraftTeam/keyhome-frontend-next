'use client';

import MiniMetricSparkline from '@/components/owner/dashboard/MiniMetricSparkline';
import { ShimmerBox } from '@/components/ui/ShimmerCard';
import { useCountUp } from '@/hooks/useCountUp';
import {
  TrendingDown as DownIcon,
  TrendingUp as UpIcon,
} from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { neutral } from '@/theme/tokens';

/** Animated value display – uses count-up when `numericValue` is provided. */
function AnimatedValue({
  value,
  numericValue,
  accentColor: _accentColor,
}: {
  value: string | number;
  numericValue?: number;
  accentColor: string;
}) {
  const { value: counted, ref } = useCountUp({
    end: numericValue ?? 0,
    duration: 1100,
    triggerOnce: true,
  });

  if (numericValue == null) {
    return (
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{
          mt: 0.25,
          lineHeight: 1.15,
          fontSize: { xs: '1.5rem', sm: '2.125rem' },
        }}
      >
        {value}
      </Typography>
    );
  }

  // Extract prefix/suffix from the original formatted value string
  const strValue = String(value);
  const numStr = String(Math.floor(numericValue));
  const prefix = strValue.slice(
    0,
    strValue.indexOf(numStr.charAt(0)) !== -1
      ? strValue.indexOf(numStr.charAt(0))
      : 0
  );
  const suffix = strValue.replace(/[\d\s , .]+/g, '').trim();

  return (
    <Typography
      ref={ref as React.Ref<HTMLParagraphElement>}
      variant="h4"
      fontWeight={800}
      sx={{
        mt: 0.25,
        lineHeight: 1.15,
        fontSize: { xs: '1.5rem', sm: '2.125rem' },
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}
      {counted.toLocaleString('fr-FR')}
      {suffix}
    </Typography>
  );
}

export default function DashboardHeroStatCard({
  title,
  value,
  numericValue,
  subtitle,
  icon,
  accentColor,
  sparklineData,
  loading,
  change,
}: {
  title: string;
  value: string | number;
  /** Raw numeric value for count-up animation. Pass alongside a formatted `value`. */
  numericValue?: number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  sparklineData: number[];
  loading?: boolean;
  change?: number | null;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        height: '100%',
        borderRadius: { xs: 3, sm: 4 },
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        '&:hover': {
          boxShadow: `0 12px 32px ${accentColor}22`,
          transform: 'translateY(-3px)',
        },
        // Coloured accent strip along the top edge
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accentColor,
          zIndex: 1,
        },
      }}
    >
      {/* Floating icon badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2,
          width: { xs: 40, sm: 44 },
          height: { xs: 40, sm: 44 },
          borderRadius: 2.5,
          bgcolor: accentColor,
          color: neutral.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 6px 20px ${accentColor}44`,
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '.MuiCard-root:hover &': {
            transform: 'scale(1.08) rotate(-3deg)',
            boxShadow: `0 10px 28px ${accentColor}55`,
          },
        }}
      >
        {icon}
      </Box>

      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          pt: { xs: 2.5, sm: 3 },
          pr: { xs: 8, sm: 9 },
          pb: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontSize: '0.68rem',
            }}
          >
            {title}
          </Typography>

          {loading ? (
            <ShimmerBox
              height={38}
              width="60%"
              sx={{ mt: 1, mb: 0.5, borderRadius: '6px' }}
            />
          ) : (
            <AnimatedValue
              value={value}
              numericValue={numericValue}
              accentColor={accentColor}
            />
          )}

          {subtitle && !loading && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: 'block',
                fontSize: '0.7rem',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {change != null && !loading && change !== 0 && (
            <Chip
              icon={
                change > 0 ? (
                  <UpIcon sx={{ fontSize: 12 }} />
                ) : (
                  <DownIcon sx={{ fontSize: 12 }} />
                )
              }
              label={`${change > 0 ? '+' : ''}${change.toFixed(0)}%`}
              size="small"
              color={change > 0 ? 'success' : 'error'}
              variant="outlined"
              sx={{
                mt: 0.75,
                height: 20,
                fontSize: '0.63rem',
                fontWeight: 700,
              }}
            />
          )}
        </Box>

        {/* Sparkline */}
        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            mx: { xs: -1, sm: -0.5 },
            width: '100%',
            minWidth: 0,
          }}
        >
          {loading ? (
            <ShimmerBox
              height={32}
              sx={{ borderRadius: '6px', opacity: 0.5 }}
            />
          ) : (
            <MiniMetricSparkline data={sparklineData} color={accentColor} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
