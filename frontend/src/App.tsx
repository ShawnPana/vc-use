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
import SummaryCard from "./components/SummaryCard";
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

const SUMMARY_TYPES = [
  { type: "founder_story", title: "Founder Story", icon: Lightbulb },
  { type: "market_position", title: "Market Position", icon: Target },
  { type: "funding_outlook", title: "Funding Outlook", icon: DollarSign },
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
    return summary?.content || "";
  };

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
          <section className="results" aria-live="polite">
            <header className="results-header">
              <h2 className="results-title">Analysis for {searchedStartup}</h2>
              <p className="results-subtitle">Powered by six specialized AI agents</p>
            </header>

            <section>
              <h3 className="section-heading">Quick Insights</h3>
              <div className="summary-grid">
                {SUMMARY_TYPES.map((summary, index) => (
                  <SummaryCard
                    key={summary.type}
                    title={summary.title}
                    icon={summary.icon}
                    content={getSummaryContent(summary.type)}
                    isLoading={!summaries || summaries.length === 0}
                    delay={index * 100}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="section-heading">AI Agent Analysis</h3>
              <div className="agent-grid">
                {AGENTS.map((agent, index) => {
                  const { status, analysis } = getAgentStatus(agent.id);
                  return (
                    <AgentCard
                      key={agent.id}
                      name={agent.name}
                      icon={agent.icon}
                      accent={agent.accent}
                      analysis={analysis}
                      status={status}
                      delay={index * 150}
                    />
                  );
                })}
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
