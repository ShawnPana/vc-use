import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AgentPromptModalProps {
  agentId: string;
  agentName: string;
  currentPrompt: string;
  onClose: () => void;
  canDelete?: boolean;
  agentIcon?: string;
  agentAccent?: string;
}

export function AgentPromptModal({
  agentId,
  agentName,
  currentPrompt,
  onClose,
  canDelete = true,
  agentIcon,
  agentAccent,
}: AgentPromptModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateAgentPrompt = useMutation(api.mutations.updateAgentPrompt);
  const deleteAgent = useMutation(api.mutations.deleteAgent);

  const handleSave = async () => {
    try {
      await updateAgentPrompt({
        agentId,
        prompt,
        name: agentName,
        icon: agentIcon,
        accent: agentAccent,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update agent prompt:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAgent({ agentId });
      onClose();
    } catch (error) {
      console.error("Failed to delete agent:", error);
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
            Edit {agentName} Prompt
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

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="prompt-textarea"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--color-foreground)",
            }}
          >
            System Prompt
          </label>
          <textarea
            id="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: "100%",
              minHeight: "200px",
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

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: canDelete ? "space-between" : "flex-end" }}>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #f87171",
                backgroundColor: "transparent",
                color: "#f87171",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Trash2 size={16} />
              Remove Agent
            </button>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
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
              onClick={() => void handleSave()}
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
              Save Changes
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              style={{
                backgroundColor: "var(--color-card)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-foreground)", marginBottom: "1rem" }}>
                Remove {agentName}?
              </h3>
              <p style={{ color: "var(--color-muted-foreground)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                This will permanently delete the agent and all its configuration. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
                  onClick={() => void handleDelete()}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: "#f87171",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  Remove Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
