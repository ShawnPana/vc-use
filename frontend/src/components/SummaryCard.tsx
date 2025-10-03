import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  icon: LucideIcon;
  content: string;
  isLoading: boolean;
  delay?: number;
}

export default function SummaryCard({
  title,
  icon: Icon,
  content,
  isLoading,
  delay = 0,
}: SummaryCardProps) {
  return (
    <article className="summary-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="summary-card__header">
        <span className="summary-card__icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h3 className="summary-card__title">{title}</h3>
          {isLoading ? (
            <div className="skeleton-lines" aria-label="Loading summary">
              <span className="skeleton-line" />
              <span className="skeleton-line" style={{ width: "75%" }} />
            </div>
          ) : (
            <p className="summary-card__content">{content}</p>
          )}
        </div>
      </div>
    </article>
  );
}
