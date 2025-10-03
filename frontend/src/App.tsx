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

const AGENTS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    icon: TrendingDown,
    gradient: "from-red-500 to-orange-500",
  },
  {
    id: "believer",
    name: "The Believer",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "engineer",
    name: "The Engineer",
    icon: Code,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "market",
    name: "Market Analyst",
    icon: Globe,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "people",
    name: "People Expert",
    icon: Users,
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    id: "ai",
    name: "AI Strategist",
    icon: Brain,
    gradient: "from-indigo-500 to-purple-500",
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
    <div style={{ minHeight: "100vh", backgroundColor: "white", position: "relative", overflow: "hidden" }}>
      {/* Background Circles */}
      <BackgroundCircles />

      {/* Main Content */}
      <main style={{ position: "relative", zIndex: 10 }}>
        {/* Hero Section - Only show when no search */}
        {!searchedStartup && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "16px",
            }}
          >
            <div style={{ maxWidth: "768px", width: "100%", textAlign: "center" }}>
              {/* Logo/Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
                <div
                  style={{
                    height: "64px",
                    width: "64px",
                    borderRadius: "16px",
                    backgroundColor: "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Logo size={36} />
                </div>
              </div>

              {/* Heading */}
              <div style={{ marginBottom: "48px" }}>
                <h1
                  style={{
                    fontSize: "64px",
                    fontWeight: "bold",
                    letterSpacing: "-0.02em",
                    color: "black",
                    marginBottom: "16px",
                  }}
                >
                  VC-Use
                </h1>
                <p
                  style={{
                    fontSize: "20px",
                    color: "#737373",
                    maxWidth: "600px",
                    margin: "0 auto",
                  }}
                >
                  AI-powered startup analysis. Get instant insights from 6 specialized agents in seconds.
                </p>
              </div>

              {/* Search Input */}
              <div style={{ maxWidth: "600px", margin: "0 auto 24px", display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Search
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: "16px",
                      width: "16px",
                      color: "#a3a3a3",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Enter startup name..."
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleAnalyze();
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "48px",
                      paddingLeft: "40px",
                      paddingRight: "12px",
                      backgroundColor: "white",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "black";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e5e5";
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    void handleAnalyze();
                  }}
                  disabled={!startupName.trim() || isAnalyzing}
                  style={{
                    height: "48px",
                    padding: "0 32px",
                    backgroundColor: "black",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    cursor: startupName.trim() && !isAnalyzing ? "pointer" : "not-allowed",
                    opacity: startupName.trim() && !isAnalyzing ? 1 : 0.5,
                    fontSize: "16px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (startupName.trim() && !isAnalyzing) {
                      e.currentTarget.style.backgroundColor = "#262626";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "black";
                  }}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>

              {/* Examples */}
              <div style={{ fontSize: "14px", color: "#737373" }}>
                Try:{" "}
                <button
                  onClick={() => setStartupName("OpenAI")}
                  style={{
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                    cursor: "pointer",
                    color: "#737373",
                    padding: 0,
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "black";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#737373";
                  }}
                >
                  OpenAI
                </button>
                ,{" "}
                <button
                  onClick={() => setStartupName("Stripe")}
                  style={{
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                    cursor: "pointer",
                    color: "#737373",
                    padding: 0,
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "black";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#737373";
                  }}
                >
                  Stripe
                </button>
                , or{" "}
                <button
                  onClick={() => setStartupName("Airbnb")}
                  style={{
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                    cursor: "pointer",
                    color: "#737373",
                    padding: 0,
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "black";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#737373";
                  }}
                >
                  Airbnb
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {searchedStartup && (
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 16px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: "bold", color: "black", marginBottom: "8px" }}>
                Analysis for {searchedStartup}
              </h2>
              <p style={{ color: "#737373" }}>Powered by 6 specialized AI agents</p>
            </div>

            {/* Summary Cards */}
            <div style={{ marginBottom: "48px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "black" }}>
                Quick Insights
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
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
            </div>

            {/* Agent Analysis */}
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "black" }}>
                AI Agent Analysis
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                  gap: "16px",
                }}
              >
                {AGENTS.map((agent, index) => {
                  const { status, analysis } = getAgentStatus(agent.id);
                  return (
                    <AgentCard
                      key={agent.id}
                      name={agent.name}
                      icon={agent.icon}
                      gradient={agent.gradient}
                      analysis={analysis}
                      status={status}
                      delay={index * 150}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
