import { mutation } from "./_generated/server";

// Migration to delete all old data without userId
export const deleteOldData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing data to allow for schema change
    const analyses = await ctx.db.query("analyses").collect();
    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }

    const summaries = await ctx.db.query("summaries").collect();
    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    const scrapedData = await ctx.db.query("scrapedData").collect();
    for (const data of scrapedData) {
      await ctx.db.delete(data._id);
    }

    const agents = await ctx.db.query("agents").collect();
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }

    const portfolio = await ctx.db.query("portfolio").collect();
    for (const company of portfolio) {
      await ctx.db.delete(company._id);
    }

    return {
      deleted: {
        analyses: analyses.length,
        summaries: summaries.length,
        scrapedData: scrapedData.length,
        agents: agents.length,
        portfolio: portfolio.length,
      },
    };
  },
});
