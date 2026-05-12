'use client';

import { brandAgent, neutral } from '@/theme/tokens';
import { Box, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type UnlockDatum = { label: string; unlocks: number };

export default function OwnerUnlocksBarChart({
  data,
  loading,
}: {
  data: UnlockDatum[];
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isXs ? 180 : 220;
  const gridStroke = alpha(
    isDark ? neutral.white : theme.palette.common.black,
    isDark ? 0.07 : 0.05
  );
  const axisColor = theme.palette.text.secondary;
  const tooltipBg = theme.palette.background.paper;
  const tooltipBorder = theme.palette.divider;

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        height={chartHeight}
        sx={{ borderRadius: 2, width: '100%' }}
      />
    );
  }

  const maxVal = Math.max(...data.map((d) => d.unlocks), 1);

  return (
    <Box sx={{ width: '100%', minWidth: 0, height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={data}
          margin={{
            top: 4,
            right: isXs ? 4 : 8,
            left: isXs ? -8 : 0,
            bottom: isXs ? 4 : 8,
          }}
          barSize={isXs ? 8 : 12}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={gridStroke}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: isXs ? 9 : 11 }}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            interval="preserveStartEnd"
            minTickGap={isXs ? 8 : 20}
            angle={isXs ? -30 : 0}
            textAnchor={isXs ? 'end' : 'middle'}
            height={isXs ? 42 : 28}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: isXs ? 10 : 11 }}
            tickLine={false}
            axisLine={false}
            width={isXs ? 24 : 32}
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
            formatter={(value) => [value, 'Déverrouillages']}
            cursor={{
              fill: alpha(
                isDark ? neutral.white : theme.palette.common.black,
                0.04
              ),
            }}
          />
          <Bar dataKey="unlocks" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.unlocks === maxVal
                    ? brandAgent.primary
                    : isDark
                      ? alpha(brandAgent.primary, 0.45)
                      : alpha(brandAgent.primary, 0.55)
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
