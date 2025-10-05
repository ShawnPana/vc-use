import { X } from "lucide-react";
import { ReactNode } from "react";

interface ExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function ExpandedModal({ isOpen, onClose, title, icon, children }: ExpandedModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "1.25rem",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          zIndex: 1001,
          animation: "slideIn 0.3s ease-out",
          boxShadow: "0 24px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "0.95rem",
                background: "var(--color-muted)",
                color: "var(--color-foreground)",
              }}
            >
              {icon}
            </span>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--color-foreground)",
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              cursor: "pointer",
              color: "var(--color-muted-foreground)",
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-muted)";
              e.currentTarget.style.color = "var(--color-foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-muted-foreground)";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "1.5rem",
            overflowY: "auto",
            color: "var(--color-muted-foreground)",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}