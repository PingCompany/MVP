import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const grantAccess = mutation({
  args: {
    agentId: v.id("agents"),
    conversationId: v.id("conversations"),
    permissions: v.union(v.literal("read"), v.literal("read_write")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    const user = await requireAuth(ctx, agent.workspaceId);
    if (user.role !== "admin")
      throw new Error("Only admins can manage agent scopes");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.workspaceId !== agent.workspaceId)
      throw new Error("Conversation not found");

    const existing = await ctx.db
      .query("agentConversationScopes")
      .withIndex("by_agent_and_conversation", (q) =>
        q
          .eq("agentId", args.agentId)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { permissions: args.permissions });
      return existing._id;
    }

    return await ctx.db.insert("agentConversationScopes", {
      agentId: args.agentId,
      conversationId: args.conversationId,
      permissions: args.permissions,
      grantedBy: user._id,
      grantedAt: Date.now(),
    });
  },
});

export const revokeAccess = mutation({
  args: {
    agentId: v.id("agents"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    const user = await requireAuth(ctx, agent.workspaceId);
    if (user.role !== "admin")
      throw new Error("Only admins can manage agent scopes");

    const scope = await ctx.db
      .query("agentConversationScopes")
      .withIndex("by_agent_and_conversation", (q) =>
        q
          .eq("agentId", args.agentId)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (scope) {
      await ctx.db.delete(scope._id);
    }
  },
});

export const updatePermission = mutation({
  args: {
    scopeId: v.id("agentConversationScopes"),
    permissions: v.union(v.literal("read"), v.literal("read_write")),
  },
  handler: async (ctx, args) => {
    const scope = await ctx.db.get(args.scopeId);
    if (!scope) throw new Error("Scope not found");

    const agent = await ctx.db.get(scope.agentId);
    if (!agent) throw new Error("Agent not found");

    const user = await requireAuth(ctx, agent.workspaceId);
    if (user.role !== "admin")
      throw new Error("Only admins can manage agent scopes");

    await ctx.db.patch(args.scopeId, { permissions: args.permissions });
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    await requireAuth(ctx, agent.workspaceId);

    const scopes = await ctx.db
      .query("agentConversationScopes")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .take(100);

    const result = [];
    for (const scope of scopes) {
      const conversation = await ctx.db.get(scope.conversationId);
      if (conversation) {
        result.push({
          _id: scope._id,
          conversationId: scope.conversationId,
          conversationName: conversation.name,
          permissions: scope.permissions,
          grantedAt: scope.grantedAt,
        });
      }
    }
    return result;
  },
});

export const listByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await requireAuth(ctx, conversation.workspaceId);

    const scopes = await ctx.db
      .query("agentConversationScopes")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .take(50);

    const result = [];
    for (const scope of scopes) {
      const agent = await ctx.db.get(scope.agentId);
      if (agent) {
        result.push({
          _id: scope._id,
          agentId: scope.agentId,
          agentName: agent.name,
          permissions: scope.permissions,
        });
      }
    }
    return result;
  },
});

export const checkAccess = internalQuery({
  args: {
    agentId: v.id("agents"),
    conversationId: v.id("conversations"),
    requiredPermission: v.union(v.literal("read"), v.literal("read_write")),
  },
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("agentConversationScopes")
      .withIndex("by_agent_and_conversation", (q) =>
        q
          .eq("agentId", args.agentId)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (!scope) return false;
    // read or read_write both satisfy a "read" requirement
    if (args.requiredPermission === "read") return true;
    return scope.permissions === "read_write";
  },
});
