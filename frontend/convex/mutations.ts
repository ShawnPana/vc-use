import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createAnalysis = mutation({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    const existingAnalysis = await ctx.db
      .query("analyses")
      .withIndex("by_startup_and_agent", (q) =>
        q.eq("startupName", args.startupName).eq("agentId", args.agentId)
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
    return await ctx.db.insert("summaries", {
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
    const existing = await ctx.db
      .query("scrapedData")
      .withIndex("by_startup", (q) => q.eq("startupName", args.startupName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        timestamp: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("scrapedData", {
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
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
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
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      // Agent doesn't exist yet - create it
      const maxOrder = (await ctx.db.query("agents").collect())
        .reduce((max, a) => Math.max(max, a.order), -1);

      await ctx.db.insert("agents", {
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
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
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
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
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
    const existingAgents = await ctx.db.query("agents").collect();

    // Only seed if database is empty
    if (existingAgents.length === 0) {
      for (const agent of args.agents) {
        await ctx.db.insert("agents", agent);
      }
      return { seeded: true, count: args.agents.length };
    }

    return { seeded: false, count: existingAgents.length };
  },
});
