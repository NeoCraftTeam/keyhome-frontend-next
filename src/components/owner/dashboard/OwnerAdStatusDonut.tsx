'use client';

import { Box, Skeleton, Typography, useTheme } from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type AdStatusDatum = { label: string; value: number; color: string };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#14b8a6' },
  pending: { label: 'En attente', color: '#f59e0b' },
  reserved: { label: 'Réservé', color: '#6366f1' },
  rented: { label: 'Loué', color: '#10b981' },
  sold: { label: 'Vendu', color: '#3b82f6' },
  archived: { label: 'Archivé', color: '#94a3b8' },
};

export function buildAdStatusData(ads: { status: string }[]): AdStatusDatum[] {
  const counts: Record<string, number> = {};
  for (const ad of ads) {
    counts[ad.status] = (counts[ad.status] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([status, value]) => ({
      label: STATUS_CONFIG[status]?.label ?? status,
      value,
      color: STATUS_CONFIG[status]?.color ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);
}

export default function OwnerAdStatusDonut({
  data,
  total,
  loading,
}: {
  data: AdStatusDatum[];
  total: number;
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const tooltipBg = isDark ? theme.palette.grey[900] : '#fff';
  const tooltipBorder = theme.palette.divider;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <Skeleton variant="circular" width={140} height={140} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={18} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Aucune annonce pour le moment.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Donut */}
      <Box sx={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={62}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${tooltipBorder}`,
                background: tooltipBg,
                fontSize: 12,
              }}
              formatter={(value, _name, props) => [
                `${value} annonce${Number(value) > 1 ? 's' : ''}`,
                props.payload?.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h6" fontWeight={800} lineHeight={1}>
            {total}
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
            biens
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ flex: 1, minWidth: 100, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {data.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Box>
            <Typography variant="caption" fontWeight={700}>{item.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
