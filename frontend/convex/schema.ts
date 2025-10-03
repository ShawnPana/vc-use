import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
    analysis: v.string(),
    timestamp: v.number(),
    status: v.union(v.literal("loading"), v.literal("completed"), v.literal("error")),
  })
    .index("by_startup", ["startupName"])
    .index("by_startup_and_agent", ["startupName", "agentId"]),

  summaries: defineTable({
    startupName: v.string(),
    summaryType: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_startup", ["startupName"]),

  scrapedData: defineTable({
    startupName: v.string(),
    data: v.string(),
    timestamp: v.number(),
  }).index("by_startup", ["startupName"]),
});
