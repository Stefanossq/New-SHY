"use node";
import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { SITE } from "../src/lib/site";
import { PLAN } from "../src/lib/plan";

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ${name} não configurada no Convex (npx convex env set ${name} ...).`);
  return value;
};

const stripe = () => new Stripe(env("STRIPE_SECRET_KEY"));
const siteUrl = () => env("SITE_URL").replace(/\/$/, "");

/** Abre o checkout de assinatura mensal e devolve a URL do Stripe. */
export const createSubscriptionCheckout = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Faça login para assinar.");
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: PLAN.priceCents,
            recurring: { interval: "month" },
            product_data: { name: `${SITE.name} - ${PLAN.name}` },
          },
        },
      ],
      client_reference_id: identity.subject,
      customer_email: identity.email,
      subscription_data: { metadata: { clerkId: identity.subject } },
      success_url: `${siteUrl()}/premium?status=sucesso`,
      cancel_url: `${siteUrl()}/premium`,
    });
    if (!session.url) throw new Error("O Stripe não retornou a URL de pagamento.");
    return session.url;
  },
});

/** Portal do Stripe para o assinante trocar cartão ou cancelar. */
export const createBillingPortal = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Faça login.");
    const customer = await ctx.runQuery(internal.subscriptions.customerFor, { clerkId: identity.subject });
    if (!customer) throw new Error("Nenhuma assinatura encontrada.");
    const portal = await stripe().billingPortal.sessions.create({ customer, return_url: `${siteUrl()}/premium` });
    return portal.url;
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

    let subscription: Stripe.Subscription | null = null;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        subscription = await stripe().subscriptions.retrieve(session.subscription);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      subscription = event.data.object as Stripe.Subscription;
    }

    const clerkId = subscription?.metadata?.clerkId;
    if (subscription && clerkId) {
      await ctx.runMutation(internal.subscriptions.upsertFromStripe, {
        clerkId,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
      });
    }
    return { ok: true };
  },
});
