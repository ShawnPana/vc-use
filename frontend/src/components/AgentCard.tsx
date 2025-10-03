import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  name: string;
  icon: LucideIcon;
  accent: string;
  analysis: string;
  status: "loading" | "completed" | "error";
  delay?: number;
}

export default function AgentCard({
  name,
  icon: Icon,
  accent,
  analysis,
  status,
  delay = 0,
}: AgentCardProps) {
  return (
    <article className="agent-card" style={{ animationDelay: `${delay}ms` }}>
      <header className="agent-card__header">
        <span
          className="agent-card__icon"
          style={{
            background: accent,
            color: "#0f172a",
            boxShadow: "0 18px 30px -22px rgba(15, 23, 42, 0.55)",
          }}
          aria-hidden="true"
        >
          <Icon />
        </span>
        <div>
          <h3 className="agent-card__title">{name}</h3>
          <div
            className={clsx("agent-card__status", {
              "agent-card__status--loading": status === "loading",
              "agent-card__status--complete": status === "completed",
              "agent-card__status--error": status === "error",
            })}
          >
            {status === "loading" && (
              <>
                <span className="loading-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
                <span>Analyzing</span>
              </>
            )}
            {status === "completed" && <span>✓ Complete</span>}
            {status === "error" && <span>⚠ Error</span>}
          </div>
        </div>
      </header>

      <div>
        {status === "loading" && (
          <div className="skeleton-lines" aria-label="Agent analysis loading">
            <span className="skeleton-line" />
            <span className="skeleton-line" style={{ width: "83%" }} />
            <span className="skeleton-line" style={{ width: "68%" }} />
          </div>
        )}
        {status === "completed" && (
          <p className="agent-card__body">{analysis}</p>
        )}
        {status === "error" && (
          <p className={clsx("agent-card__body", "agent-card__body--error")}>{analysis}</p>
        )}
      </div>
    </article>
  );
}
