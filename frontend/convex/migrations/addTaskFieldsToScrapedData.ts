import { internalMutation } from "../_generated/server";

export const addTaskFieldsToScrapedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const scrapedData = await ctx.db.query("scrapedData").collect();

    let updated = 0;
    for (const record of scrapedData) {
      // Only update if taskId doesn't exist
      if (!record.taskId) {
        await ctx.db.patch(record._id, {
          taskId: undefined,
          taskStatus: undefined,
          taskUpdatedAt: undefined,
        });
        updated++;
      }
    }

    return { total: scrapedData.length, updated };
  },
});
