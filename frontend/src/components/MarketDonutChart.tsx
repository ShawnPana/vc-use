import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface MarketData {
  name: string;
  value: number;
  label: string;
  [key: string]: string | number;
}

interface MarketDonutChartProps {
  data: MarketData[];
}

export function MarketDonutChart({ data }: MarketDonutChartProps) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  // Colors for TAM/SAM/SOM
  const COLORS = ['#60a5fa', '#34d399', '#facc15'];

  const tooltipBg = isDark ? '#1f1f1f' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e7eb';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const legendTextColor = isDark ? '#e5e5e5' : '#3f3f46';

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    }
    return `$${value}`;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.8rem',
      }}>
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: legendTextColor,
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              borderRadius: '2px',
            }} />
            <span style={{ fontWeight: 500 }}>{entry.value}</span>
            <span style={{ marginLeft: 'auto', color: textColor }}>
              {formatCurrency(entry.payload.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: textColor,
          }}
          formatter={(value: number, _name: string, props: any) => [
            formatCurrency(value),
            props.payload.label
          ]}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          content={renderLegend}
          wrapperStyle={{
            paddingLeft: '1rem',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
