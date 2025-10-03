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
    <div
      className="summary-card"
      style={{
        animationDelay: `${delay}ms`,
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#f5f5f5" }}>
          <Icon style={{ width: "16px", height: "16px", color: "black" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "black" }}>{title}</h3>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ height: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px", width: "100%" }}></div>
              <div style={{ height: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px", width: "75%" }}></div>
            </div>
          ) : (
            <p style={{ color: "#737373", fontSize: "12px", lineHeight: "1.5" }}>{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
