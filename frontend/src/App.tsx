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
import { FundingChart } from "@/components/FundingChart";
import { MarketDonutChart } from "@/components/MarketDonutChart";
import { AgentStatusTimeline } from "@/components/AgentStatusTimeline";
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
