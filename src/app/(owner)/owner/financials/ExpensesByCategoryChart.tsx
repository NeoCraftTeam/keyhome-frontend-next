'use client';

import { brandAgent, neutral, semantic } from '@/theme/tokens';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

const PIE_COLORS = [
  brandAgent.primary,
  semantic.warning,
  semantic.indigo,
  brandAgent.accent,
  semantic.successBright,
  neutral.slate400,
];

/**
 * Isolated recharts pie so the (heavy) charting library is code-split out of
 * the financials route's initial bundle and only fetched client-side on demand.
 */
export default function ExpensesByCategoryChart({
  data,
  formatValue,
}: {
  data: { name: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value) => [formatValue(Number(value ?? 0)), '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
