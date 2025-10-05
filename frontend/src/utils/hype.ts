export interface ParsedMetric {
  label: string;
  rawValue: string;
  valueNumeric?: number;
}

const CURRENCY_REGEX = /(?:(?:usd|us\$)\s*)?(\$|€|£)?\s*(\d[\d,\.]*)(\s?(?:billion|million|thousand|bn|m|b|k))?/i;

const LINE_SPLIT_REGEX = /[\r\n]+/;

const DELIMITER_REGEX = /[:\u2013\-]\s*/; // colon, en dash, or hyphen followed by space

function sanitizeLine(line: string): string {
  return line.replace(/^[\s\-\*•\u2022]+/, "").trim();
}

function extractNumericValue(text: string): number | undefined {
  const match = text.match(CURRENCY_REGEX);
  if (!match) {
    return undefined;
  }

  const raw = match[2]?.replace(/,/g, "");
  if (!raw) {
    return undefined;
  }

  const base = Number(raw);
  if (Number.isNaN(base)) {
    return undefined;
  }

  const unit = match[3]?.trim().toLowerCase();
  switch (unit) {
    case "billion":
    case "bn":
    case "b":
      return base * 1_000_000_000;
    case "million":
    case "m":
      return base * 1_000_000;
    case "thousand":
    case "k":
      return base * 1_000;
    default:
      return base;
  }
}

export function parseHypeNumbers(numbers?: string | null): ParsedMetric[] {
  if (!numbers) {
    return [];
  }

  const normalized = numbers
    .replace(/•/g, "\n")
    .replace(/\u2022/g, "\n");

  const lines = normalized
    .split(LINE_SPLIT_REGEX)
    .map(sanitizeLine)
    .filter(Boolean);

  const metrics: ParsedMetric[] = lines.map((line) => {
    const delimiterMatch = line.match(DELIMITER_REGEX);

    if (delimiterMatch) {
      const delimiter = delimiterMatch[0];
      const index = line.indexOf(delimiter);
      const label = line.slice(0, index).trim();
      const rawValue = line.slice(index + delimiter.length).trim();
      return {
        label: label || rawValue,
        rawValue,
        valueNumeric: extractNumericValue(line),
      };
    }

    return {
      label: line,
      rawValue: line,
      valueNumeric: extractNumericValue(line),
    };
  });

  return metrics;
}

const FUNDING_KEYWORDS = [
  "funding",
  "round",
  "series",
  "seed",
  "raise",
  "raised",
];

function isFundingMetric(metric: ParsedMetric): boolean {
  const haystack = `${metric.label} ${metric.rawValue}`.toLowerCase();
  return FUNDING_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function getLatestFundingMetric(metrics: ParsedMetric[]): ParsedMetric | null {
  if (!metrics.length) {
    return null;
  }

  const fundingMetrics = metrics.filter(isFundingMetric);
  const candidates = fundingMetrics.length ? fundingMetrics : metrics.filter((m) => m.valueNumeric);

  if (!candidates.length) {
    return null;
  }

  const sorted = [...candidates].sort((a, b) => {
    const aValue = a.valueNumeric ?? -Infinity;
    const bValue = b.valueNumeric ?? -Infinity;
    return bValue - aValue;
  });

  return sorted[0] || null;
}

export function formatMetricValue(metric: ParsedMetric): string {
  if (metric.valueNumeric && Number.isFinite(metric.valueNumeric)) {
    const value = metric.valueNumeric;

    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }

    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }

    return `$${value.toFixed(0)}`;
  }

  return metric.rawValue;
}
