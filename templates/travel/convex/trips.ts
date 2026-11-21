import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authz";
import { assertCanSaveTrip } from "./plan";

export const createTrip = mutation({
  args: {
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
    itinerary: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    if (args.itinerary.length > 100_000) throw new Error("Roteiro grande demais.");
    await assertCanSaveTrip(ctx, identity.subject);
    await ctx.db.insert("trips", { ...args, userId: identity.subject });
  },
});

export const deleteTrip = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const identity = await requireUser(ctx);
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== identity.subject) throw new Error("Roteiro não encontrado.");
    await ctx.db.delete(id);
  },
});

export const getMyTrips = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("trips").withIndex("by_user", q => q.eq("userId", identity.subject)).order("desc").collect();
  }
});
