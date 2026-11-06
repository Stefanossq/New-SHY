import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Buscar reviews de um produto
export const getByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();
  },
});

// Adicionar review
export const add = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Login necessário para avaliar.");

    await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: identity.subject,
      userName: identity.name || "Usuário",
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
  },
});
