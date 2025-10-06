import { ParsedMetric, formatMetricValue } from "@/utils/hype";

interface LatestFundingStatProps {
  latestMetric: ParsedMetric | null;
  metrics: ParsedMetric[];
  isLoading?: boolean;
}

export function LatestFundingStat({ latestMetric, metrics, isLoading = false }: LatestFundingStatProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          alignItems: "flex-start",
          justifyContent: "center",
          minHeight: "140px",
          color: "var(--color-muted-foreground)",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>Gathering traction metrics…</span>
      </div>
    );
  }

  if (!latestMetric) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          justifyContent: "center",
          minHeight: "140px",
          color: "var(--color-muted-foreground)",
        }}
      >
        <span style={{ fontSize: "0.95rem" }}>
          Traction metrics will appear here once research uncovers growth signals.
        </span>
      </div>
    );
  }

  const supportingMetrics = metrics
    .filter((metric) => metric !== latestMetric)
    .slice(0, 3);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "2.25rem",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#2dd4bf",
            textShadow: "0 8px 14px rgba(45, 212, 191, 0.25)",
          }}
        >
          {formatMetricValue(latestMetric)}
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: "var(--color-muted-foreground)",
            marginTop: "0.4rem",
          }}
        >
          {latestMetric.label}
        </div>
        {latestMetric.rawValue !== latestMetric.label && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--color-muted-foreground)",
              marginTop: "0.25rem",
            }}
          >
            {latestMetric.rawValue}
          </div>
        )}
      </div>

      {supportingMetrics.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
          }}
        >
          {supportingMetrics.map((metric, index) => (
            <div
              key={`${metric.label}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                padding: "0.65rem 0.75rem",
                background: "var(--color-card)",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-muted-foreground)",
                  textAlign: "right",
                }}
              >
                {formatMetricValue(metric)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
