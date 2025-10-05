import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createAnalysis = mutation({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
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
    if (!userId) {
      throw new Error("User must be authenticated");
    }

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
    if (!userId) {
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
    if (!userId) {
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
    if (!userId) {
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
    if (!userId) {
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
    if (!userId) {
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Only seed if user has no agents
    if (existingAgents.length === 0) {
      for (const agent of args.agents) {
        await ctx.db.insert("agents", {
          userId,
          ...agent,
        });
      }
      return { seeded: true, count: args.agents.length };
    }

    return { seeded: false, count: existingAgents.length };
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
    if (!userId) {
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
    if (!userId) {
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
