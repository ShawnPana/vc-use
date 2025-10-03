"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const RATE_LIMIT_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Agent configurations
const AGENTS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    prompt: "Act as a highly critical, risk-focused VC. Identify all potential red flags, market risks, competitive threats, and reasons this startup might fail. Analyze unit economics concerns, burn rate risks, and team gaps. Be thorough but fair in your criticism.",
  },
  {
    id: "believer",
    name: "The Believer",
    prompt: "Act as an optimistic, growth-focused VC. Highlight the startup's massive potential, market opportunities, competitive advantages, and what could make this a unicorn. Focus on the upside case, network effects, and scalability. Be enthusiastic but credible.",
  },
  {
    id: "engineer",
    name: "The Engineer",
    prompt: "Act as a senior technical expert and CTO evaluating the product. Assess technical feasibility, innovation level, architecture scalability, technical moat, and engineering quality. Evaluate their tech stack choices and technical team strength.",
  },
  {
    id: "market",
    name: "Market Analyst",
    prompt: "Analyze the market opportunity, competitive landscape, market timing, and total addressable market (TAM). Compare to similar companies and their outcomes. Assess go-to-market strategy and market positioning.",
  },
  {
    id: "people",
    name: "People Expert",
    prompt: "Focus on the founding team. Research their backgrounds, how they met, their complementary skills, previous exits, domain expertise, and why this specific team can execute on this vision. Evaluate team composition and hiring ability.",
  },
  {
    id: "ai",
    name: "AI Strategist",
    prompt: "Evaluate how well this company leverages AI, their AI strategy, defensibility of their AI approach, position in the AI landscape, and whether AI is core to their value prop or just a feature. Assess AI competitive moat.",
  },
];

// Mock scraping function - replace with actual Browser Use implementation
export const scrapeStartupData = action({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    // TODO: Implement actual Browser Use scraping
    // For now, return mock data structure
    const mockData = {
      startupName: args.startupName,
      website: `https://${args.startupName.toLowerCase().replace(/\s+/g, '')}.com`,
      description: "AI-powered startup...",
      founders: ["Founder 1", "Founder 2"],
      funding: "Series A",
      employees: "10-50",
    };

    // Store scraped data
    await ctx.runMutation(api.mutations.storeScrapedData, {
      startupName: args.startupName,
      data: JSON.stringify(mockData),
    });

    return mockData;
  },
});

// Analyze with AI using Cerebras API
export const analyzeWithCerebras = action({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    scrapedData: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = AGENTS.find((a) => a.id === args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    // Create analysis record with loading status
    const analysisId = await ctx.runMutation(api.mutations.createAnalysis, {
      startupName: args.startupName,
      agentId: args.agentId,
      agentName: agent.name,
    });

    try {
      // Call Cerebras API
      const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
      if (!cerebrasApiKey) {
        throw new Error("CEREBRAS_API_KEY not configured");
      }

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cerebrasApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: agent.prompt,
            },
            {
              role: "user",
              content: `Analyze this startup based on the following data:\n\n${args.scrapedData}\n\nProvide a detailed analysis in 3-5 paragraphs.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cerebras API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || "No analysis available";

      // Update analysis with result
      await ctx.runMutation(api.mutations.updateAnalysis, {
        analysisId,
        analysis,
        status: "completed",
      });

      return analysis;
    } catch (error) {
      // Update analysis with error
      await ctx.runMutation(api.mutations.updateAnalysis, {
        analysisId,
        analysis: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
      });
      throw error;
    }
  },
});

// Orchestrator action to run all analyses
export const analyzeStartup = action({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    // First, scrape the data
    const scrapedData = await ctx.runAction(api.actions.scrapeStartupData, {
      startupName: args.startupName,
    });

    const scrapedDataString = JSON.stringify(scrapedData);

    // Run agents sequentially to avoid hitting Cerebras rate limits
    for (const [index, agent] of AGENTS.entries()) {
      try {
        await ctx.runAction(api.actions.analyzeWithCerebras, {
          startupName: args.startupName,
          agentId: agent.id,
          scrapedData: scrapedDataString,
        });
      } finally {
        if (index < AGENTS.length - 1) {
          await sleep(RATE_LIMIT_DELAY_MS);
        }
      }
    }

    // Generate summaries
    await ctx.runAction(api.actions.generateSummaries, {
      startupName: args.startupName,
      scrapedData: scrapedDataString,
    });

    return { success: true };
  },
});

// Generate summary cards
export const generateSummaries = action({
  args: {
    startupName: v.string(),
    scrapedData: v.string(),
  },
  handler: async (ctx, args) => {
    const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
    if (!cerebrasApiKey) {
      return;
    }

    const summaryTypes = [
      {
        type: "founder_story",
        prompt: "Create a brief, compelling summary of the founders' background and how they came together to start this company. 2-3 sentences max.",
      },
      {
        type: "market_position",
        prompt: "Summarize the company's position in the competitive landscape and their unique differentiation. 2-3 sentences max.",
      },
      {
        type: "funding_outlook",
        prompt: "Provide an assessment of their current funding stage and what they likely need next. 2-3 sentences max.",
      },
      {
        type: "company_overview",
        prompt: "Provide a tight, 2 sentence summary of the startup that highlights what they do, who they serve, and why they matter right now.",
      },
    ];

    for (const summary of summaryTypes) {
      try {
        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cerebrasApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages: [
              {
                role: "system",
                content: summary.prompt,
              },
              {
                role: "user",
                content: `Startup data:\n\n${args.scrapedData}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content || "";

          await ctx.runMutation(api.mutations.createSummary, {
            startupName: args.startupName,
            summaryType: summary.type,
            content,
          });
        }
      } catch (error) {
        console.error(`Error generating summary ${summary.type}:`, error);
      }
    }
  },
});
