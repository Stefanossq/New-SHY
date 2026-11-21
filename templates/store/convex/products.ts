import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./authz";
import { SEED_PRODUCTS } from "./seedData";
import { productAttributes } from "./schema";

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

const productFields = {
  name: v.string(),
  price: v.number(),
  stock: v.number(),
  description: v.string(),
  category: v.string(),
  imageUrl: v.string(),
  attributes: v.optional(productAttributes),
};

const validate = (p: { price?: number; stock?: number }) => {
  if (p.price !== undefined && (!Number.isFinite(p.price) || p.price <= 0)) throw new Error("Preço inválido.");
  if (p.stock !== undefined && (!Number.isInteger(p.stock) || p.stock < 0)) throw new Error("Estoque inválido.");
};

export const add = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    validate(args);
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    stock: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    attributes: v.optional(productAttributes),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireAdmin(ctx);
    validate(rest);
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/** Insere o catálogo inicial. Rode uma vez: npx convex run products:seed */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "Catálogo já possui produtos; nada foi inserido.";
    for (const product of SEED_PRODUCTS) {
      await ctx.db.insert("products", product);
    }
    return `${SEED_PRODUCTS.length} produtos inseridos.`;
  },
});
