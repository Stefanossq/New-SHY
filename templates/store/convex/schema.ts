import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    items: v.array(v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
    })),
    shippingAddress: v.object({
        fullName: v.string(),
        address: v.string(),
        city: v.string(),
        postalCode: v.string(),
    }),
  }),
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
      })
    ),
  }).index("by_userId", ["userId"]),
});
