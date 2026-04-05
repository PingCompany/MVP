import { internalMutation } from "./_generated/server";

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("sessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(500);

    await Promise.all(expired.map((s) => ctx.db.delete(s._id)));
  },
});
