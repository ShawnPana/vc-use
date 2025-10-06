import { useState, useEffect, useMemo } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { AuthPage } from "@/components/AuthPage";
import {
  TrendingUp,
  Code,
  Globe,
  Target,
  Users,
  Lightbulb,
  Search,
  Plus,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Expand,
  LogOut,
  RefreshCw,
} from "lucide-react";
import AgentCard from "./components/AgentCard";
import { BackgroundCircles } from "@/components/BackgroundCircles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LatestFundingStat } from "@/components/LatestFundingStat";
import { HypeMetricsChart } from "@/components/HypeMetricsChart";
import { AddAgentModal } from "@/components/AddAgentModal";
import { PortfolioPage } from "@/components/PortfolioPage";
import { AgentSummary } from "@/components/AgentSummary";
import { ExpandedModal } from "@/components/ExpandedModal";
import { parseHypeNumbers, getLatestFundingMetric, formatMetricValue, ParsedMetric } from "@/utils/hype";
import "./App.css";

const truncateText = (text: string, limit = 140) => {
  if (!text) {
    return "";
  }
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
};

const stripLeadingMarkers = (text: string) => text.replace(/^[\s*•\u2022-]+/, "").trim();

const AGENTS = [
  {
    id: "diligence",
    name: "Due Diligence",
    icon: Search,
    accent: "#ef4444",
  },
  {
    id: "financials",
    name: "Financial Analysis",
    icon: TrendingUp,
    accent: "#f59e0b",
  },
  {
    id: "market",
    name: "Market Sizing",
    icon: Target,
    accent: "#8b5cf6",
  },
  {
    id: "competitive",
    name: "Competitive Analysis",
    icon: Globe,
    accent: "#06b6d4",
  },
  {
    id: "team",
    name: "Team Assessment",
    icon: Users,
    accent: "#10b981",
  },
  {
    id: "technology",
    name: "Technology Audit",
    icon: Code,
    accent: "#3b82f6",
  },
];

// Global debug flag - set window.DEBUG = true in devtools
declare global {
  interface Window {
    DEBUG?: boolean;
    setDebug?: (value: boolean) => void;
  }
}

