import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { currentUser, getOrCreateUser } from "./users";

const assertQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) throw new Error("Quantidade inválida.");
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return [];
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return [];
    const items = await Promise.all(
      cart.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      }),
    );
    return items.filter((item) => item !== null);
  },
});

export const addItem = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, { productId, quantity }) => {
    assertQuantity(quantity);
    if (!(await ctx.db.get(productId))) throw new Error("Produto não encontrado.");
    const user = await getOrCreateUser(ctx);
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) {
      await ctx.db.insert("cart", { userId: user._id, items: [{ productId, quantity }] });
      return;
    }
    const items = [...cart.items];
    const index = items.findIndex((item) => item.productId === productId);
    if (index !== -1) items[index] = { productId, quantity: Math.min(99, items[index].quantity + quantity) };
    else items.push({ productId, quantity });
    await ctx.db.patch(cart._id, { items });
  },
});

export const updateItemQuantity = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, { productId, quantity }) => {
    assertQuantity(quantity);
    const user = await getOrCreateUser(ctx);
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return;
    const items =
      quantity > 0
        ? cart.items.map((item) => (item.productId === productId ? { productId, quantity } : item))
        : cart.items.filter((item) => item.productId !== productId);
    await ctx.db.patch(cart._id, { items });
  },
});

export const removeItem = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const user = await getOrCreateUser(ctx);
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return;
    await ctx.db.patch(cart._id, { items: cart.items.filter((item) => item.productId !== productId) });
  },
});
