import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("sales").order("desc").collect();
  },
});

export const getById = query({
    args: { id: v.id("sales") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const sale = await ctx.db.get(args.id);
        if (!sale) return null;
        const user = await ctx.db.get(sale.userId);
        if (!user || user.clerkId !== identity.subject) return null;
        return sale;
    }
});

export const create = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Usuário não autenticado.");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        const userId = user ? user._id : await ctx.db.insert("users", { name: identity.name!, clerkId: identity.subject });

        for (const item of args.items) {
            const product = await ctx.db.get(item.productId);
            if (product && product.stock >= item.quantity) {
                await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
            }
        }
        
        const saleId = await ctx.db.insert("sales", { ...args, userId });

        const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        if (cart) await ctx.db.patch(cart._id, { items: [] });
           
        return saleId;
    }
});
