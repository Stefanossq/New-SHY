import { query, mutation, internalMutation, internalQuery, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./authz";
import { currentUser, getOrCreateUser } from "./users";
import { SITE } from "../src/lib/site";

const shippingAddress = v.object({
  fullName: v.string(),
  address: v.string(),
  city: v.string(),
  postalCode: v.string(),
});

/** Devolve ao estoque os itens de um pedido cancelado. */
async function restoreStock(ctx: MutationCtx, order: Doc<"sales">) {
  for (const item of order.items) {
    const product = await ctx.db.get(item.productId);
    if (product) await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
  }
}

async function clearCart(ctx: MutationCtx, userId: Id<"users">) {
  const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
  if (cart) await ctx.db.patch(cart._id, { items: [] });
}

/**
 * Cria o pedido a partir do carrinho salvo no servidor.
 * Preços e estoque vêm do banco, nunca do navegador. O estoque é reservado na criação.
 * Com pagamentos ativos o pedido nasce "pending_payment" e só vira "paid" pelo webhook do Stripe.
 */
export const createFromCart = mutation({
  args: { shippingAddress },
  handler: async (ctx, { shippingAddress }) => {
    for (const [field, value] of Object.entries(shippingAddress)) {
      if (!value.trim()) throw new Error(`Preencha o campo ${field}.`);
    }
    const user = await getOrCreateUser(ctx);
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart || cart.items.length === 0) throw new Error("Seu carrinho está vazio.");

    // Um cliente só tem um pagamento em aberto por vez: cancela os anteriores e devolve o estoque.
    const pending = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending_payment"))
      .collect();
    for (const order of pending) {
      await ctx.db.patch(order._id, { status: "cancelled" });
      await restoreStock(ctx, order);
    }

    const items = [];
    let total = 0;
    for (const item of cart.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error("Um produto do carrinho não existe mais.");
      if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para "${product.name}".`);
      items.push({ productId: product._id, name: product.name, price: product.price, quantity: item.quantity });
      total += product.price * item.quantity;
    }
    for (const item of items) {
      const product = (await ctx.db.get(item.productId))!;
      await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
    }

    const status = SITE.features.payments ? "pending_payment" : "placed";
    const orderId = await ctx.db.insert("sales", {
      userId: user._id,
      items,
      total: Math.round(total * 100) / 100,
      status,
      shippingAddress,
    });
    if (status === "placed") await clearCart(ctx, user._id);
    return orderId;
  },
});

/** Pedido do próprio usuário (para a página de confirmação). */
export const getById = query({
  args: { id: v.id("sales") },
  handler: async (ctx, { id }) => {
    const user = await currentUser(ctx);
    const order = await ctx.db.get(id);
    if (!user || !order || order.userId !== user._id) return null;
    return order;
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/** Todos os pedidos, só para administradores. */
export const all = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("sales").order("desc").take(200);
  },
});

// ---- Uso interno pelo módulo de pagamentos ----

export const getForPayment = internalQuery({
  args: { orderId: v.id("sales"), clerkId: v.string() },
  handler: async (ctx, { orderId, clerkId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return null;
    const user = await ctx.db.get(order.userId);
    if (!user || user.clerkId !== clerkId) return null;
    return order;
  },
});

export const attachSession = internalMutation({
  args: { orderId: v.id("sales"), sessionId: v.string() },
  handler: async (ctx, { orderId, sessionId }) => {
    await ctx.db.patch(orderId, { stripeSessionId: sessionId });
  },
});

/** Confirmado pelo webhook. Idempotente: eventos repetidos não alteram nada. */
export const markPaid = internalMutation({
  args: { orderId: v.id("sales") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "paid") return;
    if (order.status === "cancelled") {
      // Pagamento chegou depois do cancelamento: reserva o estoque de novo.
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) await ctx.db.patch(item.productId, { stock: Math.max(0, product.stock - item.quantity) });
      }
    }
    await ctx.db.patch(orderId, { status: "paid" });
    await clearCart(ctx, order.userId);
  },
});

export const markExpired = internalMutation({
  args: { orderId: v.id("sales") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status !== "pending_payment") return;
    await ctx.db.patch(orderId, { status: "cancelled" });
    await restoreStock(ctx, order);
  },
});
