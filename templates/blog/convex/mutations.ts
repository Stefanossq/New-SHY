import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Internal Mutations (Uso interno/AI) ---

export const savePost = internalMutation({
  args: {
    title: v.string(),
    content_markdown: v.string(),
    image_url: v.string(),
    jikan_id: v.number(),
    slug: v.string(),
    authorId: v.string(),
    published_date: v.string(),
    comments: v.optional(v.array(v.object({
        user: v.string(),
        content: v.string(),
        type: v.string()
    })))
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("jikan_id"), args.jikan_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("posts", { ...args, likes: 0 });
    }
  },
});

export const saveTeam = internalMutation({
    args: {
        ownerId: v.string(),
        characters: v.array(
            v.object({
                jikanId: v.number(),
                name: v.string(),
                imageUrl: v.string(),
            })
        )
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("teams", {
            ownerId: args.ownerId,
            characters: args.characters,
            createdAt: Date.now()
        });
    }
});

export const saveGame = internalMutation({
    args: {
        title: v.string(),
        thumbnail: v.string(),
        platform: v.string(),
        short_description: v.string(),
        gemini_recommendation: v.string(),
        game_url: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("games", {
            ...args,
            generatedAt: Date.now()
        });
    }
});

export const savePromo = internalMutation({
    args: {
        title: v.string(),
        embed_url: v.string(),
        image_url: v.string(),
    },
    handler: async (ctx, args) => {
        // Limpa promos antigos para deixar apenas o destaque
        const existing = await ctx.db.query("promos").collect();
        for (const p of existing) {
            await ctx.db.delete(p._id);
        }
        await ctx.db.insert("promos", {
            ...args,
            updatedAt: Date.now()
        });
    }
});

export const logAudit = internalMutation({
  args: {
    action: v.string(),
    model: v.string(),
    input_prompt: v.string(),
    output_summary: v.string(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILURE")),
    executorId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// --- Public Mutations ---

export const likePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return;
    // Incrementa like atomicamente
    await ctx.db.patch(args.id, { likes: (post.likes || 0) + 1 });
  },
});


// --- Protected Mutations (Admin) ---

export const deletePostPublic = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Acesso negado.");
    await ctx.db.delete(args.id);
  },
});

export const updatePostPublic = mutation({
  args: {
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    content_markdown: v.string(),
    image_url: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Acesso negado.");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
