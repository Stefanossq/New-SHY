import { query, internalMutation, internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const ACTIVE = new Set(["active", "trialing"]);

export async function isPremium(ctx: QueryCtx, clerkId: string): Promise<boolean> {
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
    .order("desc")
    .first();
  return sub !== null && ACTIVE.has(sub.status);
}

/** Plano do usuário logado, para a interface. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
      .order("desc")
      .first();
    return { premium: sub !== null && ACTIVE.has(sub.status), status: sub?.status ?? null };
  },
});

export const customerFor = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .first();
    return sub?.stripeCustomerId ?? null;
  },
});

/** Grava o estado vindo do webhook do Stripe. Idempotente. */
export const upsertFromStripe = internalMutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { status: args.status, updatedAt: Date.now() });
    else await ctx.db.insert("subscriptions", { ...args, updatedAt: Date.now() });
  },
});
