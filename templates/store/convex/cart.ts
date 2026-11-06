import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

const getOrCreateUser = async (ctx: MutationCtx): Promise<Doc<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Usuário não autenticado.");
    
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (user !== null) return user;

    const userId = await ctx.db.insert("users", { name: identity.name!, clerkId: identity.subject });
    return (await ctx.db.get(userId))!;
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];
    
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return [];

    const cartWithProducts = await Promise.all(cart.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;
        return { ...product, quantity: item.quantity };
    }));

    return cartWithProducts.filter(item => item !== null);
  },
});

export const addItem = mutation({
    args: { productId: v.id("products"), quantity: v.number() },
    handler: async (ctx, { productId, quantity }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();

        if (!cart) {
            await ctx.db.insert("cart", { userId: user._id, items: [{ productId, quantity }] });
            return;
        }

        const index = cart.items.findIndex(item => item.productId === productId);
        if (index !== -1) cart.items[index].quantity += quantity;
        else cart.items.push({ productId, quantity });
        
        await ctx.db.patch(cart._id, { items: cart.items });
    },
});

export const updateItemQuantity = mutation({
    args: { productId: v.id("products"), quantity: v.number() },
    handler: async (ctx, { productId, quantity }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (!cart) return;

        const index = cart.items.findIndex(item => item.productId === productId);
        if (index === -1) return;

        if (quantity > 0) cart.items[index].quantity = quantity;
        else cart.items.splice(index, 1);

        await ctx.db.patch(cart._id, { items: cart.items });
    }
});

export const removeItem = mutation({
    args: { productId: v.id("products") },
    handler: async (ctx, { productId }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (!cart) return;
        const updatedItems = cart.items.filter(item => item.productId !== productId);
        await ctx.db.patch(cart._id, { items: updatedItems });
    },
});

export const clear = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (cart) await ctx.db.patch(cart._id, { items: [] });
    }
});
