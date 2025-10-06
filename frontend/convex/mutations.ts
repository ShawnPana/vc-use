import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_AGENTS = [
  {
    id: "diligence",
    name: "Due Diligence",
    prompt: "You are a legal and compliance analyst conducting due diligence on this startup. Provide your analysis in numbered sections:\n\n1. RED FLAGS: Identify any legal, regulatory, or compliance concerns\n2. GOVERNANCE: Evaluate corporate structure and governance practices\n3. REGULATORY LANDSCAPE: Assess industry-specific regulations and licensing\n4. IP & CONTRACTS: Review intellectual property and key agreements\n5. RISK ASSESSMENT: Summarize key legal and compliance risks",
    icon: "diligence",
    accent: "#ef4444",
  },
  {
    id: "financial",
    name: "Financial Analysis",
    prompt: "You are a financial analyst evaluating this startup's business model and unit economics. Provide your analysis in numbered sections:\n\n1. BUSINESS MODEL: Analyze revenue streams and cost structure\n2. UNIT ECONOMICS: Evaluate CAC, LTV, margins, and payback period\n3. BURN RATE & RUNWAY: Assess current financial position\n4. GROWTH METRICS: Analyze growth rates and efficiency\n5. FINANCIAL OUTLOOK: Provide overall financial assessment",
    icon: "financial",
    accent: "#f59e0b",
  },
  {
    id: "market",
    name: "Market Sizing",
    prompt: "You are a market research analyst evaluating the market opportunity for this startup. Provide your analysis in numbered sections:\n\n1. TAM/SAM/SOM: Estimate total addressable, serviceable, and obtainable markets\n2. MARKET TRENDS: Identify key trends driving market growth\n3. CUSTOMER SEGMENTS: Define and size target customer segments\n4. MARKET DYNAMICS: Analyze market maturity and growth drivers\n5. MARKET OPPORTUNITY: Assess overall market attractiveness",
    icon: "market",
    accent: "#10b981",
  },
  {
    id: "competitive",
    name: "Competitive Analysis",
    prompt: "You are a competitive intelligence analyst mapping this startup's competitive landscape. Provide your analysis in numbered sections:\n\n1. DIRECT COMPETITORS: Identify and analyze key direct competitors\n2. INDIRECT COMPETITORS: Assess alternative solutions and substitutes\n3. COMPETITIVE POSITIONING: Evaluate differentiation and competitive advantages\n4. MARKET SHARE: Estimate relative market positions\n5. COMPETITIVE OUTLOOK: Assess competitive moat and sustainability",
    icon: "competitive",
    accent: "#3b82f6",
  },
  {
    id: "team",
    name: "Team Assessment",
    prompt: "You are an executive recruiter and talent evaluator assessing the founding team. Provide your analysis in numbered sections:\n\n1. FOUNDER BACKGROUNDS: Evaluate founders' experience and expertise\n2. TEAM COMPOSITION: Assess skill set coverage and gaps\n3. EXECUTION TRACK RECORD: Review past achievements and exits\n4. TEAM DYNAMICS: Evaluate founder complementarity\n5. TALENT ASSESSMENT: Provide overall team strength evaluation",
    icon: "team",
    accent: "#8b5cf6",
  },
  {
    id: "tech",
    name: "Technology Audit",
    prompt: "You are a technical due diligence specialist evaluating this startup's technology. Provide your analysis in numbered sections:\n\n1. TECHNICAL ARCHITECTURE: Assess technology stack and infrastructure\n2. PRODUCT DIFFERENTIATION: Evaluate technical innovation and uniqueness\n3. SCALABILITY: Analyze ability to scale technically\n4. TECHNICAL RISKS: Identify technical debt and risks\n5. TECHNICAL OUTLOOK: Provide overall technology assessment",
    icon: "tech",
    accent: "#ec4899",
  },
];

export const createAnalysis = mutation({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const existingAnalysis = await ctx.db
      .query("analyses")
      .withIndex("by_user_startup_and_agent", (q) =>
        q.eq("userId", userId).eq("startupName", args.startupName).eq("agentId", args.agentId)
      )
      .first();

    if (existingAnalysis) {
      await ctx.db.patch(existingAnalysis._id, {
        status: "loading",
        timestamp: Date.now(),
      });
      return existingAnalysis._id;
    }

    return await ctx.db.insert("analyses", {
      userId,
      startupName: args.startupName,
      agentId: args.agentId,
      agentName: args.agentName,
      analysis: "",
      timestamp: Date.now(),
      status: "loading",
    });
  },
});

