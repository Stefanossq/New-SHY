
/**
 * @file Central registry for all project templates.
 * This file imports template content from modular files and assembles
 * the final `PROJECT_TEMPLATES` object for the application.
 */

import { commonFiles } from './templates-common';
import { blogFiles } from './templates-blog';
import { storeFiles } from './templates-store';
import { travelFiles } from './templates-travel';

// --- SHARED UTILITIES AND TYPES ---

export interface AIProduct {
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
}

/**
 * Dynamically creates the content for the `convex/products.ts` file
 * by injecting AI-generated product data into a template string.
 * @param products - An array of AI-generated products.
 * @param imagePaths - An array of corresponding image URLs for the products.
 * @returns The complete string content for the products file.
 */
export const createConvexProductsContent = (products: AIProduct[], imagePaths: string[]): string => {
    const initialProductsString = products.map((p, index) => {
        // Escape backslashes FIRST — otherwise a "\" in AI output breaks the generated module.
        const escapeJS = (str: unknown) =>
            String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        const imageUrl = escapeJS(imagePaths[index] || 'https://placehold.co/300x300/1f2937/d1d5db?text=Imagem+Indisponivel');
        const price = (Number(p.price) || 0).toFixed(2);
        const stock = Math.max(0, Math.trunc(Number(p.stock) || 0));
        return `            { name: '${escapeJS(p.name)}', price: ${price}, description: '${escapeJS(p.description)}', category: '${escapeJS(p.category)}', stock: ${stock}, imageUrl: '${imageUrl}' }`;
    }).join(',\n');

    return `import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const requireAuth = async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Autenticação necessária para realizar esta ação.");
    }
    return identity;
};

// Busca todos os produtos (público)
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").order("desc").collect();
  },
});

// Busca um produto por ID (público) - ESSENCIAL PARA A PÁGINA DE DETALHES
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Adiciona um novo produto (protegido)
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
        const productId = await ctx.db.insert("products", args);
        return productId;
    }
});

// Atualiza um produto (protegido)
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

// Deleta um produto (protegido)
export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await requireAuth(ctx);
        await ctx.db.delete(args.id);
    }
});

// Popula o banco com dados iniciais se estiver vazio (público)
export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const existingProducts = await ctx.db.query("products").collect();
        if (existingProducts.length > 0) {
            console.log("Banco de dados já populado. Semeamento ignorado.");
            return;
        }
        console.log("Banco de dados vazio. Semeando dados iniciais...");
        const initialProducts = [
${initialProductsString}
        ];
        for (const product of initialProducts) {
            await ctx.db.insert("products", product);
        }
        console.log("Semeamento concluído.");
    }
});
`;
};


// --- PROJECT TEMPLATES REGISTRY ---
import { TEMPLATE_REGISTRY, TemplateMetadata } from './templateLoader';

export type ProjectFile = string | { base64: string };
export type ProjectTemplate = TemplateMetadata;

export const PROJECT_TEMPLATES = TEMPLATE_REGISTRY;

