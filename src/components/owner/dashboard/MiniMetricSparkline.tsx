'use client';

import { Box } from '@mui/material';
import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

const CHART_H = 36;

export default function MiniMetricSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const gradId = useId().replace(/:/g, '');
  const chartData = data.map((value, i) => ({ i: String(i), value }));
  const max = Math.max(...data, 1);

  return (
    <Box sx={{ width: '100%', minWidth: 0, height: CHART_H, overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, max * 1.15]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