export const updateAnalysis = mutation({
  args: {
    analysisId: v.id("analyses"),
    analysis: v.string(),
    status: v.union(v.literal("completed"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.analysisId, {
      analysis: args.analysis,
      status: args.status,
      timestamp: Date.now(),
    });
  },
});

export const createSummary = mutation({
  args: {
    startupName: v.string(),
    summaryType: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    // Check if a summary of this type already exists
    const existing = await ctx.db
      .query("summaries")
      .withIndex("by_user_and_startup", (q) =>
        q.eq("userId", userId).eq("startupName", args.startupName)
      )
      .filter((q) => q.eq(q.field("summaryType"), args.summaryType))
      .first();

    if (existing) {
      // Update existing summary
      await ctx.db.patch(existing._id, {
        content: args.content,
        timestamp: Date.now(),
      });
      return existing._id;
    }

    // Create new summary
    return await ctx.db.insert("summaries", {
      userId,
      startupName: args.startupName,
      summaryType: args.summaryType,
      content: args.content,
      timestamp: Date.now(),
    });
  },
});

export const storeScrapedData = mutation({
  args: {
    startupName: v.string(),
    data: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const existing = await ctx.db
      .query("scrapedData")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        timestamp: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("scrapedData", {
      userId,
      startupName: args.startupName,
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

export const upsertAgent = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    prompt: v.string(),
    icon: v.string(),
    accent: v.string(),
    isActive: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const existing = await ctx.db
      .query("agents")
      .withIndex("by_user_and_agent_id", (q) => q.eq("userId", userId).eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        prompt: args.prompt,
        icon: args.icon,
        accent: args.accent,
        isActive: args.isActive,
        order: args.order,
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      userId,
      agentId: args.agentId,
      name: args.name,
      prompt: args.prompt,
      icon: args.icon,
      accent: args.accent,
      isActive: args.isActive,
      order: args.order,
    });
  },
});

export const updateAgentPrompt = mutation({
  args: {
    agentId: v.string(),
    prompt: v.string(),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    accent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user_and_agent_id", (q) => q.eq("userId", userId).eq("agentId", args.agentId))
      .first();

    if (!agent) {
      // Agent doesn't exist yet - create it
      const userAgents = await ctx.db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const maxOrder = userAgents.reduce((max, a) => Math.max(max, a.order), -1);

      await ctx.db.insert("agents", {
        userId,
        agentId: args.agentId,
        name: args.name || args.agentId,
        prompt: args.prompt,
        icon: args.icon || args.agentId,
        accent: args.accent || "#818cf8",
        isActive: true,
        order: maxOrder + 1,
      });
      return;
    }

    await ctx.db.patch(agent._id, {
      prompt: args.prompt,
    });
  },
});

export const toggleAgentActive = mutation({
  args: {
    agentId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user_and_agent_id", (q) => q.eq("userId", userId).eq("agentId", args.agentId))
      .first();

    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    await ctx.db.patch(agent._id, {
      isActive: args.isActive,
    });
  },
});

export const deleteAgent = mutation({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user_and_agent_id", (q) => q.eq("userId", userId).eq("agentId", args.agentId))
      .first();

    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    await ctx.db.delete(agent._id);
  },
});

export const seedAgentsIfEmpty = mutation({
  args: {
    userId: v.id("users"),
    agents: v.array(
      v.object({
        agentId: v.string(),
        name: v.string(),
        prompt: v.string(),
        icon: v.string(),
        accent: v.string(),
        isActive: v.boolean(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Only seed if user has no agents
    if (existingAgents.length === 0) {
      for (const agent of args.agents) {
        await ctx.db.insert("agents", {
          userId: args.userId,
          ...agent,
        });
      }
      return { seeded: true, count: args.agents.length };
    }

    return { seeded: false, count: existingAgents.length };
  },
});

// Simple mutation to initialize agents for current user (called from client)
export const initializeMyAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Must be logged in");
    }

    // Check if user already has agents
    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingAgents.length > 0) {
      return { created: false, count: existingAgents.length };
    }

    // Create default agents for this user
    for (const [index, agent] of DEFAULT_AGENTS.entries()) {
      await ctx.db.insert("agents", {
        userId,
        agentId: agent.id,
        name: agent.name,
        prompt: agent.prompt,
        icon: agent.icon,
        accent: agent.accent,
        isActive: true,
        order: index,
      });
    }

    return { created: true, count: DEFAULT_AGENTS.length };
  },
});

export const addToPortfolio = mutation({
  args: {
    startupName: v.string(),
    website: v.optional(v.string()),
    bio: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    // Check if already in portfolio
    const existing = await ctx.db
      .query("portfolio")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .first();

    if (existing) {
      throw new Error("Company already in portfolio");
    }

    const portfolioId = await ctx.db.insert("portfolio", {
      userId,
      startupName: args.startupName,
      addedAt: Date.now(),
      website: args.website,
      bio: args.bio,
      summary: args.summary,
    });

    return portfolioId;
  },
});

export const removeFromPortfolio = mutation({
  args: {
    startupName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const company = await ctx.db
      .query("portfolio")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .first();

    if (!company) {
      throw new Error("Company not found in portfolio");
    }

    await ctx.db.delete(company._id);
  },
});
