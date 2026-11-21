"use node";
import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ${name} não configurada no Convex (npx convex env set ${name} ...).`);
  return value;
};

const stripe = () => new Stripe(env("STRIPE_SECRET_KEY"));

/** Cria a sessão de checkout do Stripe para um pedido do próprio usuário e devolve a URL. */
export const createCheckout = action({
  args: { orderId: v.id("sales") },
  handler: async (ctx, { orderId }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Faça login para pagar.");
    const order = await ctx.runQuery(internal.orders.getForPayment, { orderId, clerkId: identity.subject });
    if (!order) throw new Error("Pedido não encontrado.");
    if (order.status !== "pending_payment") throw new Error("Este pedido não está aguardando pagamento.");

    const siteUrl = env("SITE_URL").replace(/\/$/, "");
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "brl",
          unit_amount: Math.round(item.price * 100),
          product_data: { name: item.name },
        },
      })),
      client_reference_id: orderId,
      metadata: { orderId },
      customer_email: identity.email,
      // Sessão expira em 30 min; o webhook devolve o estoque reservado.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${siteUrl}/order-confirmation?orderId=${orderId}`,
      cancel_url: `${siteUrl}/cart`,
    });
    if (!session.url) throw new Error("O Stripe não retornou a URL de pagamento.");
    await ctx.runMutation(internal.orders.attachSession, { orderId, sessionId: session.id });
    return session.url;
  },
});

/** Chamado pelo endpoint HTTP /stripe/webhook (convex/http.ts). */
export const handleWebhook = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }): Promise<{ ok: boolean; error?: string }> => {
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(payload, signature, env("STRIPE_WEBHOOK_SECRET"));
    } catch (err) {
      return { ok: false, error: `Assinatura inválida: ${(err as Error).message}` };
    }

    if (event.type.startsWith("checkout.session.")) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as Id<"sales"> | undefined;
      if (!orderId) return { ok: true };
      switch (event.type) {
        case "checkout.session.completed":
          // Pix e boleto ficam "unpaid" aqui e são confirmados no evento async_payment_succeeded.
          if (session.payment_status === "paid") await ctx.runMutation(internal.orders.markPaid, { orderId });
          break;
        case "checkout.session.async_payment_succeeded":
          await ctx.runMutation(internal.orders.markPaid, { orderId });
          break;
        case "checkout.session.expired":
        case "checkout.session.async_payment_failed":
          await ctx.runMutation(internal.orders.markExpired, { orderId });
          break;
      }
    }
    return { ok: true };
  },
});
