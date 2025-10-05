import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Logo } from "./Logo";

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", {
        email,
        password,
        flow: isSignUp ? "signUp" : "signIn",
        ...(isSignUp && { name }),
      });
    } catch (err) {
      // Parse error message for user-friendly display
      let errorMessage = "Authentication failed. Please try again.";

      // Extract the actual error message from Convex error format
      let rawMessage = "";
      if (err instanceof Error) {
        rawMessage = err.message;
      } else if (typeof err === 'string') {
        rawMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        rawMessage = String((err as any).message);
      }

      const message = rawMessage.toLowerCase();

      // Check for specific error patterns
      if (message.includes("cannot read properties of null") || message.includes("reading '_id'")) {
        if (isSignUp) {
          errorMessage = "Unable to create account. This email may already be in use. Try signing in instead.";
        } else {
          errorMessage = "Account not found. Please check your email or sign up for a new account.";
        }
      } else if (message.includes("invalid") || message.includes("incorrect")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (message.includes("already exists") || message.includes("duplicate")) {
        errorMessage = "An account with this email already exists. Try signing in instead.";
      } else if (message.includes("not found")) {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (message.includes("password")) {
        errorMessage = "Invalid password. Please try again.";
      } else if (rawMessage && !message.includes("server error") && !message.includes("uncaught")) {
        // Only show the raw message if it's not a generic server error
        errorMessage = rawMessage;
      }

      setError(errorMessage);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "1rem",
          padding: "2.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Logo />
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-foreground)",
              marginBottom: "0.5rem",
            }}
          >
            VC-Use
          </h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.95rem" }}>
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          {isSignUp && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "var(--color-foreground)",
                }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-background)",
                  color: "var(--color-foreground)",
                  fontSize: "0.95rem",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
                color: "var(--color-foreground)",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
                color: "var(--color-foreground)",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "0.95rem",
              }}
            />
            {isSignUp && (
              <p style={{
                fontSize: "0.8rem",
                color: "var(--color-muted-foreground)",
                marginTop: "0.35rem"
              }}>
                Must be at least 8 characters
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "0.5rem",
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "var(--color-foreground)",
              color: "var(--color-background)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.9rem",
            color: "var(--color-muted-foreground)",
          }}
        >
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
