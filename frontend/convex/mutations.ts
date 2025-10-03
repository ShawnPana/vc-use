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
