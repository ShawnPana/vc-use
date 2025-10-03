import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAnalyses = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_startup", (q) => q.eq("startupName", args.startupName))
      .collect();
    return analyses;
  },
});

export const getSummaries = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("summaries")
      .withIndex("by_startup", (q) => q.eq("startupName", args.startupName))
      .collect();
    return summaries;
  },
});

export const getScrapedData = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("scrapedData")
      .withIndex("by_startup", (q) => q.eq("startupName", args.startupName))
      .first();
    return data;
  },
});
