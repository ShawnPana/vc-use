import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bookmark, BookmarkCheck, ArrowLeft } from "lucide-react";

interface PortfolioPageProps {
  onSelectCompany: (companyName: string) => void;
  onBack: () => void;
}

export function PortfolioPage({ onSelectCompany, onBack }: PortfolioPageProps) {
  const portfolioCompanies = useQuery(api.queries.getPortfolioCompanies);

  return (
    <div style={{
      minHeight: "100vh",
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            color: "var(--color-foreground)",
            fontSize: "0.9rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 style={{
          fontSize: "2rem",
          fontWeight: 700,
          margin: 0,
        }}>
          Portfolio
        </h1>

        <div style={{ width: "80px" }} /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      {!portfolioCompanies || portfolioCompanies.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "6rem 2rem",
          color: "var(--color-muted-foreground)",
        }}>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            No companies in portfolio yet
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>
            Analyze a startup and add it to your portfolio to track it here.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
        }}>
          {portfolioCompanies.map((company) => (
            <div
              key={company._id}
              onClick={() => onSelectCompany(company.startupName)}
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-foreground)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                <BookmarkCheck size={22} style={{ color: "#34d399", flexShrink: 0, marginTop: "0.25rem" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {company.startupName}
                  </h3>
                  {company.website && (
                    <p style={{
                      fontSize: "0.9rem",
                      color: "var(--color-muted-foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {company.website}
                    </p>
                  )}
                </div>
              </div>
              {company.bio && (
                <p style={{
                  fontSize: "0.95rem",
                  color: "var(--color-muted-foreground)",
                  lineHeight: "1.6",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  marginBottom: "1rem",
                }}>
                  {company.bio}
                </p>
              )}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--color-border)",
              }}>
                <p style={{
                  fontSize: "0.8rem",
                  color: "var(--color-muted-foreground)",
                  opacity: 0.6,
                  margin: 0,
                }}>
                  Added {new Date(company.addedAt).toLocaleDateString()}
                </p>
                <button
                  style={{
                    background: "var(--color-foreground)",
                    color: "var(--color-background)",
                    border: "none",
                    borderRadius: "0.375rem",
                    padding: "0.375rem 0.875rem",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCompany(company.startupName);
                  }}
                >
                  View Analysis
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
