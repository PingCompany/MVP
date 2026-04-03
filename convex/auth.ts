import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
    .unique();

  if (!user) throw new Error("User not found");
  return user;
}

export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
) {
  const user = await requireUser(ctx);

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_workspace", (q) =>
      q.eq("userId", user._id).eq("workspaceId", workspaceId),
    )
    .unique();
  if (!membership) throw new Error("Not a member of this workspace");

  return {
    ...user,
    workspaceId: membership.workspaceId,
    role: membership.role,
    membershipId: membership._id,
  };
}

/** Verify that a user is a member of a conversation. */
export async function requireConversationMember(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<Doc<"conversationMembers">> {
  const membership = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversation_and_user", (q) =>
      q.eq("conversationId", conversationId).eq("userId", userId),
    )
    .unique();

  if (!membership) throw new Error("Not a member of this conversation");
  return membership;
}

/**
 * For read-only operations: allows access to public conversations without membership.
 * For non-public conversations, enforces membership (throws if not a member).
 */
export async function requirePublicOrMember(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<{ conversation: Doc<"conversations">; membership: Doc<"conversationMembers"> | null }> {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const membership = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversation_and_user", (q) =>
      q.eq("conversationId", conversationId).eq("userId", userId),
    )
    .unique();

  if (conversation.visibility !== "public") {
    if (!membership) throw new Error("Not a member of this conversation");
  }

  return { conversation, membership };
}

/**
 * For a guest user, compute the set of user IDs visible to them
 * (members of conversations they share). Returns null for non-guest users.
 */
export async function getGuestVisibleUserIds(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  role: string,
): Promise<Set<string> | null> {
  if (role !== "guest") return null;

  const myMemberships = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(500);

  const visibleIds = new Set<string>();
  visibleIds.add(userId);
  for (const m of myMemberships) {
    const convMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", m.conversationId))
      .take(200);
    for (const cm of convMembers) {
      visibleIds.add(cm.userId);
    }
  }
  return visibleIds;
}

export function isGuest(role: string): boolean {
  return role === "guest";
}

export function requireNonGuest(role: string, action: string): void {
  if (role === "guest") {
    throw new Error(`Guests cannot ${action}`);
  }
}

// ── Legacy aliases for gradual migration ──

/** @deprecated Use requireConversationMember instead */
export const requireChannelMember = requireConversationMember as (
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"conversations">,
  userId: Id<"users">,
) => Promise<Doc<"conversationMembers">>;

/** @deprecated Use requireConversationMember instead */
export const requireDMmember = requireConversationMember as (
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
) => Promise<Doc<"conversationMembers">>;

/** @deprecated Use requirePublicOrMember instead */
export const requirePublicChannelOrMember = requirePublicOrMember as (
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"conversations">,
  userId: Id<"users">,
) => Promise<{ conversation: Doc<"conversations">; membership: Doc<"conversationMembers"> | null }>;
