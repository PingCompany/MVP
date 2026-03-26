import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAuth } from "./auth";

export const submit = mutation({
  args: {
    slug: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!workspace) throw new Error("Workspace not found");

    const existing = await ctx.db
      .query("accessRequests")
      .withIndex("by_email_workspace", (q) =>
        q.eq("email", args.email).eq("workspaceId", workspace._id),
      )
      .first();
    if (existing && existing.status === "pending") {
      throw new Error("You already have a pending access request");
    }

    let userId: Id<"users"> | undefined;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
        .unique();
      if (user) {
        userId = user._id;
      }
    }

    await ctx.db.insert("accessRequests", {
      workspaceId: workspace._id,
      email: args.email,
      name: args.name,
      message: args.message,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can view access requests");
    }
    return await ctx.db
      .query("accessRequests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const review = mutation({
  args: {
    requestId: v.id("accessRequests"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Access request not found");

    const admin = await requireAuth(ctx, request.workspaceId);
    if (admin.role !== "admin") {
      throw new Error("Only admins can review access requests");
    }

    if (request.status !== "pending") {
      throw new Error("This request has already been reviewed");
    }

    if (args.decision === "approved") {
      if (request.userId) {
        // Add user as member directly
        const existingMembership = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_user_workspace", (q) =>
            q.eq("userId", request.userId!).eq("workspaceId", request.workspaceId),
          )
          .unique();

        if (!existingMembership) {
          await ctx.db.insert("workspaceMembers", {
            userId: request.userId,
            workspaceId: request.workspaceId,
            role: "member",
            joinedAt: Date.now(),
          });

          // Auto-join #general
          const generalChannel = await ctx.db
            .query("channels")
            .withIndex("by_workspace_name", (q) =>
              q.eq("workspaceId", request.workspaceId).eq("name", "general"),
            )
            .unique();

          if (generalChannel) {
            await ctx.db.insert("channelMembers", {
              channelId: generalChannel._id,
              userId: request.userId,
            });
          }
        }
      } else {
        // Create an invitation for the email
        const token = crypto.randomUUID();
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        await ctx.db.insert("invitations", {
          workspaceId: request.workspaceId,
          email: request.email,
          invitedBy: admin._id,
          role: "member",
          status: "pending",
          token,
          expiresAt: Date.now() + ninetyDays,
        });
      }
    }

    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });
  },
});

export const countPending = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can view access request counts");
    }
    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "pending"),
      )
      .collect();
    return requests.length;
  },
});
