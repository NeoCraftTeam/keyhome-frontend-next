'use client';

import { Box, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ChartDatum = { label: string; fullDate: string; views: number; favorites: number };

const VIEWS_COLOR = '#14b8a6';
const FAVORITES_COLOR = '#3b82f6';

/** Interprète fullDate (YYYY-MM-DD) en date locale sans décalage UTC (corrige tooltip « un jour en moins »). */
function formatChartTooltipDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) {
    return isoDate;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTooltipValue(value: number | string | ReadonlyArray<number | string> | undefined): string {
  if (value === undefined || value === null) {
    return '0';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('fr-FR');
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('fr-FR') : value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'number' ? v.toLocaleString('fr-FR') : String(v))).join(', ');
  }
  return String(value);
}

export default function OwnerViewsFavoritesAreaChart({
  data,
  loading,
}: {
  data: ChartDatum[];
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const chartHeight = isXs ? 220 : isMdDown ? 280 : 320;
  const gridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const axisColor = theme.palette.text.secondary;
  const tooltipBg = isDark ? theme.palette.grey[900] : '#fff';
  const tooltipBorder = theme.palette.divider;

  if (loading) {
    return <Skeleton variant="rounded" height={chartHeight} sx={{ borderRadius: 2, width: '100%' }} />;
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0, height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={data} margin={{ top: 12, right: isXs ? 4 : 8, left: isXs ? 4 : 0, bottom: isXs ? 4 : 8 }}>
        <defs>
          <linearGradient id="ownerViewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VIEWS_COLOR} stopOpacity={0.35} />
            <stop offset="100%" stopColor={VIEWS_COLOR} stopOpacity={0.06} />
          </linearGradient>
          <linearGradient id="ownerFavFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FAVORITES_COLOR} stopOpacity={0.3} />
            <stop offset="100%" stopColor={FAVORITES_COLOR} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis
          dataKey="label"
          tick={{ fill: axisColor, fontSize: isXs ? 9 : 11 }}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
          interval="preserveStartEnd"
          minTickGap={isXs ? 8 : 24}
          angle={isXs ? -35 : 0}
          textAnchor={isXs ? 'end' : 'middle'}
          height={isXs ? 52 : 30}
        />
        <YAxis
          tick={{ fill: axisColor, fontSize: isXs ? 10 : 11 }}
          tickLine={false}
          axisLine={false}
          width={isXs ? 28 : 36}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${tooltipBorder}`,
            boxShadow: theme.shadows[4],
            background: tooltipBg,
          }}
          labelStyle={{ fontWeight: 700, marginBottom: 4 }}
          formatter={(value, name) => [
            formatTooltipValue(value),
            name === 'views' ? 'Vues' : 'Favoris',
          ]}
          labelFormatter={(_label, payload) => {
            const row = payload?.[0]?.payload as ChartDatum | undefined;
            return row?.fullDate ? formatChartTooltipDate(row.fullDate) : '';
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (value === 'views' ? 'Vues' : 'Favoris')}
          wrapperStyle={{ paddingTop: 8, fontSize: isXs ? 11 : 13 }}
        />
        <Area
          name="views"
          type="monotone"
          dataKey="views"
          stroke={VIEWS_COLOR}
          strokeWidth={2}
          fill="url(#ownerViewsFill)"
          fillOpacity={1}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          name="favorites"
          type="monotone"
          dataKey="favorites"
          stroke={FAVORITES_COLOR}
          strokeWidth={2}
          fill="url(#ownerFavFill)"
          fillOpacity={1}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </Box>
  );
}
