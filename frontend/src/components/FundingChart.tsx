import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface FundingDataPoint {
  date: string;
  amount: number;
  round?: string;
}

interface FundingChartProps {
  data: FundingDataPoint[];
}

export function FundingChart({ data }: FundingChartProps) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const gridColor = isDark ? '#333333' : '#e5e7eb';
  const areaColor = isDark ? '#60a5fa' : '#3b82f6';
  const areaFillColor = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const tooltipBg = isDark ? '#1f1f1f' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e7eb';

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          stroke={textColor}
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis
          stroke={textColor}
          style={{ fontSize: '0.75rem' }}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: textColor,
          }}
          formatter={(value: number) => [formatCurrency(value), 'Funding']}
          labelStyle={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={areaColor}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
