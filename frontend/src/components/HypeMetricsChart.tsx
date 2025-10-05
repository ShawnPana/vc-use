import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import { useTheme } from "@/hooks/useTheme";
import { ParsedMetric, formatMetricValue } from "@/utils/hype";

interface HypeMetricsChartProps {
  metrics: ParsedMetric[];
}

export function HypeMetricsChart({ metrics }: HypeMetricsChartProps) {
  const numericMetrics = useMemo(
    () =>
      metrics
        .filter((metric) => metric.valueNumeric && Number.isFinite(metric.valueNumeric))
        .map((metric) => ({
          name: metric.label.length > 22 ? `${metric.label.slice(0, 19)}…` : metric.label,
          fullLabel: metric.label,
          value: metric.valueNumeric as number,
          displayValue: formatMetricValue(metric),
        })),
    [metrics]
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#333333" : "#e5e7eb";
  const barColor = isDark ? "#34d399" : "#10b981";
  const axisColor = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#1f1f1f" : "#ffffff";
  const tooltipBorder = isDark ? "#404040" : "#e5e7eb";

  if (numericMetrics.length >= 1) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={numericMetrics}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="name"
            stroke={axisColor}
            style={{ fontSize: "0.75rem" }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: "0.75rem" }}
            tickFormatter={(value: number) => {
              if (value >= 1_000_000_000) {
                return `${(value / 1_000_000_000).toFixed(1)}B`;
              }
              if (value >= 1_000_000) {
                return `${(value / 1_000_000).toFixed(1)}M`;
              }
              if (value >= 1_000) {
                return `${(value / 1_000).toFixed(1)}K`;
              }
              return value.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: axisColor,
            }}
            formatter={(_value: number, _name: string, props: any) => [
              props.payload.displayValue,
              props.payload.fullLabel,
            ]}
          />
          <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (metrics.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "160px",
          color: "var(--color-muted-foreground)",
          fontSize: "0.9rem",
        }}
      >
        No traction metrics available yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
      }}
    >
      {metrics.slice(0, 4).map((metric: ParsedMetric, index: number) => (
        <div
          key={`${metric.label}-${index}`}
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            background: "var(--color-card)",
            gap: "0.35rem",
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {metric.label}
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--color-muted-foreground)",
            }}
          >
            {formatMetricValue(metric)}
          </span>
        </div>
      ))}
    </div>
  );
}
