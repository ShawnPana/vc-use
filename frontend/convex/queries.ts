import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAnalyses = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .collect();
    return analyses;
  },
});

export const getSummaries = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const summaries = await ctx.db
      .query("summaries")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .collect();
    return summaries;
  },
});

export const getScrapedData = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const data = await ctx.db
      .query("scrapedData")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .first();
    return data;
  },
});

export const getAgents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return agents.sort((a, b) => a.order - b.order);
  },
});

export const getActiveAgents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return agents.filter(a => a.isActive).sort((a, b) => a.order - b.order);
  },
});

export const getPortfolioCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const companies = await ctx.db
      .query("portfolio")
      .withIndex("by_user_and_added_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return companies;
  },
});

export const isInPortfolio = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const company = await ctx.db
      .query("portfolio")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", userId).eq("startupName", args.startupName))
      .first();
    return !!company;
  },
});

export const getPendingAnalysis = query({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingAnalyses")
      .withIndex("by_startup", (q) => q.eq("startupName", args.startupName))
      .first();
  },
});

export const getAgentsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getScrapedDataByUserId = query({
  args: {
    userId: v.id("users"),
    startupName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scrapedData")
      .withIndex("by_user_and_startup", (q) => q.eq("userId", args.userId).eq("startupName", args.startupName))
      .first();
  },
});
