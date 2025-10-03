import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  name: string;
  icon: LucideIcon;
  gradient: string;
  analysis: string;
  status: "loading" | "completed" | "error";
  delay?: number;
}

export default function AgentCard({
  name,
  icon: Icon,
  gradient: _gradient,
  analysis,
  status,
  delay = 0,
}: AgentCardProps) {
  return (
    <div
      className="agent-card"
      style={{
        animationDelay: `${delay}ms`,
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        padding: "24px",
        backgroundColor: "white",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            padding: "8px",
            borderRadius: "8px",
            backgroundColor: "black",
          }}
        >
          <Icon style={{ width: "20px", height: "20px", color: "white" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "600", color: "black" }}>{name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            {status === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#737373", fontSize: "14px" }}>
                <div className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
                <span>Analyzing</span>
              </div>
            )}
            {status === "completed" && <span style={{ color: "#737373", fontSize: "14px" }}>✓ Complete</span>}
            {status === "error" && <span style={{ color: "#dc2626", fontSize: "14px" }}>⚠ Error</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginTop: "16px" }}>
        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ height: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", width: "100%" }}></div>
            <div style={{ height: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", width: "83%" }}></div>
            <div style={{ height: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", width: "66%" }}></div>
          </div>
        )}
        {status === "completed" && (
          <p style={{ color: "#404040", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{analysis}</p>
        )}
        {status === "error" && <p style={{ color: "#dc2626", fontSize: "14px" }}>{analysis}</p>}
      </div>
    </div>
  );
}
