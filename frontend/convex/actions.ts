"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const RATE_LIMIT_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Agent configurations with accent colors
const AGENTS = [
  {
    id: "diligence",
    name: "Due Diligence",
    prompt: "You are a legal and compliance analyst conducting due diligence. Extract and list:\n\n1. RED FLAGS: Legal issues, controversies, regulatory concerns, or ethical problems\n2. GOVERNANCE: Board composition, investor conflicts, corporate structure issues\n3. COMPLIANCE: Industry regulations they must follow and their compliance status\n4. RISKS: Key operational, legal, or reputational risks\n\nBe factual and cite specific issues found. Format as bullet points under each section header.",
    icon: "diligence",
    accent: "#ef4444",
  },
  {
    id: "financials",
    name: "Financial Analysis",
    prompt: "You are a financial analyst. Extract and calculate specific metrics:\n\n1. FUNDING: Total raised, valuation, last round details, runway estimate\n2. UNIT ECONOMICS: CAC, LTV, LTV:CAC ratio if available\n3. BURN RATE: Monthly burn, runway in months\n4. REVENUE MODEL: How they make money, pricing strategy\n5. PROFITABILITY: Path to profitability, current margins\n\nProvide specific numbers where available. If data is missing, note it. Format as sections with metrics.",
    icon: "financials",
    accent: "#f59e0b",
  },
  {
    id: "market",
    name: "Market Sizing",
    prompt: "You are a market research analyst. Provide:\n\n1. TAM/SAM/SOM: Total addressable, serviceable addressable, serviceable obtainable markets (with $ figures)\n2. MARKET GROWTH: Industry growth rate, trends, projections\n3. MARKET SHARE: Current position, growth trajectory\n4. TIMING: Why now? Market inflection points\n\nCite sources and provide specific numbers. Format with clear headers and bullet points.",
    icon: "market",
    accent: "#8b5cf6",
  },
  {
    id: "competitive",
    name: "Competitive Analysis",
    prompt: "You are a competitive intelligence analyst. Provide:\n\n1. DIRECT COMPETITORS: List top 3-5 with brief descriptions\n2. DIFFERENTIATION: What makes this company unique vs competitors\n3. COMPETITIVE MOATS: Defensibility (network effects, IP, scale, brand)\n4. MARKET POSITION: Leader/challenger/niche player\n5. THREATS: Who could disrupt them?\n\nBe specific about competitor names and differentiating features.",
    icon: "competitive",
    accent: "#06b6d4",
  },
  {
    id: "team",
    name: "Team Assessment",
    prompt: "You are an executive recruiter evaluating the founding team:\n\n1. FOUNDERS: Name, background, relevant experience, previous companies/exits\n2. EXPERTISE: Domain knowledge and complementary skills\n3. GAPS: Missing skill sets or roles needed\n4. TRACK RECORD: Previous successes/failures, lessons learned\n5. EXECUTION ABILITY: Evidence they can build and scale\n\nProvide factual backgrounds. Note red flags or strengths.",
    icon: "team",
    accent: "#10b981",
  },
  {
    id: "technology",
    name: "Technology Audit",
    prompt: "You are a technical architect assessing their technology:\n\n1. TECH STACK: Known technologies, infrastructure choices\n2. SCALABILITY: Can it handle 10x/100x growth?\n3. TECHNICAL MOAT: Proprietary tech, patents, unique algorithms\n4. FEASIBILITY: Is their product technically achievable?\n5. INNOVATION: Novel approach vs incremental improvement?\n\nBe specific about technologies and assess technical risks.",
    icon: "technology",
    accent: "#3b82f6",
  },
];

// Action to seed default agents to database
export const seedDefaultAgents = action({
  args: {},
  handler: async (ctx): Promise<{ seeded: boolean; count: number }> => {
    // Get auth user ID in the action
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Use internal mutation to avoid circular dependency
    const result = await ctx.runMutation(api.mutations.seedAgentsIfEmpty, {
      userId: userId.subject,
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
    let dbAgents = await ctx.runQuery(api.queries.getActiveAgents);

    // If no agents in DB, seed with default agents
    if (dbAgents.length === 0) {
      await ctx.runAction(api.actions.seedDefaultAgents);
      // Re-fetch agents
      dbAgents = await ctx.runQuery(api.queries.getActiveAgents);
    }

    const activeAgents = dbAgents;

    // Run agents sequentially to avoid hitting Cerebras rate limits
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
