import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Internal migration mutation to convert all old identity.subject strings to stable user IDs
 *
 * This migrates ALL users' data by looking up the auth account mapping.
 * Run this from the Convex dashboard without needing to be logged in.
 */
export const migrateAllUserIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting user ID migration for all users...");

    let totalMigrated = 0;
    const migrations: Array<{ oldUserId: string; stableUserId: string; count: number }> = [];

    // Get all authAccounts to find the mapping between providerAccountId (identity.subject) and stable user IDs
    const authAccounts = await ctx.db.query("authAccounts").collect();

    console.log(`Found ${authAccounts.length} auth accounts`);

    // Create a map of unique userId mappings
    const userIdMap = new Map<string, Id<"users">>();

    for (const account of authAccounts) {
      const stableUserId = account.userId;
      // The providerAccountId contains the identity.subject
      const oldUserId = account.providerAccountId;
      if (oldUserId && stableUserId) {
        userIdMap.set(oldUserId, stableUserId);
      }
    }

    console.log(`Found ${userIdMap.size} unique user mappings`);

    // Migrate each user's data
    for (const [oldUserId, stableUserId] of userIdMap.entries()) {
      console.log(`Migrating from old userId: ${oldUserId} to stable userId: ${stableUserId}`);

      let userMigratedCount = 0;

      // Migrate analyses
      const analyses = await ctx.db
        .query("analyses")
        .filter((q) => q.eq(q.field("userId"), oldUserId))
        .collect();

      for (const analysis of analyses) {
        await ctx.db.patch(analysis._id, { userId: stableUserId });
        userMigratedCount++;
      }

      // Migrate summaries
      const summaries = await ctx.db
        .query("summaries")
        .filter((q) => q.eq(q.field("userId"), oldUserId))
        .collect();

      for (const summary of summaries) {
        await ctx.db.patch(summary._id, { userId: stableUserId });
        userMigratedCount++;
      }

      // Migrate scrapedData
      const scrapedData = await ctx.db
        .query("scrapedData")
        .filter((q) => q.eq(q.field("userId"), oldUserId))
        .collect();

      for (const data of scrapedData) {
        await ctx.db.patch(data._id, { userId: stableUserId });
        userMigratedCount++;
      }

      // Migrate agents
      const agents = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("userId"), oldUserId))
        .collect();

      for (const agent of agents) {
        await ctx.db.patch(agent._id, { userId: stableUserId });
        userMigratedCount++;
      }

      // Migrate portfolio
      const portfolioItems = await ctx.db
        .query("portfolio")
        .filter((q) => q.eq(q.field("userId"), oldUserId))
        .collect();

      for (const item of portfolioItems) {
        await ctx.db.patch(item._id, { userId: stableUserId });
        userMigratedCount++;
      }

      migrations.push({
        oldUserId,
        stableUserId,
        count: userMigratedCount,
      });

      totalMigrated += userMigratedCount;
      console.log(`Migrated ${userMigratedCount} records for user ${stableUserId}`);
    }

    return {
      success: true,
      totalMigrated,
      usersMigrated: migrations.length,
      migrations,
    };
  },
});
