import { query } from "./_generated/server";
import { requireUser } from "./auth";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "active"),
      )
      .take(20);

    return Promise.all(
      drafts.map(async (draft) => {
        const conversation = await ctx.db.get(draft.conversationId);
        return {
          ...draft,
          conversationName: conversation?.name ?? "unknown",
        };
      }),
    );
  },
});
