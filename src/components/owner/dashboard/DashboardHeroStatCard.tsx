'use client';

import MiniMetricSparkline from '@/components/owner/dashboard/MiniMetricSparkline';
import { TrendingDown as DownIcon, TrendingUp as UpIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Skeleton, Typography } from '@mui/material';

export default function DashboardHeroStatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  sparklineData,
  loading,
  change,
}: {
  title: string;
  value: string | number;
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
        overflow: 'visible',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -4, sm: -2 },
          right: { xs: -4, sm: -2 },
          zIndex: 1,
          width: { xs: 44, sm: 48 },
          height: { xs: 44, sm: 48 },
          borderRadius: '50%',
          bgcolor: accentColor,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: (t) => `0 10px 24px ${accentColor}55, ${t.shadows[2]}`,
        }}
      >
        {icon}
      </Box>
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          pt: { xs: 2, sm: 2.5 },
          pr: { xs: 7, sm: 8 },
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
            sx={{ textTransform: 'none', letterSpacing: 0.2, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" sx={{ width: { xs: 56, sm: 72 }, height: { xs: 36, sm: 42 }, mt: 0.5 }} />
          ) : (
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
          )}
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, display: 'block', fontSize: { xs: '0.68rem', sm: '0.75rem' }, lineHeight: 1.35 }}
            >
              {subtitle}
            </Typography>
          )}
          {change != null && !loading && change !== 0 && (
            <Chip
              icon={change > 0 ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />}
              label={`${change > 0 ? '+' : ''}${change.toFixed(0)}%`}
              size="small"
              color={change > 0 ? 'success' : 'error'}
              variant="outlined"
              sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
          )}
        </Box>
        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            mx: { xs: -1, sm: -0.5 },
            width: '100%',
            minWidth: 0,
            opacity: loading ? 0.3 : 1,
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
          ) : (
            <MiniMetricSparkline data={sparklineData} color={accentColor} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
