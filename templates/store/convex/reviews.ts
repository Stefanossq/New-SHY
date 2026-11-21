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
    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5) throw new Error("Nota deve ser de 1 a 5.");
    const comment = args.comment.trim().slice(0, 1000);
    if (!comment) throw new Error("Escreva um comentário.");
    if (!(await ctx.db.get(args.productId))) throw new Error("Produto não encontrado.");

    await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: identity.subject,
      userName: identity.name || "Usuário",
      rating: args.rating,
      comment,
      createdAt: Date.now(),
    });
  },
});
