"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const RATE_LIMIT_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Agent configurations with accent colors
const AGENTS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    prompt: "Act as a highly critical, risk-focused VC. Identify all potential red flags, market risks, competitive threats, and reasons this startup might fail. Analyze unit economics concerns, burn rate risks, and team gaps. Be thorough but fair in your criticism.",
    icon: "skeptic",
    accent: "#f87171",
  },
  {
    id: "believer",
    name: "The Believer",
    prompt: "Act as an optimistic, growth-focused VC. Highlight the startup's massive potential, market opportunities, competitive advantages, and what could make this a unicorn. Focus on the upside case, network effects, and scalability. Be enthusiastic but credible.",
    icon: "believer",
    accent: "#34d399",
  },
  {
    id: "engineer",
    name: "The Engineer",
    prompt: "Act as a senior technical expert and CTO evaluating the product. Assess technical feasibility, innovation level, architecture scalability, technical moat, and engineering quality. Evaluate their tech stack choices and technical team strength.",
    icon: "engineer",
    accent: "#38bdf8",
  },
  {
    id: "market",
    name: "Market Analyst",
    prompt: "Analyze the market opportunity, competitive landscape, market timing, and total addressable market (TAM). Compare to similar companies and their outcomes. Assess go-to-market strategy and market positioning.",
    icon: "market",
    accent: "#c084fc",
  },
  {
    id: "people",
    name: "People Expert",
    prompt: "Focus on the founding team. Research their backgrounds, how they met, their complementary skills, previous exits, domain expertise, and why this specific team can execute on this vision. Evaluate team composition and hiring ability.",
    icon: "people",
    accent: "#facc15",
  },
  {
    id: "ai",
    name: "AI Strategist",
    prompt: "Evaluate how well this company leverages AI, their AI strategy, defensibility of their AI approach, position in the AI landscape, and whether AI is core to their value prop or just a feature. Assess AI competitive moat.",
    icon: "ai",
    accent: "#818cf8",
  },
];

// Action to seed default agents to database
export const seedDefaultAgents = action({
  args: {},
  handler: async (ctx): Promise<{ seeded: boolean; count: number }> => {
    // Use internal mutation to avoid circular dependency
    const result = await ctx.runMutation(api.mutations.seedAgentsIfEmpty, {
      agents: AGENTS.map((agent, index) => ({
        agentId: agent.id,
        name: agent.name,
        prompt: agent.prompt,
        icon: agent.icon,
        accent: agent.accent,
        isActive: true,
        order: index,
      })),
    });

    return result;
  },
});

