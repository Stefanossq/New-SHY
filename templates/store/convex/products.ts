import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const requireAuth = async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Autenticação necessária.");
    }
    return identity;
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const add = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        stock: v.number(),
        description: v.string(),
        category: v.string(),
        imageUrl: v.string()
    },
    handler: async (ctx, args) => {
        await requireAuth(ctx);
        return await ctx.db.insert("products", args);
    }
});

export const update = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        price: v.optional(v.number()),
        stock: v.optional(v.number()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        imageUrl: v.optional(v.string())
    },
    handler: async (ctx, { id, ...rest }) => {
        await requireAuth(ctx);
        await ctx.db.patch(id, rest);
    }
});

export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await requireAuth(ctx);
        await ctx.db.delete(args.id);
    }
});

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const existingProducts = await ctx.db.query("products").collect();
        if (existingProducts.length > 0) return;
        
        const initialProducts = [
            { name: 'Minimalist Watch', price: 899.00, description: 'Design atemporal com acabamento em aço escovado.', category: 'Acessórios', stock: 15, imageUrl: 'https://placehold.co/400x400/111/fff?text=Watch' },
            { name: 'Leather Bag', price: 1250.00, description: 'Couro legítimo italiano com compartimento para laptop.', category: 'Acessórios', stock: 8, imageUrl: 'https://placehold.co/400x400/111/fff?text=Bag' },
            { name: 'Noise Cancelling Headphones', price: 1800.00, description: 'Silêncio absoluto para o seu foco.', category: 'Eletrônicos', stock: 20, imageUrl: 'https://placehold.co/400x400/111/fff?text=Audio' },
            { name: 'Mechanical Keyboard', price: 650.00, description: 'Switches táteis para uma experiência de digitação superior.', category: 'Eletrônicos', stock: 12, imageUrl: 'https://placehold.co/400x400/111/fff?text=Keyboard' },
        ];
        for (const product of initialProducts) {
            await ctx.db.insert("products", product);
        }
    }
});
