import { useState, useEffect, useMemo } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  TrendingDown,
  TrendingUp,
  Code,
  Globe,
  Users,
  Brain,
  Lightbulb,
  Target,
  DollarSign,
  Search,
  Plus,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Expand,
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

const AGENTS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    icon: TrendingDown,
    accent: "#f87171",
  },
  {
    id: "believer",
    name: "The Believer",
    icon: TrendingUp,
    accent: "#34d399",
  },
  {
    id: "engineer",
    name: "The Engineer",
    icon: Code,
    accent: "#38bdf8",
  },
  {
    id: "market",
    name: "Market Analyst",
    icon: Globe,
    accent: "#c084fc",
  },
  {
    id: "people",
    name: "People Expert",
    icon: Users,
    accent: "#facc15",
  },
  {
    id: "ai",
    name: "AI Strategist",
    icon: Brain,
    accent: "#818cf8",
  },
];

// Global debug flag - set window.DEBUG = true in devtools
declare global {
  interface Window {
    DEBUG?: boolean;
    setDebug?: (value: boolean) => void;
  }
}

export default function App() {
  const [startupName, setStartupName] = useState("");
  const [searchedStartup, setSearchedStartup] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [expandedTile, setExpandedTile] = useState<string | null>(null);

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
  const researchFoundersAction = useAction(api.actions.researchFounders);
  const seedDefaultAgents = useAction(api.actions.seedDefaultAgents);
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
  const enrichedFounders = useQuery(
    api.queries.getEnrichedFounders,
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
      .map((item: string) => item.replace(/^[\s\-\*•\u2022]+/, "").trim())
      .filter(Boolean);
  }, [hypeRecentNews]);

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


  // Seed default agents on mount
  useEffect(() => {
    void seedDefaultAgents();
  }, [seedDefaultAgents]);

  // Trigger founder research when scraped data becomes available
  useEffect(() => {
    if (!searchedStartup || !parsedScrapedData) return;

    // Check if we already have enriched founders for this startup
    if (enrichedFounders) return;

    // Get founder names from scraped data
    const founders = parsedScrapedData.founders || [];
    if (founders.length === 0) return;

    // Call research founders action
    void researchFoundersAction({
      startupName: searchedStartup,
      founders: founders.map((f: any) => ({ name: f.name })),
    });
  }, [searchedStartup, parsedScrapedData, enrichedFounders, researchFoundersAction]);

  const handleAnalyze = async () => {
    if (!startupName.trim()) return;

    setSearchedStartup(startupName);
    setIsAnalyzing(true);

    try {
      await analyzeStartup({ startupName, debug: debugMode });
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
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
      icon: frontendAgent?.icon || Brain,
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

      {/* Portfolio Tab Button */}
      <button
        onClick={() => setShowPortfolio(true)}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "5rem",
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
          zIndex: 100,
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

      <BackgroundCircles />

      <main className="app-main">
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
            {/* Back Button - Top Left */}
            <button
              onClick={() => setSearchedStartup(null)}
              style={{
                position: "fixed",
                top: "1rem",
                left: "1rem",
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
                zIndex: 100,
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
                <p className="dashboard__headline-subtitle">
                  {getSummaryContent("company_overview") ||
                    "Concise overview pending. Agents are compiling the company snapshot."}
                </p>
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
                {!enrichedFounders ? (
                  <p className="dashboard__placeholder">Researching founder backgrounds…</p>
                ) : (() => {
                  try {
                    const founders = JSON.parse(enrichedFounders.founders);
                    return founders.length > 0 ? (
                      <div>
                        {founders.map((founder: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: idx < founders.length - 1 ? "1rem" : 0 }}>
                            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{founder.name}</p>
                            {founder.bio && <p style={{ fontSize: "0.9rem" }}>{founder.bio}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="dashboard__placeholder">No founder information available.</p>
                    );
                  } catch {
                    return <p className="dashboard__placeholder">Error loading founder data.</p>;
                  }
                })()}
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
                  <DollarSign />
                </span>
                <h3 className="dashboard__tile-title">Capital Outlook</h3>
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
                {isSummariesLoading ? (
                  <p className="dashboard__placeholder">Assembling capital plan…</p>
                ) : getSummaryContent("funding_outlook") ? (
                  <p>{getSummaryContent("funding_outlook")}</p>
                ) : (
                  <p className="dashboard__placeholder">No funding guidance captured yet.</p>
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
        <AddAgentModal onClose={() => setShowAddAgentModal(false)} />
      )}

      {/* Expanded Modal for Founder Story */}
      <ExpandedModal
        isOpen={expandedTile === "founder"}
        onClose={() => setExpandedTile(null)}
        title="Founder Story"
        icon={<Lightbulb />}
      >
        <div style={{ fontSize: "1rem", lineHeight: 1.8 }}>
          {!enrichedFounders ? (
            <p>Researching founder backgrounds...</p>
          ) : (() => {
            try {
              const founders = JSON.parse(enrichedFounders.founders);
              return founders.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Founder Profiles</h3>
                  {founders.map((founder: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: idx < founders.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{founder.name}</h4>
                      {founder.bio && <p style={{ marginBottom: "0.5rem" }}>{founder.bio}</p>}
                      {(founder.linkedin || founder.twitter || founder.personalWebsite) && (
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                          {founder.linkedin && <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>LinkedIn</a>}
                          {founder.twitter && <a href={founder.twitter} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>Twitter</a>}
                          {founder.personalWebsite && <a href={founder.personalWebsite} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>Website</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No founder information available.</p>
              );
            } catch {
              return <p>Error loading founder data.</p>;
            }
          })()}
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

      {/* Expanded Modal for Capital Outlook */}
      <ExpandedModal
        isOpen={expandedTile === "funding"}
        onClose={() => setExpandedTile(null)}
        title="Capital Outlook"
        icon={<DollarSign />}
      >
        <div style={{ fontSize: "1rem", lineHeight: 1.8 }}>
          {isSummariesLoading ? (
            <p>Loading funding information...</p>
          ) : (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <LatestFundingStat
                  latestMetric={latestFundingMetric}
                  metrics={hypeMetrics}
                  isLoading={isHypeLoading}
                />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Funding Assessment</h3>
              <p style={{ marginBottom: "1.5rem" }}>
                {getSummaryContent("funding_outlook") || "Funding outlook will appear here once the analysis is complete."}
              </p>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Key Considerations</h3>
              <ul style={{ paddingLeft: "1.5rem", lineHeight: 1.8 }}>
                <li>Current funding stage and runway</li>
                <li>Burn rate and capital efficiency</li>
                <li>Investor interest and market conditions</li>
                <li>Competitive funding landscape</li>
                <li>Next round timing and valuation expectations</li>
              </ul>

              {parsedScrapedData && (
                <div style={{ marginTop: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Company Overview</h3>
                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      paddingRight: "0.75rem",
                      marginRight: "-0.75rem",
                    }}
                  >
                    <p style={{ margin: 0 }}>{parsedScrapedData.summary}</p>
                  </div>
                </div>
              )}

              {recentNewsItems.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Headlines</h3>
                  <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7 }}>
                    {recentNewsItems.map((item: string, index: number) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
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

          {recentNewsItems.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Headlines</h3>
              <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7 }}>
                {recentNewsItems.map((item: string, index: number) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ExpandedModal>
    </div>
  );
}
