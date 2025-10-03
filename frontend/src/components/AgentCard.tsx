import clsx from "clsx";
import { LucideIcon, Info } from "lucide-react";
import { useState } from "react";
import { AgentPromptModal } from "./AgentPromptModal";

interface AgentCardProps {
  agentId: string;
  name: string;
  icon: LucideIcon;
  accent: string;
  analysis: string;
  status: "loading" | "completed" | "error";
  delay?: number;
  prompt: string;
}

export default function AgentCard({
  agentId,
  name,
  icon: Icon,
  accent,
  analysis,
  status,
  delay = 0,
  prompt,
}: AgentCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
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
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 className="agent-card__title">{name}</h3>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-muted-foreground)",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-foreground)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-muted-foreground)"}
                title="Edit agent prompt"
              >
                <Info size={16} />
              </button>
            </div>
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

      <div className="agent-card__content">
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

    {showModal && (
      <AgentPromptModal
        agentId={agentId}
        agentName={name}
        currentPrompt={prompt}
        onClose={() => setShowModal(false)}
        canDelete={!!prompt}
        agentIcon={agentId}
        agentAccent={accent}
      />
    )}
    </>
  );
}
