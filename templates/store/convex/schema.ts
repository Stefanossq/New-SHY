import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { paymentTables } from "./paymentTables";

export const orderStatus = v.union(
  v.literal("placed"), // pedido feito, pagamento na entrega
  v.literal("pending_payment"), // aguardando pagamento no Stripe
  v.literal("paid"),
  v.literal("cancelled"),
);

export default defineSchema({
  ...paymentTables,
  products: defineTable({
    name: v.string(),
    price: v.number(),
    description: v.string(),
    category: v.string(),
    stock: v.number(),
    imageUrl: v.string(),
  }),
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.string(), // Clerk ID
    userName: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  }).index("by_product", ["productId"]),
  sales: defineTable({
    userId: v.id("users"),
    total: v.number(),
    status: orderStatus,
    stripeSessionId: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      }),
    ),
    shippingAddress: v.object({
      fullName: v.string(),
      address: v.string(),
      city: v.string(),
      postalCode: v.string(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_session", ["stripeSessionId"]),
  users: defineTable({
    name: v.string(),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
  cart: defineTable({
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
  }).index("by_userId", ["userId"]),
});
