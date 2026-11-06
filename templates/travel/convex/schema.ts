import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trips: defineTable({
    userId: v.string(),
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
    itinerary: v.string(), // JSON stringified
    title: v.string(),
  }).index("by_user", ["userId"]),
});
