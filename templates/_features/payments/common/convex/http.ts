import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook do Stripe. Configure no painel do Stripe apontando para
 * https://<seu-deployment>.convex.site/stripe/webhook
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Assinatura ausente", { status: 400 });
    const result = await ctx.runAction(internal.stripe.handleWebhook, {
      payload: await request.text(),
      signature,
    });
    return new Response(result.ok ? null : result.error, { status: result.ok ? 200 : 400 });
  }),
});

export default http;