function MainApp() {
  const [startupName, setStartupName] = useState("");
  const [searchedStartup, setSearchedStartup] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [expandedTile, setExpandedTile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signOut } = useAuthActions();

  // Expose debug setter to window for devtools access
  useEffect(() => {
    window.setDebug = (value: boolean) => {
      window.DEBUG = value;
      setDebugMode(value);
      console.log(`Debug mode ${value ? 'enabled' : 'disabled'}`);
    };
    // Sync initial value
    if (window.DEBUG !== undefined) {
      setDebugMode(window.DEBUG);
    }
  }, []);

  const analyzeStartup = useAction(api.actions.analyzeStartup);
  const rerunAnalysis = useAction(api.actions.rerunAnalysis);
  const enrichFounderInfo = useAction(api.actions.enrichFounderInfo);
  const initializeMyAgents = useMutation(api.mutations.initializeMyAgents);
  const addToPortfolioMutation = useMutation(api.mutations.addToPortfolio);
  const removeFromPortfolioMutation = useMutation(api.mutations.removeFromPortfolio);
  const portfolioCompanies = useQuery(api.queries.getPortfolioCompanies);

  const handleAddToPortfolio = async () => {
    if (!searchedStartup || !parsedScrapedData) return;

    try {
      await addToPortfolioMutation({
        startupName: searchedStartup,
        website: parsedScrapedData.website,
        bio: parsedScrapedData.bio,
        summary: parsedScrapedData.summary,
      });
    } catch (error) {
      console.error("Error adding to portfolio:", error);
    }
  };

  const handleRemoveFromPortfolio = async () => {
    if (!searchedStartup) return;

    try {
      await removeFromPortfolioMutation({
        startupName: searchedStartup,
      });
    } catch (error) {
      console.error("Error removing from portfolio:", error);
    }
  };
  const analyses = useQuery(
    api.queries.getAnalyses,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );
  const summaries = useQuery(
    api.queries.getSummaries,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );
  const scrapedData = useQuery(
    api.queries.getScrapedData,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );
  const isInPortfolio = useQuery(
    api.queries.isInPortfolio,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );
  const dbAgents = useQuery(api.queries.getAgents);

  const parsedScrapedData = useMemo(() => {
    if (!scrapedData?.data) {
      return null;
    }

    try {
      return JSON.parse(scrapedData.data);
    } catch (error) {
      console.error("Failed to parse scraped data", error);
      return null;
    }
  }, [scrapedData]);

  const hypeNumbersText = parsedScrapedData?.hype?.numbers ?? null;
  const hypeMetrics = useMemo(() => parseHypeNumbers(hypeNumbersText), [hypeNumbersText]);
  const latestFundingMetric = useMemo(() => getLatestFundingMetric(hypeMetrics), [hypeMetrics]);
  const hypeSummary = parsedScrapedData?.hype?.summary ?? "";
  const hypeRecentNews = parsedScrapedData?.hype?.recentNews ?? "";
  const isHypeLoading = searchedStartup ? scrapedData === undefined : false;
  const recentNewsItems = useMemo(() => {
    if (!hypeRecentNews) {
      return [] as string[];
    }

    return hypeRecentNews
      .replace(/•/g, "\n")
      .split(/[\r\n]+/)
      .map((item: string) => stripLeadingMarkers(item))
      .filter(Boolean);
  }, [hypeRecentNews]);
  
  const hypeSummarySnippet = useMemo(() => {
    if (!hypeSummary) {
      return "";
    }
    return truncateText(hypeSummary, 190);
  }, [hypeSummary]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (showPortfolio) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    document.body.style.overflow = "";
  }, [showPortfolio]);


  // Initialize agents for current user on mount
  useEffect(() => {
    initializeMyAgents()
      .then((result) => {
        console.log("Agent initialization result:", result);
      })
      .catch((error) => {
        console.error("Failed to initialize agents:", error);
      });
  }, [initializeMyAgents]);

  const handleAnalyze = async () => {
    if (!startupName.trim()) return;

    setSearchedStartup(startupName);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      await analyzeStartup({ startupName, debug: debugMode });

      // After initial analysis completes, trigger founder enrichment in background
      enrichFounderInfo({ startupName }).catch((error) => {
        console.error("Failed to enrich founder info:", error);
      });
    } catch (error) {
      console.error("Analysis error:", error);
      let message = "Failed to analyze startup. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("must be authenticated") || error.message.includes("signed in")) {
          message = "You must be signed in to analyze startups.";
        } else if (error.message.includes("BACKEND_API_KEY")) {
          message = "Backend API is not configured. Please contact support.";
        } else if (!error.message.includes("Server Error") && !error.message.includes("Uncaught")) {
          message = error.message;
        }
      }

      setErrorMessage(message);
      setSearchedStartup(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRerun = async () => {
    if (!searchedStartup) return;

    setIsRerunning(true);
    setErrorMessage(null);

    try {
      await rerunAnalysis({ startupName: searchedStartup });

      // After rerun completes, trigger founder enrichment
      enrichFounderInfo({ startupName: searchedStartup }).catch((error) => {
        console.error("Failed to enrich founder info:", error);
      });
    } catch (error) {
      console.error("Rerun error:", error);
      let message = "Failed to refresh analysis. Please try again.";

      if (error instanceof Error && !error.message.includes("Server Error") && !error.message.includes("Uncaught")) {
        message = error.message;
      }

      setErrorMessage(message);
    } finally {
      setIsRerunning(false);
    }
  };

  const getAgentStatus = (agentId: string) => {
    const analysis = analyses?.find((a) => a.agentId === agentId);
    return {
      status: analysis?.status || "loading",
      analysis: analysis?.analysis || "",
    };
  };

  const getSummaryContent = (summaryType: string) => {
    const summary = summaries?.find((s) => s.summaryType === summaryType);
    return summary?.content?.trim() ?? "";
  };

  const isSummariesLoading = !summaries || summaries.length === 0;

  // Use database agents only - no fallback
  const agentMeta = (dbAgents || []).map((agent) => {
    const { status, analysis } = getAgentStatus(agent.agentId);
    const frontendAgent = AGENTS.find((a) => a.id === agent.agentId);

    return {
      id: agent.agentId,
      name: agent.name,
      icon: frontendAgent?.icon || Search,
      accent: agent.accent || "#818cf8",
      status,
      analysis,
      prompt: agent.prompt,
    };
  });

  const completedAgents = agentMeta.filter((agent) => agent.status === "completed").length;

  // Show portfolio page
  if (showPortfolio) {
    return (
      <div className="app-container">
        <ThemeToggle />
        <BackgroundCircles />
        <PortfolioPage
          onSelectCompany={(companyName) => {
            setSearchedStartup(companyName);
            setShowPortfolio(false);
          }}
          onBack={() => setShowPortfolio(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <ThemeToggle />

      {/* User Controls - Top Right */}
      <div style={{
        position: "fixed",
        top: "1.5rem",
        right: "5rem",
        display: "flex",
        gap: "0.75rem",
        zIndex: 100,
      }}>
        {/* Portfolio Tab Button */}
        <button
          onClick={() => setShowPortfolio(true)}
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            padding: "0.625rem 1rem",
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
            e.currentTarget.style.background = "var(--color-foreground)";
            e.currentTarget.style.color = "var(--color-background)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-card)";
            e.currentTarget.style.color = "var(--color-foreground)";
          }}
        >
          <Bookmark size={16} />
          Portfolio ({portfolioCompanies?.length || 0})
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => void signOut()}
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            padding: "0.625rem 1rem",
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
            e.currentTarget.style.background = "#ef4444";
            e.currentTarget.style.borderColor = "#ef4444";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-card)";
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-foreground)";
          }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>

      <BackgroundCircles />

      <main className="app-main">
        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              position: "fixed",
              top: "5rem",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "500px",
              width: "90%",
              padding: "1rem 1.5rem",
              background: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: "0.75rem",
              color: "#991b1b",
              fontSize: "0.95rem",
              fontWeight: 500,
              zIndex: 1000,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#991b1b",
                cursor: "pointer",
                fontSize: "1.25rem",
                lineHeight: 1,
                padding: "0.25rem",
              }}
            >
              ×
            </button>
          </div>
        )}

        {!searchedStartup && (
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-logo">
              <Logo />
            </div>

            <div>
              <h1 id="hero-heading" className="hero-title">
                VC-Use
              </h1>
              <p className="hero-subtitle">
                AI-powered startup analysis. Get instant insights from  specialized agents in seconds.
              </p>
            </div>

            <div className="search-panel">
              <div className="search-field">
                <Search className="search-icon" aria-hidden="true" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="Enter startup name..."
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleAnalyze();
                    }
                  }}
                  aria-label="Startup name"
                  autoComplete="off"
                />
              </div>
              <button
                className="search-button"
                onClick={() => {
                  void handleAnalyze();
                }}
                disabled={!startupName.trim() || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            <div className="search-examples">
              <span>Try:</span>
              {["OpenAI", "Stripe", "Airbnb"].map((example) => (
                <button
                  key={example}
                  type="button"
                  className="search-example-button"
                  onClick={() => {
                    setStartupName(example);
                    setTimeout(() => {
                      setSearchedStartup(example);
                      setIsAnalyzing(true);
                      analyzeStartup({ startupName: example, debug: debugMode })
                        .then(() => {
                          // Trigger founder enrichment after initial analysis
                          enrichFounderInfo({ startupName: example }).catch((error) => {
                            console.error("Failed to enrich founder info:", error);
                          });
                        })
                        .catch((error) => console.error("Analysis error:", error))
                        .finally(() => setIsAnalyzing(false));
                    }, 100);
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        )}

        {searchedStartup && (
          <>
            {/* Back & Rerun Buttons - Top Left */}
            <div style={{
              position: "fixed",
              top: "1rem",
              left: "1rem",
              display: "flex",
              gap: "0.75rem",
              zIndex: 100,
            }}>
              <button
                onClick={() => setSearchedStartup(null)}
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1rem",
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
                  e.currentTarget.style.background = "var(--color-foreground)";
                  e.currentTarget.style.color = "var(--color-background)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-card)";
                  e.currentTarget.style.color = "var(--color-foreground)";
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                onClick={() => void handleRerun()}
                disabled={isRerunning}
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1rem",
                  cursor: isRerunning ? "not-allowed" : "pointer",
                  color: "var(--color-foreground)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                  opacity: isRerunning ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isRerunning) {
                    e.currentTarget.style.background = "var(--color-foreground)";
                    e.currentTarget.style.color = "var(--color-background)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-card)";
                  e.currentTarget.style.color = "var(--color-foreground)";
                }}
                title="Refresh analysis with latest data"
              >
                <RefreshCw size={16} className={isRerunning ? "animate-spin" : ""} />
                {isRerunning ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <section className="dashboard" aria-live="polite">
            <article className="dashboard__tile dashboard__tile--headline">
              <div className="dashboard__headline-top">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <p className="dashboard__agent-scroll-note">Portfolio Assembly</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {!isInPortfolio && (
                      <button
                        onClick={() => void handleAddToPortfolio()}
                        style={{
                          background: "var(--color-foreground)",
                          border: "none",
                          borderRadius: "0.5rem",
                          padding: "0.4rem 0.75rem",
                          cursor: "pointer",
                          color: "var(--color-background)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Bookmark size={16} />
                        Add to Portfolio
                      </button>
                    )}
                    {isInPortfolio && (
                      <button
                        onClick={() => void handleRemoveFromPortfolio()}
                        style={{
                          background: "transparent",
                          border: "1px solid #34d399",
                          borderRadius: "0.5rem",
                          padding: "0.4rem 0.75rem",
                          color: "#34d399",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                          e.currentTarget.style.borderColor = "#ef4444";
                          e.currentTarget.style.color = "white";
                          const text = e.currentTarget.querySelector("span");
                          if (text) text.textContent = "Remove from Portfolio";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = "#34d399";
                          e.currentTarget.style.color = "#34d399";
                          const text = e.currentTarget.querySelector("span");
                          if (text) text.textContent = "In Portfolio";
                        }}
                      >
                        <BookmarkCheck size={16} />
                        <span>In Portfolio</span>
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="dashboard__headline-title">{searchedStartup}</h2>
                <div
                  className="dashboard__headline-subtitle"
                  style={{
                    maxHeight: "4.5rem",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                    display: "block",
                    WebkitLineClamp: "unset",
                    WebkitBoxOrient: "unset",
                    textOverflow: "clip",
                  }}
                >
                  {getSummaryContent("company_overview") ||
                    "Concise overview pending. Agents are compiling the company snapshot."}
                </div>
              </div>

            </article>

            <article className="dashboard__tile dashboard__tile--founder">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <Lightbulb />
                </span>
                <h3 className="dashboard__tile-title">Founder Story</h3>
                <button
                  onClick={() => setExpandedTile("founder")}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem",
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
                  title="Expand"
                >
                  <Expand size={16} />
                </button>
              </div>
              <div className="dashboard__tile-body dashboard__tile-body--scroll">
                {isSummariesLoading ? (
                  <p className="dashboard__placeholder">Collecting founder background…</p>
                ) : getSummaryContent("founder_story") ? (
                  <p>{getSummaryContent("founder_story")}</p>
                ) : (
                  <p className="dashboard__placeholder">No founder insights collected yet.</p>
                )}
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--market">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <Target />
                </span>
                <h3 className="dashboard__tile-title">Market Opportunity</h3>
                <button
                  onClick={() => setExpandedTile("market")}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem",
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
                  title="Expand"
                >
                  <Expand size={16} />
                </button>
              </div>
              <div className="dashboard__tile-body" style={{ paddingTop: '0.5rem' }}>
                <div style={{ height: "220px" }}>
                  <HypeMetricsChart metrics={hypeMetrics} />
                </div>
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--funding">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <Globe />
                </span>
                <h3 className="dashboard__tile-title">News Pulse</h3>
                <button
                  onClick={() => setExpandedTile("funding")}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem",
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
                  title="Expand"
                >
                  <Expand size={16} />
                </button>
              </div>
              <div className="dashboard__tile-body dashboard__tile-body--scroll">
                {recentNewsItems.length === 0 && !hypeSummarySnippet ? (
                  <p className="dashboard__placeholder">No market signals captured yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "1.25rem" }}>
                    {/* Overview Section */}
                    {hypeSummarySnippet && (
                      <div>
                        <h4 style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--color-muted-foreground)",
                          marginBottom: "0.5rem"
                        }}>
                          Overview
                        </h4>
                        <div
                          style={{
                            borderLeft: "3px solid var(--color-primary)",
                            paddingLeft: "0.75rem",
                            fontSize: "0.9rem",
                            lineHeight: 1.6,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {hypeSummarySnippet}
                        </div>
                      </div>
                    )}

                    {/* Recent Headlines Section */}
                    {recentNewsItems.length > 0 && (
                      <div>
                        <h4 style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--color-muted-foreground)",
                          marginBottom: "0.65rem"
                        }}>
                          Recent Headlines
                        </h4>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                          {recentNewsItems.slice(0, 3).map((item: string, index: number) => (
                            <div
                              key={`news-${index}`}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.75rem",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-foreground)",
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                background: "var(--color-muted)",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--color-accent)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--color-muted)";
                              }}
                            >
                              <span
                                style={{
                                  minWidth: "1.5rem",
                                  height: "1.5rem",
                                  borderRadius: "0.25rem",
                                  background: "var(--color-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "white",
                                  flexShrink: 0,
                                }}
                              >
                                {index + 1}
                              </span>
                              <span style={{ flex: 1 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Funding Outlook Section */}
                    {!isSummariesLoading && getSummaryContent("funding_outlook") && (
                      <div>
                        <h4 style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--color-muted-foreground)",
                          marginBottom: "0.5rem"
                        }}>
                          Funding Outlook
                        </h4>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            lineHeight: 1.6,
                            color: "var(--color-foreground)",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            background: "var(--color-accent)",
                          }}
                        >
                          {getSummaryContent("funding_outlook")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--metrics">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <TrendingUp />
                </span>
                <h3 className="dashboard__tile-title">Funding Progress</h3>
                <button
                  onClick={() => setExpandedTile("metrics")}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem",
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
                  title="Expand"
                >
                  <Expand size={16} />
                </button>
              </div>
              <div className="dashboard__tile-body" style={{ paddingTop: '1rem' }}>
                <LatestFundingStat
                  latestMetric={latestFundingMetric}
                  metrics={hypeMetrics}
                  isLoading={isHypeLoading}
                />
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--agents">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <Users />
                </span>
                <h3 className="dashboard__tile-title">Agent Console</h3>
                <button
                  onClick={() => setShowAddAgentModal(true)}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem",
                    cursor: "pointer",
                    color: "var(--color-muted-foreground)",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-foreground)";
                    e.currentTarget.style.borderColor = "var(--color-foreground)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-muted-foreground)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                  title="Add new agent"
                >
                  <Plus size={18} />
                </button>
              </div>
              {agentMeta.length === 0 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3rem 1rem",
                  color: "var(--color-muted-foreground)",
                  textAlign: "center",
                  gap: "0.75rem",
                }}>
                  <Users size={48} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>No agents set up yet</p>
                  <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Click the + button above to add your first agent</p>
                </div>
              ) : (
                <>
                  {/* Show summary when all agents are completed */}
                  {completedAgents === agentMeta.length && agentMeta.length > 0 && (
                    <AgentSummary
                      agents={agentMeta.map(agent => ({
                        agentId: agent.id,
                        agentName: agent.name,
                        analysis: agent.analysis,
                        status: agent.status,
                        accent: agent.accent,
                      }))}
                      startupName={searchedStartup}
                    />
                  )}

                  <p className="dashboard__agent-scroll-note">
                    {completedAgents === agentMeta.length && agentMeta.length > 0
                      ? "Analysis complete. Review the executive summary above and detailed memos below."
                      : "Scroll to review detailed memos from each perspective."}
                  </p>
                  <div className="dashboard__agents">
                    {agentMeta.map((agent, index) => (
                      <AgentCard
                        key={agent.id}
                        agentId={agent.id}
                        name={agent.name}
                        icon={agent.icon}
                        accent={agent.accent}
                        analysis={agent.analysis}
                        status={agent.status}
                        delay={index * 120}
                        prompt={agent.prompt}
                      />
                    ))}
                  </div>
                </>
              )}
            </article>
          </section>
          </>
        )}
      </main>

      {showAddAgentModal && (
        <AddAgentModal
          onClose={() => setShowAddAgentModal(false)}
          currentStartup={searchedStartup}
        />
      )}

      {/* Expanded Modal for Founder Story */}
      <ExpandedModal
        isOpen={expandedTile === "founder"}
        onClose={() => setExpandedTile(null)}
        title="Founder Story"
        icon={<Lightbulb />}
      >
        <div style={{ fontSize: "1rem", lineHeight: 1.8 }}>
          {isSummariesLoading ? (
            <p>Loading founder information...</p>
          ) : getSummaryContent("founder_story") ? (
            <>
              <p style={{ marginBottom: "1.5rem" }}>{getSummaryContent("founder_story")}</p>
              {parsedScrapedData?.founders && (
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Founder Profiles</h3>
                  {parsedScrapedData.founders.map((founder: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: idx < parsedScrapedData.founders.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{founder.name}</h4>
                      {founder.bio && <p style={{ marginBottom: "0.5rem" }}>{founder.bio}</p>}
                      {(founder.linkedin || founder.twitter) && (
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                          {founder.linkedin && <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>LinkedIn</a>}
                          {founder.twitter && <a href={founder.twitter} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>Twitter</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>No founder information available yet.</p>
          )}
        </div>
      </ExpandedModal>

      {/* Expanded Modal for Market Opportunity */}
      <ExpandedModal
        isOpen={expandedTile === "market"}
        onClose={() => setExpandedTile(null)}
        title="Market Opportunity"
        icon={<Target />}
      >
        <div>
          <div style={{ height: "260px", maxHeight: "320px" }}>
            <HypeMetricsChart metrics={hypeMetrics} />
          </div>
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Metric Callouts</h3>
            {hypeMetrics.length > 0 ? (
              <div style={{ display: "grid", gap: "1rem" }}>
                {hypeMetrics.slice(0, 4).map((metric: ParsedMetric, idx: number) => (
                  <div
                    key={`${metric.label}-${idx}`}
                    style={{
                      padding: "1rem",
                      background: "var(--color-background)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{metric.label}</span>
                    <span style={{ fontSize: "0.95rem", color: "var(--color-muted-foreground)" }}>
                      {formatMetricValue(metric)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.95rem", color: "var(--color-muted-foreground)" }}>
                Metrics will populate after hype research collects traction numbers.
              </p>
            )}
            <p style={{ marginTop: "1.5rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {getSummaryContent("market_position") || "Market position analysis will appear here once the analysis is complete."}
            </p>
          </div>
          {hypeSummary && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Hype Narrative</h3>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{hypeSummary}</p>
            </div>
          )}
        </div>
      </ExpandedModal>

      {/* Expanded Modal for News Pulse */}
      <ExpandedModal
        isOpen={expandedTile === "funding"}
        onClose={() => setExpandedTile(null)}
        title="News Pulse"
        icon={<Globe />}
      >
        <div style={{ fontSize: "1rem", lineHeight: 1.8 }}>
          {recentNewsItems.length === 0 && !hypeSummary && isSummariesLoading ? (
            <p>Gathering the latest market signals…</p>
          ) : (
            <>
              {hypeSummary && (
                <div style={{ marginBottom: "1.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Hype Narrative</h3>
                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      paddingRight: "0.75rem",
                      marginRight: "-0.75rem",
                    }}
                  >
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{hypeSummary}</p>
                  </div>
                </div>
              )}

              {recentNewsItems.length > 0 ? (
                <div style={{ marginBottom: "1.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Latest Headlines</h3>
                  <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7 }}>
                    {recentNewsItems.map((item: string, index: number) => (
                      <li key={`headline-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: "var(--color-muted-foreground)", marginBottom: "1.75rem" }}>
                  No recent headlines captured yet. Run a new analysis when additional news breaks.
                </p>
              )}

              <div style={{ display: "grid", gap: "1.75rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Funding Outlook</h3>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {getSummaryContent("funding_outlook") ||
                      "Funding outlook will appear here once the agents synthesize their view."}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Market Position</h3>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {getSummaryContent("market_position") ||
                      "Market positioning analysis will surface here after the run completes."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </ExpandedModal>

      {/* Expanded Modal for Funding Progress */}
      <ExpandedModal
        isOpen={expandedTile === "metrics"}
        onClose={() => setExpandedTile(null)}
        title="Funding Progress"
        icon={<TrendingUp />}
      >
        <div>
          <div>
            <LatestFundingStat
              latestMetric={latestFundingMetric}
              metrics={hypeMetrics}
              isLoading={isHypeLoading}
            />
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Funding Metrics</h3>
            <div style={{ height: "260px", maxHeight: "320px" }}>
              <HypeMetricsChart metrics={hypeMetrics} />
            </div>
          </div>

          {hypeSummary && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Narrative</h3>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{hypeSummary}</p>
            </div>
          )}

        </div>
      </ExpandedModal>
    </div>
  );
}

export default function App() {
  const token = useAuthToken();

  return token ? <MainApp /> : <AuthPage />;
}
