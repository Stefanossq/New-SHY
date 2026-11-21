import { defineTable } from "convex/server";
import { v } from "convex/values";

// Tabelas do módulo de assinatura (Stripe).
export const paymentTables = {
  subscriptions: defineTable({
    clerkId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    /** Status do Stripe: active, trialing, past_due, canceled, unpaid, incomplete... */
    status: v.string(),
    updatedAt: v.number(),
  })
    .index("by_clerk", ["clerkId"])
    .index("by_subscription", ["stripeSubscriptionId"]),
};