// Call backend Browser Use API to scrape startup data
export const scrapeStartupData = action({
  args: { startupName: v.string(), debug: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const apiKey = process.env.BACKEND_API_KEY;

    if (!apiKey) {
      throw new Error("BACKEND_API_KEY not configured");
    }

    try {
      const response = await fetch(`${backendUrl}/api/full-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          company_name: args.startupName,
          debug: args.debug || false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Backend analysis failed");
      }

      // Extract and format the data from backend
      const companyData = result.company;

      if (!companyData) {
        throw new Error("Backend analysis returned no company data");
      }
      const hypeData = result.hype;

      const scrapedData = {
        startupName: args.startupName,
        website: companyData.company_website,
        bio: companyData.company_bio,
        summary: companyData.company_summary,
        founders: (companyData.founders_info?.founders || []).map((f: any) => ({
          name: f.name,
          linkedin: f.social_media?.linkedin,
          twitter: f.social_media?.X,
          personalWebsite: f.personal_website,
          bio: f.bio,
        })),
        hype: hypeData
          ? {
              summary: hypeData.hype_summary,
              numbers: hypeData.numbers,
              recentNews: hypeData.recent_news,
            }
          : null,
      };

      // Store scraped data
      await ctx.runMutation(api.mutations.storeScrapedData, {
        startupName: args.startupName,
        data: JSON.stringify(scrapedData),
      });

      return scrapedData;
    } catch (error) {
      console.error("Error scraping startup data:", error);
      throw error;
    }
  },
});

// Analyze with AI using Cerebras API
export const analyzeWithCerebras = action({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
    agentPrompt: v.string(),
    scrapedData: v.string(),
  },
  handler: async (ctx, args) => {

    // Create analysis record with loading status
    const analysisId = await ctx.runMutation(api.mutations.createAnalysis, {
      startupName: args.startupName,
      agentId: args.agentId,
      agentName: args.agentName,
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
              content: args.agentPrompt,
            },
            {
              role: "user",
              content: `Analyze this startup based on the following detailed data gathered from web research:\n\n${args.scrapedData}\n\nProvide a detailed, insightful analysis in 3-5 paragraphs focusing on your specific perspective.`,
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
  args: { startupName: v.string(), debug: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    try {
      // First, scrape the data
      const scrapedData = await ctx.runAction(api.actions.scrapeStartupData, {
        startupName: args.startupName,
        debug: args.debug,
      });

    const scrapedDataString = JSON.stringify(scrapedData);

    // Get active agents from database
    const dbAgents = await ctx.runQuery(api.queries.getActiveAgents);

    // If no agents in DB, seed with default agents
    if (dbAgents.length === 0) {
      for (const [index, agent] of AGENTS.entries()) {
        await ctx.runMutation(api.mutations.upsertAgent, {
          agentId: agent.id,
          name: agent.name,
          prompt: agent.prompt,
          icon: agent.id, // Store icon name as string
          accent: "", // Will be set from frontend
          isActive: true,
          order: index,
        });
      }
      // Re-fetch agents
      const activeAgents = await ctx.runQuery(api.queries.getActiveAgents);

      // Run agents sequentially
      for (const [index, agent] of activeAgents.entries()) {
        try {
          await ctx.runAction(api.actions.analyzeWithCerebras, {
            startupName: args.startupName,
            agentId: agent.agentId,
            agentName: agent.name,
            agentPrompt: agent.prompt,
            scrapedData: scrapedDataString,
          });
        } finally {
          if (index < activeAgents.length - 1) {
            await sleep(RATE_LIMIT_DELAY_MS);
          }
        }
      }
    } else {
      // Run agents sequentially to avoid hitting Cerebras rate limits
      for (const [index, agent] of dbAgents.entries()) {
        try {
          await ctx.runAction(api.actions.analyzeWithCerebras, {
            startupName: args.startupName,
            agentId: agent.agentId,
            agentName: agent.name,
            agentPrompt: agent.prompt,
            scrapedData: scrapedDataString,
          });
        } finally {
          if (index < dbAgents.length - 1) {
            await sleep(RATE_LIMIT_DELAY_MS);
          }
        }
      }
    }

      // Generate summaries
      await ctx.runAction(api.actions.generateSummaries, {
        startupName: args.startupName,
        scrapedData: scrapedDataString,
      });

      return { success: true };
    } catch (error) {
      console.error("Error in analyzeStartup:", error);
      // Re-throw with a more helpful message if it's an auth error
      if (error instanceof Error && error.message.includes("must be authenticated")) {
        throw new Error("You must be signed in to analyze startups.");
      }
      throw error;
    }
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

    // Parse scraped data to extract rich information
    const scrapedData = JSON.parse(args.scrapedData);

    // For founder_story, use the actual founder bios if available
    const founderBios = scrapedData.founders
      ?.map((f: any) => `${f.name}: ${f.bio || 'Bio not available'}`)
      .join('\n') || '';

    const summaryTypes = [
      {
        type: "founder_story",
        prompt: `Based on the following founder information, create a brief, compelling summary of the founders' background and how they came together to start this company. Focus on their unique experiences and complementary skills. 2-3 sentences max.\n\nFounder Information:\n${founderBios}`,
        useDirectData: founderBios.length > 0,
      },
      {
        type: "market_position",
        prompt: "Summarize the company's position in the competitive landscape and their unique differentiation. 2-3 sentences max.",
        useDirectData: false,
      },
      {
        type: "funding_outlook",
        prompt: "Provide an assessment of their current funding stage and what they likely need next. 2-3 sentences max.",
        useDirectData: false,
      },
      {
        type: "company_overview",
        prompt: `Based on this company data, provide a tight, 2 sentence summary that highlights what they do, who they serve, and why they matter right now.\n\nCompany Bio: ${scrapedData.bio || ''}\nCompany Summary: ${scrapedData.summary || ''}`,
        useDirectData: true,
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
                content: summary.useDirectData
                  ? "Generate the summary based on the information in the system prompt."
                  : `Startup data:\n\n${args.scrapedData}`,
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
