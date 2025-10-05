import { useEffect, useState } from "react";

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
    <div style={{
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "1rem",
      padding: "1.5rem",
      marginBottom: "2rem",
      fontFamily: "monospace",
      fontSize: "0.9rem",
      lineHeight: 1.6,
      color: "var(--color-muted-foreground)",
      whiteSpace: "pre-wrap",
    }}>
      <div style={{
        fontSize: "1.1rem",
        fontWeight: 600,
        color: "var(--color-foreground)",
        marginBottom: "1rem",
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: "0.5rem",
      }}>
        EXECUTIVE SUMMARY
      </div>
      {summaryText}
    </div>
  );
}

// Generate plain text summary
function generateSummaryText(agents: AgentAnalysis[], startupName: string): string {
  const analyses = agents.map(a => a.analysis.toLowerCase());

  // Count sentiment indicators
  const positiveKeywords = ["strong", "excellent", "promising", "innovative", "leading", "impressive", "solid", "growing", "successful", "advantage", "opportunity", "breakthrough", "exceptional"];
  const negativeKeywords = ["risk", "concern", "challenge", "difficult", "weak", "threat", "uncertain", "limited", "struggle", "competition", "unclear", "lacking"];

  let positiveCount = 0;
  let negativeCount = 0;

  analyses.forEach(analysis => {
    positiveKeywords.forEach(keyword => {
      positiveCount += (analysis.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
    });
    negativeKeywords.forEach(keyword => {
      negativeCount += (analysis.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
    });
  });

  // Determine overall sentiment
  const sentimentRatio = positiveCount / Math.max(1, positiveCount + negativeCount);
  let overallSentiment: string;
  if (sentimentRatio > 0.65) {
    overallSentiment = "BULLISH";
  } else if (sentimentRatio < 0.35) {
    overallSentiment = "BEARISH";
  } else {
    overallSentiment = "MIXED";
  }

  // Extract key insights from each agent
  const insights: { [key: string]: string[] } = {};

  agents.forEach(agent => {
    const sentences = agent.analysis.split(/[.!?]+/).filter(s => s.trim().length > 30);
    const keyPoints: string[] = [];

    // Get first 2-3 substantive sentences
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 30 && trimmed.length < 200) {
        // Look for sentences with strong opinion indicators
        if (/\b(critical|important|key|significant|major|primary|concern|opportunity|strength|weakness|advantage|risk)\b/i.test(trimmed)) {
          keyPoints.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
          if (keyPoints.length >= 2) break;
        }
      }
    }

    // Fallback to first substantive sentence if no key indicators found
    if (keyPoints.length === 0 && sentences.length > 0) {
      const firstGood = sentences.find(s => s.trim().length > 30 && s.trim().length < 200);
      if (firstGood) {
        keyPoints.push(firstGood.trim().charAt(0).toUpperCase() + firstGood.trim().slice(1));
      }
    }

    if (keyPoints.length > 0) {
      insights[agent.agentName] = keyPoints;
    }
  });

  // Check for consensus between skeptic and believer
  const skeptic = agents.find(a => a.agentId === "skeptic");
  const believer = agents.find(a => a.agentId === "believer");

  let consensusLevel = "MODERATE";
  if (skeptic && believer) {
    const skepticHasPositive = positiveKeywords.some(kw =>
      skeptic.analysis.toLowerCase().includes(kw)
    );
    const believerHasNegative = negativeKeywords.some(kw =>
      believer.analysis.toLowerCase().includes(kw)
    );

    if (skepticHasPositive && believerHasNegative) {
      consensusLevel = "HIGH";
    } else if (!skepticHasPositive && !believerHasNegative) {
      consensusLevel = "LOW";
    }
  }

  // Build the summary text
  let summary = "";

  // Overview line
  summary += `COMPANY: ${startupName}\n`;
  summary += `SENTIMENT: ${overallSentiment}\n`;
  summary += `CONSENSUS: ${consensusLevel}\n`;
  summary += `AGENTS: ${agents.length} completed\n\n`;

  summary += `${"-".repeat(60)}\n\n`;

  // Key findings
  summary += "KEY FINDINGS:\n\n";

  // Strengths
  const strengthAgents = ["The Believer", "The Engineer", "People Expert"];
  const strengths = agents
    .filter(a => strengthAgents.includes(a.agentName))
    .flatMap(a => {
      const analysis = a.analysis.toLowerCase();
      if (analysis.includes("strong") || analysis.includes("excellent") || analysis.includes("impressive") || analysis.includes("advantage")) {
        const match = a.analysis.match(/(?:strong|excellent|impressive|leading|solid)\s+[^.]{10,80}/i);
        return match ? [match[0].trim()] : [];
      }
      return [];
    })
    .slice(0, 3);

  if (strengths.length > 0) {
    summary += "Strengths:\n";
    strengths.forEach(s => {
      summary += `• ${s.charAt(0).toUpperCase() + s.slice(1)}\n`;
    });
    summary += "\n";
  }

  // Risks
  const riskAgents = ["The Skeptic", "Market Analyst"];
  const risks = agents
    .filter(a => riskAgents.includes(a.agentName))
    .flatMap(a => {
      const analysis = a.analysis.toLowerCase();
      if (analysis.includes("risk") || analysis.includes("concern") || analysis.includes("challenge") || analysis.includes("threat")) {
        const match = a.analysis.match(/(?:risk|concern|challenge|threat|weakness)\s+[^.]{10,80}/i);
        return match ? [match[0].trim()] : [];
      }
      return [];
    })
    .slice(0, 3);

  if (risks.length > 0) {
    summary += "Risks:\n";
    risks.forEach(r => {
      summary += `• ${r.charAt(0).toUpperCase() + r.slice(1)}\n`;
    });
    summary += "\n";
  }

  summary += `${"-".repeat(60)}\n\n`;

  // Agent perspectives
  summary += "AGENT PERSPECTIVES:\n\n";

  Object.entries(insights).forEach(([agentName, points]) => {
    summary += `[${agentName.toUpperCase()}]\n`;
    points.forEach(point => {
      summary += `${point}.\n`;
    });
    summary += "\n";
  });

  summary += `${"-".repeat(60)}\n`;
  summary += `Generated: ${new Date().toLocaleString()}`;

  return summary;
}