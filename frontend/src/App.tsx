import clsx from "clsx";
import { useState } from "react";
import { useAction, useQuery } from "convex/react";
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
} from "lucide-react";
import AgentCard from "./components/AgentCard";
import { BackgroundCircles } from "@/components/BackgroundCircles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
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

export default function App() {
  const [startupName, setStartupName] = useState("");
  const [searchedStartup, setSearchedStartup] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeStartup = useAction(api.actions.analyzeStartup);
  const analyses = useQuery(
    api.queries.getAnalyses,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );
  const summaries = useQuery(
    api.queries.getSummaries,
    searchedStartup ? { startupName: searchedStartup } : "skip"
  );

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
  const agentMeta = AGENTS.map((agent) => {
    const { status, analysis } = getAgentStatus(agent.id);
    return { ...agent, status, analysis };
  });

  const completedAgents = agentMeta.filter((agent) => agent.status === "completed").length;
  const loadingAgents = agentMeta.filter((agent) => agent.status === "loading").length;
  const errorAgents = agentMeta.filter((agent) => agent.status === "error").length;

  return (
    <div className="app-container">
      <ThemeToggle />
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
                AI-powered startup analysis. Get instant insights from six specialized agents in seconds.
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
                  onClick={() => setStartupName(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        )}

        {searchedStartup && (
          <section className="dashboard" aria-live="polite">
            <article className="dashboard__tile dashboard__tile--headline">
              <div className="dashboard__headline-top">
                <p className="dashboard__agent-scroll-note">Portfolio Assembly</p>
                <h2 className="dashboard__headline-title">{searchedStartup}</h2>
                <p className="dashboard__headline-subtitle">
                  Six specialist agents collaborate to shape a VC-ready perspective in under a minute.
                </p>
                <div className="dashboard__metrics-grid">
                  <div className="dashboard__metric">
                    <span className="dashboard__metric-label">Completed</span>
                    <span className="dashboard__metric-value">{completedAgents}</span>
                  </div>
                  <div className="dashboard__metric">
                    <span className="dashboard__metric-label">In Flight</span>
                    <span className="dashboard__metric-value">{loadingAgents}</span>
                  </div>
                  <div className="dashboard__metric">
                    <span className="dashboard__metric-label">Flags</span>
                    <span className="dashboard__metric-value">{errorAgents}</span>
                  </div>
                </div>
              </div>

              <form
                className="dashboard__search"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAnalyze();
                }}
              >
                <div className="dashboard__search-field">
                  <Search className="dashboard__search-icon" aria-hidden="true" />
                  <input
                    className="dashboard__search-input"
                    type="text"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="Evaluate another startup"
                    aria-label="Startup name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleAnalyze();
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="dashboard__search-button"
                  disabled={!startupName.trim() || isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing" : "Run Analysis"}
                </button>
              </form>
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
                <h3 className="dashboard__tile-title">Market Position</h3>
              </div>
              <div className="dashboard__tile-body dashboard__tile-body--scroll">
                {isSummariesLoading ? (
                  <p className="dashboard__placeholder">Mapping competitive terrain…</p>
                ) : getSummaryContent("market_position") ? (
                  <p>{getSummaryContent("market_position")}</p>
                ) : (
                  <p className="dashboard__placeholder">No market insights collected yet.</p>
                )}
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
                  <Brain />
                </span>
                <h3 className="dashboard__tile-title">Agent Timeline</h3>
              </div>
              <div className="dashboard__tile-body">
                <div className="dashboard__status-list">
                  {agentMeta.map((agent) => (
                    <div key={agent.id} className="dashboard__status-item">
                      <div className="dashboard__status-agent">
                        <span
                          className={clsx(
                            "dashboard__status-dot",
                            agent.status === "loading" && "dashboard__status-dot--loading",
                            agent.status === "completed" && "dashboard__status-dot--completed",
                            agent.status === "error" && "dashboard__status-dot--error",
                          )}
                        />
                        <span>{agent.name}</span>
                      </div>
                      <span className="dashboard__status-value">
                        {agent.status === "loading" && "Running"}
                        {agent.status === "completed" && "Complete"}
                        {agent.status === "error" && "Error"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="dashboard__tile dashboard__tile--agents">
              <div className="dashboard__tile-header">
                <span className="dashboard__tile-icon">
                  <Users />
                </span>
                <h3 className="dashboard__tile-title">Agent Console</h3>
              </div>
              <p className="dashboard__agent-scroll-note">
                Scroll to review detailed memos from each perspective.
              </p>
              <div className="dashboard__agents">
                {agentMeta.map((agent, index) => (
                  <AgentCard
                    key={agent.id}
                    name={agent.name}
                    icon={agent.icon}
                    accent={agent.accent}
                    analysis={agent.analysis}
                    status={agent.status}
                    delay={index * 120}
                  />
                ))}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
