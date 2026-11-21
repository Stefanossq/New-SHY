import { MutationCtx } from "./_generated/server";
import { isPremium } from "./subscriptions";
import { PLAN } from "../src/lib/plan";

/** Plano grátis salva até PLAN.freeTripLimit roteiros; Premium não tem limite. */
export async function assertCanSaveTrip(ctx: MutationCtx, clerkId: string): Promise<void> {
  if (await isPremium(ctx, clerkId)) return;
  const trips = await ctx.db
    .query("trips")
    .withIndex("by_user", (q) => q.eq("userId", clerkId))
    .take(PLAN.freeTripLimit);
  if (trips.length >= PLAN.freeTripLimit) {
    throw new Error(`O plano grátis salva até ${PLAN.freeTripLimit} roteiros. Assine o ${PLAN.name} em /premium.`);
  }
}
