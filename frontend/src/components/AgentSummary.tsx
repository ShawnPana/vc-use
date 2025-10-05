import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface AgentAnalysis {
  agentId: string;
  agentName: string;
  analysis: string;
  status: "loading" | "completed" | "error";
  accent: string;
}

interface AgentSummaryProps {
  agents: AgentAnalysis[];
  startupName: string;
}

export function AgentSummary({ agents, startupName }: AgentSummaryProps) {
  const [summaryText, setSummaryText] = useState<string>("");

  useEffect(() => {
    // Only process when all agents are completed
    const completedAgents = agents.filter(a => a.status === "completed");
    if (completedAgents.length === 0 || completedAgents.length !== agents.length) {
      return;
    }

    // Generate summary text
    const summary = generateSummaryText(completedAgents, startupName);
    setSummaryText(summary);
  }, [agents, startupName]);

  if (!summaryText) {
    return null;
  }

  return (
    <article className="agent-card" style={{
      animationDelay: "0ms",
      marginBottom: "1.5rem",
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "1rem",
      padding: "1.25rem",
    }}>
      <header className="agent-card__header">
        <span
          className="agent-card__icon"
          style={{
            background: "#818cf8",
            color: "#0f172a",
            boxShadow: "0 18px 30px -22px rgba(15, 23, 42, 0.55)",
          }}
          aria-hidden="true"
        >
          <Sparkles />
        </span>
        <div style={{ flex: 1 }}>
          <h3 className="agent-card__title">Executive Summary</h3>
          <div className="agent-card__status agent-card__status--complete">
            <span>✓ Complete</span>
          </div>
        </div>
      </header>

      <div className="agent-card__content">
        <p className="agent-card__body">{summaryText}</p>
      </div>
    </article>
  );
}

// Generate comprehensive summary paragraph
function generateSummaryText(agents: AgentAnalysis[], startupName: string): string {
  // Extract key insights from analyses
  const positiveKeywords = ["strong", "excellent", "promising", "innovative", "leading", "impressive", "solid", "growing", "successful", "advantage", "opportunity"];
  const negativeKeywords = ["risk", "concern", "challenge", "difficult", "weak", "threat", "uncertain", "limited", "struggle", "competition"];

  const positivePoints: string[] = [];
  const negativePoints: string[] = [];
  const marketInsights: string[] = [];

  agents.forEach(agent => {
    const analysis = agent.analysis;

    // Extract one key point from each agent type
    if (agent.agentId === "believer") {
      const match = analysis.match(/(?:particularly|especially|notably)\s+[^.]+/i);
      if (match) positivePoints.push(match[0].toLowerCase());
    }

    if (agent.agentId === "skeptic") {
      const match = analysis.match(/(?:concern|risk|challenge)\s+[^.]+/i);
      if (match) negativePoints.push(match[0].toLowerCase());
    }

    if (agent.agentId === "market") {
      const match = analysis.match(/(?:market|TAM|opportunity|competitive)\s+[^.]+/i);
      if (match) marketInsights.push(match[0].toLowerCase());
    }
  });

  // Count overall sentiment
  let positiveCount = 0;
  let negativeCount = 0;

  agents.forEach(agent => {
    positiveKeywords.forEach(keyword => {
      if (agent.analysis.toLowerCase().includes(keyword)) positiveCount++;
    });
    negativeKeywords.forEach(keyword => {
      if (agent.analysis.toLowerCase().includes(keyword)) negativeCount++;
    });
  });

  const sentimentRatio = positiveCount / Math.max(1, positiveCount + negativeCount);

  // Build a cohesive paragraph
  let summary = `${startupName} `;

  // Opening assessment based on sentiment
  if (sentimentRatio > 0.65) {
    summary += "presents a compelling investment opportunity with strong fundamentals and significant growth potential. ";
  } else if (sentimentRatio < 0.35) {
    summary += "faces substantial challenges that raise questions about its viability and growth trajectory. ";
  } else {
    summary += "shows both promise and notable risks that require careful consideration. ";
  }

  // Add market context if available
  const marketAgent = agents.find(a => a.agentId === "market");
  if (marketAgent) {
    const tamMatch = marketAgent.analysis.match(/TAM[^.]*billion/i) || marketAgent.analysis.match(/market[^.]*billion/i);
    if (tamMatch) {
      summary += `The company operates in a ${tamMatch[0].toLowerCase()}, `;
    }
  }

  // Add key strength
  const believerAgent = agents.find(a => a.agentId === "believer");
  if (believerAgent) {
    const strengthMatch = believerAgent.analysis.match(/(?:The company|They|It)\s+(?:has|have|demonstrates?|shows?|possesses?)[^.]+/i);
    if (strengthMatch && strengthMatch[0].length < 150) {
      summary += strengthMatch[0] + ". ";
    }
  }

  // Add primary concern
  const skepticAgent = agents.find(a => a.agentId === "skeptic");
  if (skepticAgent) {
    const concernMatch = skepticAgent.analysis.match(/(?:However|The main|Primary|Key)\s+(?:concern|risk|challenge)[^.]+/i);
    if (concernMatch && concernMatch[0].length < 150) {
      summary += concernMatch[0] + ". ";
    }
  }

  // Closing assessment
  const techAgent = agents.find(a => a.agentId === "engineer");
  const peopleAgent = agents.find(a => a.agentId === "people");

  if (techAgent && techAgent.analysis.toLowerCase().includes("solid")) {
    summary += "The technical foundation appears robust, ";
  }

  if (peopleAgent && peopleAgent.analysis.toLowerCase().includes("experienced")) {
    summary += "and the founding team brings relevant experience. ";
  } else if (sentimentRatio > 0.5) {
    summary += "Overall, the opportunity merits serious consideration despite identified risks. ";
  } else {
    summary += "Significant due diligence is recommended before proceeding with investment. ";
  }

  return summary.trim();
}
