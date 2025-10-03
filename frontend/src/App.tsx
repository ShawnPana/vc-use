import clsx from "clsx";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import AgentCard from "./components/AgentCard";
import { BackgroundCircles } from "@/components/BackgroundCircles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FundingChart } from "@/components/FundingChart";
import { MarketDonutChart } from "@/components/MarketDonutChart";
import { AgentStatusTimeline } from "@/components/AgentStatusTimeline";
import { AddAgentModal } from "@/components/AddAgentModal";
import { PortfolioPage } from "@/components/PortfolioPage";
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

// Sample funding data - in production this would come from your API
const SAMPLE_FUNDING_DATA = [
  { date: 'Q1 2021', amount: 500000 },
  { date: 'Q3 2021', amount: 2000000 },
  { date: 'Q1 2022', amount: 5000000 },
  { date: 'Q4 2022', amount: 15000000 },
  { date: 'Q2 2023', amount: 35000000 },
];

// Sample market size data - in production this would come from your API
const SAMPLE_MARKET_DATA = [
  { name: 'TAM', label: 'Total Addressable Market', value: 50000000000 },
  { name: 'SAM', label: 'Serviceable Available Market', value: 15000000000 },
  { name: 'SOM', label: 'Serviceable Obtainable Market', value: 3000000000 },
];

export default function App() {
  const [startupName, setStartupName] = useState("");
  const [searchedStartup, setSearchedStartup] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const analyzeStartup = useAction(api.actions.analyzeStartup);
  const seedDefaultAgents = useAction(api.actions.seedDefaultAgents);
  const addToPortfolioMutation = useMutation(api.mutations.addToPortfolio);
  const removeFromPortfolioMutation = useMutation(api.mutations.removeFromPortfolio);
  const portfolioCompanies = useQuery(api.queries.getPortfolioCompanies);

  const handleAddToPortfolio = async () => {
    if (!searchedStartup || !scrapedData) return;

    try {
      const parsedData = JSON.parse(scrapedData.data);
      await addToPortfolioMutation({
        startupName: searchedStartup,
        website: parsedData.website,
        bio: parsedData.bio,
        summary: parsedData.summary,
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

  // Seed default agents on mount
  useEffect(() => {
    void seedDefaultAgents();
  }, [seedDefaultAgents]);

  const handleAnalyze = async () => {
    if (!startupName.trim()) return;

    setSearchedStartup(startupName);
    setIsAnalyzing(true);

    try {
      await analyzeStartup({ startupName });
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
  const loadingAgents = agentMeta.filter((agent) => agent.status === "loading").length;
  const errorAgents = agentMeta.filter((agent) => agent.status === "error").length;

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
                      analyzeStartup({ startupName: example })
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
                          const icon = e.currentTarget.querySelector("svg");
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
              </div>
              <div className="dashboard__tile-body" style={{ paddingTop: '0.5rem' }}>
                <MarketDonutChart data={SAMPLE_MARKET_DATA} />
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--funding">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <DollarSign />
                </span>
                <h3 className="dashboard__tile-title">Capital Outlook</h3>
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
              </div>
              <div className="dashboard__tile-body" style={{ paddingTop: '1rem' }}>
                <FundingChart data={SAMPLE_FUNDING_DATA} />
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
                  <p className="dashboard__agent-scroll-note">
                    Scroll to review detailed memos from each perspective.
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
    </div>
  );
}
