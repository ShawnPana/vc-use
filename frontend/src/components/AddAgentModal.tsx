import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AddAgentModalProps {
  onClose: () => void;
}

export function AddAgentModal({ onClose }: AddAgentModalProps) {
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [icon] = useState("brain");
  const [accent, setAccent] = useState("#818cf8");

  const upsertAgent = useMutation(api.mutations.upsertAgent);
  const agents = useQuery(api.queries.getAgents);

  const handleCreate = async () => {
    if (!agentId.trim() || !name.trim() || !prompt.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const maxOrder = agents?.reduce((max, a) => Math.max(max, a.order), 0) ?? 0;
      await upsertAgent({
        agentId: agentId.toLowerCase().replace(/\s+/g, '_'),
        name,
        prompt,
        icon,
        accent,
        isActive: true,
        order: maxOrder + 1,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create agent:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-card)",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-foreground)" }}>
            Add New Agent
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-muted-foreground)",
              padding: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <label
              htmlFor="agent-id"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-foreground)",
              }}
            >
              Agent ID *
            </label>
            <input
              id="agent-id"
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g., technical_advisor"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="agent-name"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-foreground)",
              }}
            >
              Agent Name *
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technical Advisor"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="agent-prompt"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-foreground)",
              }}
            >
              System Prompt *
            </label>
            <textarea
              id="agent-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the system prompt that defines this agent's role and behavior..."
              style={{
                width: "100%",
                minHeight: "150px",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="agent-accent"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "var(--color-foreground)",
                }}
              >
                Accent Color
              </label>
              <input
                id="agent-accent"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-foreground)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "var(--color-foreground)",
              color: "var(--color-background)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}
