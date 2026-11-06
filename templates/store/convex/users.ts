import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return existingUser._id;
    
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
    });
  },
});
