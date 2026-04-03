import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { createOrUpdateUserHandler } from "./users";

export const getDefaultWorkspace = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "default"))
      .unique();
  },
});

export const internalCreateOrUpdateUser = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await createOrUpdateUserHandler(ctx, args);
  },
});

export const deactivateUser = internalMutation({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", args.workosUserId),
      )
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, { status: "deactivated" });
  },
});

export const postSystemMessage = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    conversationName: v.string(),
    body: v.string(),
    integrationObjectId: v.optional(v.id("integrationObjects")),
  },
  handler: async (ctx, args) => {
    // Find system user
    const systemUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", "system"))
      .unique();

    if (!systemUser) return;

    // Find conversation by name, fall back to "engineering" then "general"
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_and_name", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("name", args.conversationName),
      )
      .unique();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_workspace_and_name", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("name", "engineering"),
        )
        .unique();
    }

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_workspace_and_name", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("name", "general"),
        )
        .unique();
    }

    if (!conversation) return;

    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      authorId: systemUser._id,
      body: args.body,
      type: "system",
      integrationObjectId: args.integrationObjectId,
      isEdited: false,
    });
  },
});
