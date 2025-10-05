import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  analyses: defineTable({
    userId: v.string(),
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
    analysis: v.string(),
    timestamp: v.number(),
    status: v.union(v.literal("loading"), v.literal("completed"), v.literal("error")),
  })
    .index("by_user_and_startup", ["userId", "startupName"])
    .index("by_user_startup_and_agent", ["userId", "startupName", "agentId"]),

  summaries: defineTable({
    userId: v.string(),
    startupName: v.string(),
    summaryType: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_user_and_startup", ["userId", "startupName"]),

  scrapedData: defineTable({
    userId: v.string(),
    startupName: v.string(),
    data: v.string(),
    timestamp: v.number(),
  }).index("by_user_and_startup", ["userId", "startupName"]),

  agents: defineTable({
    userId: v.string(),
    agentId: v.string(),
    name: v.string(),
    prompt: v.string(),
    icon: v.string(),
    accent: v.string(),
    isActive: v.boolean(),
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_agent_id", ["userId", "agentId"]),

  portfolio: defineTable({
    userId: v.string(),
    startupName: v.string(),
    addedAt: v.number(),
    website: v.optional(v.string()),
    bio: v.optional(v.string()),
    summary: v.optional(v.string()),
  })
    .index("by_user_and_startup", ["userId", "startupName"])
    .index("by_user_and_added_date", ["userId", "addedAt"]),
});
