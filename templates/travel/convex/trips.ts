import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.insert("trips", { ...args, userId: identity.subject });
  },
});

export const getMyTrips = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("trips").withIndex("by_user", q => q.eq("userId", identity.subject)).order("desc").collect();
  }
});
