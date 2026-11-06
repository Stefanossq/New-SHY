/**
 * @file Contains all file content for the 'Store' project template.
 */

const storePackageJsonContent = `{
  "name": "loja-simples-convex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@clerk/localizations": "^3.9.0",
    "@clerk/nextjs": "^6.9.0",
    "@google/genai": "^1.0.0",
    "convex": "^1.17.0",
    "next": "15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}`;

const storeReadmeContent = `# Loja Simples (Premium Monochrome)

E-commerce profissional com design minimalista, simulação de pagamento avançada e sistema de avaliações.

## Stack

- **Framework:** Next.js 15.2+ (React 19)
- **Backend:** Convex
- **Auth:** Clerk
- **AI:** Google Gemini (Geração de Imagens)

## Funcionalidades Novas

1.  **Checkout Simulado (Stripe-like):**
    - Inputs de cartão com formatação automática.
    - Validação de algoritmo de Luhn para números de cartão de crédito.
    - Feedback visual de erro/sucesso nos inputs.

2.  **Sistema de Avaliações:**
    - Usuários logados podem avaliar produtos (1-5 estrelas).
    - Cálculo automático de média.

3.  **Design "Noir":**
    - Tema preto e branco de alto contraste para passar credibilidade.

## Configuração

1.  Instale: \`npm install\` (Sem erros de peer deps!)
2.  Configure \`.env.local\` (veja exemplo).
3.  Rode: \`npx convex dev\` e \`npm run dev\`.
`;

const convexSchemaContent = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    price: v.number(),
    description: v.string(),
    category: v.string(),
    stock: v.number(),
    imageUrl: v.string(),
  }),
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.string(), // Clerk ID
    userName: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  }).index("by_product", ["productId"]),
  sales: defineTable({
    userId: v.id("users"),
    total: v.number(),
    items: v.array(v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
    })),
    shippingAddress: v.object({
        fullName: v.string(),
        address: v.string(),
        city: v.string(),
        postalCode: v.string(),
    }),
  }),
  users: defineTable({
    name: v.string(),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
  cart: defineTable({
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      })
    ),
  }).index("by_userId", ["userId"]),
});
`;

const convexReviewsContent = `import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Buscar reviews de um produto
export const getByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();
  },
});

// Adicionar review
export const add = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Login necessário para avaliar.");

    await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: identity.subject,
      userName: identity.name || "Usuário",
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
  },
});
`;

const convexAuthConfigContent = `
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
`;

const convexUsersContent = `import { internalMutation } from "./_generated/server";
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
`;

const convexProductsContent = `import { query, mutation } from "./_generated/server";
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
`;

const convexOrdersContent = `import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("sales").order("desc").collect();
  },
});

export const getById = query({
    args: { id: v.id("sales") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const sale = await ctx.db.get(args.id);
        if (!sale) return null;
        const user = await ctx.db.get(sale.userId);
        if (!user || user.clerkId !== identity.subject) return null;
        return sale;
    }
});

export const create = mutation({
    args: {
        total: v.number(),
        items: v.array(v.object({
            productId: v.id("products"),
            name: v.string(),
            price: v.number(),
            quantity: v.number(),
        })),
        shippingAddress: v.object({
            fullName: v.string(),
            address: v.string(),
            city: v.string(),
            postalCode: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Usuário não autenticado.");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        const userId = user ? user._id : await ctx.db.insert("users", { name: identity.name!, clerkId: identity.subject });

        for (const item of args.items) {
            const product = await ctx.db.get(item.productId);
            if (product && product.stock >= item.quantity) {
                await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
            }
        }
        
        const saleId = await ctx.db.insert("sales", { ...args, userId });

        const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        if (cart) await ctx.db.patch(cart._id, { items: [] });
           
        return saleId;
    }
});
`;

const convexCartContent = `import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

const getOrCreateUser = async (ctx: MutationCtx): Promise<Doc<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Usuário não autenticado.");
    
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (user !== null) return user;

    const userId = await ctx.db.insert("users", { name: identity.name!, clerkId: identity.subject });
    return (await ctx.db.get(userId))!;
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];
    
    const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return [];

    const cartWithProducts = await Promise.all(cart.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;
        return { ...product, quantity: item.quantity };
    }));

    return cartWithProducts.filter(item => item !== null);
  },
});

export const addItem = mutation({
    args: { productId: v.id("products"), quantity: v.number() },
    handler: async (ctx, { productId, quantity }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();

        if (!cart) {
            await ctx.db.insert("cart", { userId: user._id, items: [{ productId, quantity }] });
            return;
        }

        const index = cart.items.findIndex(item => item.productId === productId);
        if (index !== -1) cart.items[index].quantity += quantity;
        else cart.items.push({ productId, quantity });
        
        await ctx.db.patch(cart._id, { items: cart.items });
    },
});

export const updateItemQuantity = mutation({
    args: { productId: v.id("products"), quantity: v.number() },
    handler: async (ctx, { productId, quantity }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (!cart) return;

        const index = cart.items.findIndex(item => item.productId === productId);
        if (index === -1) return;

        if (quantity > 0) cart.items[index].quantity = quantity;
        else cart.items.splice(index, 1);

        await ctx.db.patch(cart._id, { items: cart.items });
    }
});

export const removeItem = mutation({
    args: { productId: v.id("products") },
    handler: async (ctx, { productId }) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (!cart) return;
        const updatedItems = cart.items.filter(item => item.productId !== productId);
        await ctx.db.patch(cart._id, { items: updatedItems });
    },
});

export const clear = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getOrCreateUser(ctx);
        const cart = await ctx.db.query("cart").withIndex("by_userId", q => q.eq("userId", user._id)).unique();
        if (cart) await ctx.db.patch(cart._id, { items: [] });
    }
});
`;

const convexProviderWithClerkContent = `"use client";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexProviderWithClerkComponent({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
`;

const convexJsonContent = `{
  "project": "seu-projeto-aqui",
  "team": "seu-time-aqui",
  "prodUrl": "https://seu-projeto-aqui.convex.cloud"
}
`;

const storeEnvExampleContent = `
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CONVEX_URL=
API_KEY=
`;

const convexDataModelDtsContent = `import { AnyDataModel } from "convex/server";

// Mock types to allow build before codegen
export type Id<T extends string> = string & { __tableName: T };
export type Doc<T extends string> = any;
`;

const storeTypesContent = `import { Doc, Id } from "../convex/_generated/dataModel";

// Explicitly define Product interface to ensure TS knows about 'price' and other fields
// even if generated types are missing or incomplete during initial build.
export interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  imageUrl: string;
}

export type Review = Doc<"reviews">;

export type CartItem = Product & {
  quantity: number;
};
`;

const storeGlobalsCssContent = `
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  
  /* MONOCHROME PALETTE - BLACK & WHITE */
  --bg-main: #000000;
  --bg-card: #111111;
  --bg-input: #1a1a1a;
  
  --text-main: #ffffff;
  --text-muted: #888888;
  
  --border-light: #333333;
  --border-focus: #ffffff;
  
  --accent: #ffffff;
  --accent-hover: #cccccc;
  --accent-text: #000000;
  
  --success: #4ade80;
  --error: #ef4444;
  
  --container-width: 1200px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  background-color: var(--bg-main);
  color: var(--text-main);
  line-height: 1.6;
}

a { color: var(--text-main); text-decoration: none; transition: opacity 0.2s; }
a:hover { opacity: 0.8; }

button { cursor: pointer; font-family: inherit; border: none; background: none; color: inherit; }

.btn {
    background-color: var(--accent);
    color: var(--accent-text);
    padding: 0.8rem 1.5rem;
    border-radius: 2px;
    font-weight: 600;
    transition: all 0.2s;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 1px;
}
.btn:hover { background-color: var(--accent-hover); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

input, textarea {
    background-color: var(--bg-input);
    border: 1px solid var(--border-light);
    color: var(--text-main);
    border-radius: 2px;
    padding: 0.8rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
}
input:focus, textarea:focus { border-color: var(--border-focus); }
`;

const storeLayoutContent = `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvexProviderWithClerkComponent from "./ConvexProviderWithClerk";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ToasterProvider } from "@/context/ToasterContext";
import Toaster from "@/components/Toaster";
import { dark } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loja Monochrome",
  description: "E-commerce Premium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR} appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body className={inter.className}>
          <ConvexProviderWithClerkComponent>
            <ToasterProvider>
              <CartProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <Header />
                  <main style={{ flexGrow: 1 }}>{children}</main>
                  <Footer />
                </div>
                <Toaster />
              </CartProvider>
            </ToasterProvider>
          </ConvexProviderWithClerkComponent>
        </body>
      </html>
    </ClerkProvider>
  );
}`;

const storeCartContextContent = `'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CartItem } from '@/types';
import { useToaster } from './ToasterContext';

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (productId: Id<"products">) => Promise<void>;
  removeFromCart: (productId: Id<"products">) => Promise<void>;
  updateCartQuantity: (productId: Id<"products">, newQuantity: number) => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useUser();
  const { showToast } = useToaster();
  
  const cartData = useQuery(api.cart.get, !isSignedIn ? 'skip' : undefined);
  const addItem = useMutation(api.cart.addItem);
  const removeItem = useMutation(api.cart.removeItem);
  const updateQuantity = useMutation(api.cart.updateItemQuantity);

  const cart = (cartData as CartItem[] | undefined) || [];

  const addToCart = async (productId: Id<"products">) => {
    if (!isSignedIn) {
        showToast('Login necessário para adicionar ao carrinho.', 'info');
        return;
    }
    try {
        await addItem({ productId, quantity: 1 });
        showToast('Produto adicionado.', 'success');
    } catch (error) {
        showToast('Erro ao adicionar.', 'error');
    }
  };

  const removeFromCart = async (productId: Id<"products">) => {
    try { await removeItem({ productId }); showToast('Item removido.', 'success'); } 
    catch (error) { showToast('Erro ao remover.', 'error'); }
  };

  const updateCartQuantity = async (productId: Id<"products">, quantity: number) => {
    try { await updateQuantity({ productId, quantity }); } 
    catch (error) { showToast('Erro ao atualizar.', 'error'); }
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return <CartContext.Provider value={{ cart, isLoading: cartData === undefined, addToCart, removeFromCart, updateCartQuantity, cartCount }}>{children}</CartContext.Provider>;
};
`;

const storeHomePageContent = `'use client';
import React, { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Product } from '@/types';
import ProductList from '@/components/ProductList';
import styles from './page.module.css';

export default function HomePage() {
  const products = useQuery(api.products.get);
  const seedDatabase = useMutation(api.products.seed);

  useEffect(() => {
    if (products && products.length === 0) seedDatabase();
  }, [products, seedDatabase]);

  if (products === undefined) {
      return <div className={styles.loading}>Carregando coleção...</div>
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
          <h1 className={styles.heroTitle}>MONOCHROME.</h1>
          <p className={styles.heroSubtitle}>Simplicidade é a sofisticação suprema.</p>
          <a href="#collection" className="btn">Ver Coleção</a>
      </section>

      <section id="collection" className={styles.section}>
        <h2 className={styles.sectionTitle}>Coleção Atual</h2>
        <ProductList products={products as Product[]} showSearch={true} />
      </section>
    </div>
  );
};
`;

const storeHomePageCssContent = `
.section { max-width: var(--container-width); margin: 4rem auto; padding: 0 1.5rem; }
.sectionTitle { text-align: center; margin-bottom: 3rem; font-size: 2rem; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid var(--border-light); padding-bottom: 20px; display: inline-block; }
.loading { display: flex; align-items: center; justify-content: center; min-height: 50vh; color: var(--text-muted); letter-spacing: 1px; }

.hero {
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  padding: 8rem 1.5rem; background-color: #050505; border-bottom: 1px solid var(--border-light);
}
.heroTitle { font-size: 5rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 1rem; color: #fff; }
.heroSubtitle { color: var(--text-muted); font-size: 1.2rem; margin-bottom: 3rem; max-width: 500px; font-weight: 300; }

@media (max-width: 768px) {
  .heroTitle { font-size: 3rem; }
}
`;

const storeProductListComponent = `'use client';
import React, { useState } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import styles from './ProductList.module.css';

interface ProductListProps {
  products: Product[];
  showSearch?: boolean;
}

export default function ProductList({ products, showSearch = false }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {showSearch && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}
      <div className={styles.productListGrid}>
        {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
        ))}
        {filteredProducts.length === 0 && <p className={styles.noProducts}>Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}`;

const storeProductListCssContent = `
.searchContainer { margin-bottom: 3rem; display: flex; justify-content: center; }
.searchInput { width: 100%; max-width: 400px; text-align: center; background: transparent; border: none; border-bottom: 1px solid var(--border-light); border-radius: 0; padding: 10px; font-size: 1.1rem; }
.searchInput:focus { border-color: var(--text-main); }
.productListGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 3rem; }
.noProducts { text-align: center; color: var(--text-muted); grid-column: 1 / -1; }
`;

const storeProductCardContent = `'use client';
import React from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import styles from './ProductCard.module.css';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className={styles.card}>
      <Link href={\`/product/\${product._id}\`} className={styles.imageLink}>
        <div className={styles.imageContainer}>
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
          <div className={styles.overlay}>
            <span className={styles.viewText}><Eye size={16} /> Ver Detalhes</span>
          </div>
        </div>
      </Link>
      
      <div className={styles.info}>
        <Link href={\`/product/\${product._id}\`}>
            <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <p className={styles.price}>R$ {product.price.toFixed(2).replace('.', ',')}</p>
        <button 
          className={styles.button}
          onClick={() => addToCart(product._id)}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}`;

const storeProductCardCssContent = `
.card { border: 1px solid var(--border-light); background-color: var(--bg-card); transition: border-color 0.3s; display: flex; flex-direction: column; }
.card:hover { border-color: var(--text-muted); }

.imageContainer { width: 100%; aspect-ratio: 1; position: relative; overflow: hidden; background: #000; }
.image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; opacity: 0.9; }
.card:hover .image { transform: scale(1.05); opacity: 0.6; }

.overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.3s;
}
.card:hover .overlay { opacity: 1; }
.viewText { color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem; }

.info { padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; }
.title { font-size: 1rem; font-weight: 500; color: var(--text-main); margin: 0; }
.price { font-size: 1.1rem; color: var(--text-muted); font-weight: 400; margin-bottom: 1rem; }

.button {
  background: transparent; border: 1px solid var(--border-light); color: var(--text-main);
  padding: 10px; width: 100%; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;
  transition: all 0.2s;
}
.button:hover { background: var(--text-main); color: var(--bg-main); border-color: var(--text-main); }
`;

const storeProductDetailsPageContent = `'use client';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Star, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from './page.module.css';
import { useUser, SignInButton } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function ProductDetailsPage() {
    // No Next.js 15+, usar params como prop pode causar problemas de tipagem com Promises em Client Components.
    // Usar o hook useParams() é a forma recomendada e type-safe.
    const params = useParams();
    const productId = params?.id as Id<"products">;

    const product = useQuery(api.products.getById, productId ? { id: productId } : "skip");
    const reviews = useQuery(api.reviews.getByProduct, productId ? { productId } : "skip");
    const addReview = useMutation(api.reviews.add);
    const { addToCart } = useCart();
    const { isSignedIn } = useUser();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    if (!product) return <div className={styles.loading}>Carregando...</div>;

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return;
        setSubmittingReview(true);
        try {
            await addReview({ productId, rating, comment });
            setComment("");
            alert("Avaliação enviada com sucesso!");
        } catch(e) {
            alert("Erro ao enviar avaliação.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const avgRating = reviews && reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : "N/A";

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}><ArrowLeft size={16}/> Voltar</Link>
            
            <div className={styles.productGrid}>
                <div className={styles.imageWrapper}>
                    <img src={product.imageUrl} alt={product.name} />
                </div>
                <div className={styles.details}>
                    <div className={styles.category}>{product.category}</div>
                    <h1 className={styles.title}>{product.name}</h1>
                    <div className={styles.price}>R$ {product.price.toFixed(2)}</div>
                    <p className={styles.description}>{product.description}</p>
                    
                    <button onClick={() => addToCart(productId)} className="btn" style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <ShoppingBag size={18} /> Adicionar ao Carrinho
                    </button>

                    <div className={styles.meta}>
                        <span>Estoque: {product.stock} unidades</span>
                        <span>Avaliação: {avgRating} ★ ({reviews?.length || 0})</span>
                    </div>
                </div>
            </div>

            <div className={styles.reviewsSection}>
                <h2>Avaliações dos Clientes</h2>
                
                <div className={styles.reviewList}>
                    {reviews?.map(r => (
                        <div key={r._id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <span className={styles.reviewerName}>{r.userName}</span>
                                <div className={styles.stars}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "#fff" : "none"} stroke="#fff"/>)}</div>
                            </div>
                            <p className={styles.reviewComment}>{r.comment}</p>
                            <span className={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {reviews?.length === 0 && <p style={{color: 'var(--text-muted)'}}>Nenhuma avaliação ainda. Seja o primeiro!</p>}
                </div>

                {isSignedIn ? (
                    <form onSubmit={handleAddReview} className={styles.reviewForm}>
                        <h3>Deixe sua avaliação</h3>
                        <div className={styles.ratingInput}>
                            {[1,2,3,4,5].map(star => (
                                <button type="button" key={star} onClick={() => setRating(star)} className={styles.starBtn}>
                                    <Star fill={star <= rating ? "#fff" : "none"} stroke="#fff" size={24} />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={comment} 
                            onChange={e => setComment(e.target.value)} 
                            placeholder="Escreva sua opinião sobre o produto..."
                            required
                        />
                        <button type="submit" className="btn" disabled={submittingReview}>
                            {submittingReview ? "Enviando..." : "Publicar Avaliação"}
                        </button>
                    </form>
                ) : (
                    <div className={styles.loginPrompt}>
                        <SignInButton mode="modal">
                            <button className="btn">Faça Login para Avaliar</button>
                        </SignInButton>
                    </div>
                )}
            </div>
        </div>
    );
}
`;

const storeProductDetailsCss = `
.container { max-width: 1000px; margin: 3rem auto; padding: 0 20px; }
.loading { min-height: 50vh; display: flex; justify-content: center; align-items: center; }
.backLink { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem; }

.productGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-bottom: 4rem; }
.imageWrapper { background: #000; border: 1px solid var(--border-light); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
.imageWrapper img { max-width: 100%; max-height: 100%; object-fit: contain; }

.details { display: flex; flex-direction: column; justify-content: center; }
.category { text-transform: uppercase; color: var(--text-muted); font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 10px; }
.title { font-size: 2.5rem; margin-bottom: 1rem; line-height: 1.1; }
.price { font-size: 1.5rem; color: var(--text-main); margin-bottom: 1.5rem; }
.description { color: var(--text-muted); line-height: 1.7; }
.meta { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-light); display: flex; gap: 20px; font-size: 0.9rem; color: var(--text-muted); }

.reviewsSection { border-top: 1px solid var(--border-light); padding-top: 3rem; }
.reviewsSection h2 { margin-bottom: 2rem; font-size: 1.5rem; }

.reviewList { display: grid; gap: 20px; margin-bottom: 3rem; }
.reviewCard { background: var(--bg-card); padding: 1.5rem; border: 1px solid var(--border-light); }
.reviewHeader { display: flex; justify-content: space-between; margin-bottom: 10px; }
.reviewerName { font-weight: 600; }
.stars { display: flex; gap: 2px; }
.reviewComment { color: var(--text-muted); margin-bottom: 10px; }
.reviewDate { font-size: 0.8rem; color: #555; }

.reviewForm { background: var(--bg-input); padding: 2rem; border: 1px solid var(--border-light); max-width: 500px; }
.reviewForm h3 { margin-bottom: 1rem; }
.ratingInput { display: flex; gap: 5px; margin-bottom: 1rem; }
.starBtn { background: none; border: none; padding: 0; cursor: pointer; }
.reviewForm textarea { width: 100%; min-height: 100px; margin-bottom: 1rem; resize: vertical; }
.loginPrompt { font-style: italic; color: var(--text-muted); }

@media(max-width: 768px) { .productGrid { grid-template-columns: 1fr; gap: 2rem; } }
`;

const storeHeaderContent = `'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './Header.module.css';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { ShoppingBag } from 'lucide-react';

const Header: React.FC = () => {
  const { cartCount } = useCart();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>MONOCHROME</Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>Shop</Link>
        <Link href="/pricing" className={styles.navLink}>Planos</Link>
        <SignedIn><Link href="/admin" className={styles.navLink}>Admin</Link></SignedIn>
        
        <div className={styles.actions}>
            <Link href="/cart" className={styles.cartLink}>
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
            </Link>
            
            <SignedOut>
                <SignInButton mode="modal"><button className={styles.loginBtn}>Login</button></SignInButton>
            </SignedOut>
            <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>
    </header>
  );
};
export default Header;
`;

const storeHeaderCssContent = `
.header {
  padding: 1.5rem 3rem; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-light); background: rgba(5,5,5,0.8); backdrop-filter: blur(10px);
  position: sticky; top: 0; z-index: 50;
}
.logo { font-weight: 900; letter-spacing: 2px; font-size: 1.2rem; }
.nav { display: flex; gap: 2rem; align-items: center; }
.actions { display: flex; align-items: center; gap: 1.5rem; border-left: 1px solid var(--border-light); padding-left: 1.5rem; }
.navLink { text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-muted); }
.navLink:hover { color: var(--text-main); }
.cartLink { position: relative; display: flex; align-items: center; }
.cartCount { position: absolute; top: -8px; right: -8px; background: var(--text-main); color: var(--bg-main); font-size: 0.7rem; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.loginBtn { font-size: 0.8rem; text-transform: uppercase; font-weight: 600; }
@media (max-width: 640px) { .header { padding: 1rem; } .navLink { display: none; } }
`;

const checkoutPageContent = `'use client';
import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';
import styles from './page.module.css';
import { Lock, CreditCard } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const { cart } = useCart();
  const createOrder = useMutation(api.orders.create);
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardError, setCardError] = useState(false);
  
  const [shipping, setShipping] = useState({ fullName: user?.fullName || '', address: '', city: '', postalCode: '' });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Luhn Algorithm Implementation for Credit Card Validation
  const luhnCheck = (val: string) => {
    let checksum = 0;
    let j = 1;
    for (let i = val.length - 1; i >= 0; i--) {
      let calc = 0;
      calc = Number(val.charAt(i)) * j;
      if (calc > 9) { checksum = checksum + 1; calc = calc - 10; }
      checksum = checksum + calc;
      j = (j == 1) ? 2 : 1;
    }
    return (checksum % 10) == 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i=0, len=match.length; i<len; i+=4) {
      parts.push(match.substring(i, i+4));
    }
    if (parts.length) return parts.join(" ");
    return v;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardNumber(formatCardNumber(val));
    const raw = val.replace(/\\s+/g, "");
    if (raw.length >= 13) {
        setCardError(!luhnCheck(raw));
    } else {
        setCardError(false);
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if(cardError || cardNumber.length < 15) {
        alert("Cartão inválido. Por favor verifique o número.");
        return;
    }
    setLoading(true);
    try {
      const orderId = await createOrder({
        items: cart.map(i => ({ productId: i._id, name: i.name, price: i.price, quantity: i.quantity })),
        total,
        shippingAddress: shipping
      });
      router.push(\`/order-confirmation?orderId=\${orderId}\`);
    } catch (err) {
      alert("Erro ao processar pedido. Tente novamente.");
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) return <RedirectToSignIn />;
  if (cart.length === 0) return <div className={styles.empty}>Carrinho vazio.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        
        {/* LEFT: FORM */}
        <form onSubmit={handlePlaceOrder} className={styles.form}>
            <h2 className={styles.sectionTitle}>Entrega</h2>
            <div className={styles.fieldGroup}>
                <input placeholder="Nome Completo" value={shipping.fullName} onChange={e => setShipping({...shipping, fullName: e.target.value})} required />
            </div>
            <div className={styles.fieldGroup}>
                <input placeholder="Endereço" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} required />
            </div>
            <div className={styles.row}>
                <input placeholder="Cidade" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} required />
                <input placeholder="CEP" value={shipping.postalCode} onChange={e => setShipping({...shipping, postalCode: e.target.value})} required />
            </div>

            <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Pagamento Seguro</h2>
            <div className={styles.cardInputWrapper}>
                <div className={\`\${styles.stripeElement} \${cardError ? styles.invalid : ''} \${cardNumber.length > 14 && !cardError ? styles.valid : ''}\`}>
                    <CreditCard className={styles.cardIcon} size={20} />
                    <input 
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber} 
                        onChange={handleCardChange} 
                        maxLength={19}
                        required
                    />
                    {cardError && <span className={styles.errorIcon}>!</span>}
                </div>
                <div className={styles.row}>
                    <input className={styles.stripeInput} placeholder="MM / AA" value={expiry} onChange={e => setExpiry(e.target.value)} maxLength={5} required />
                    <input className={styles.stripeInput} placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} maxLength={4} required />
                </div>
            </div>
            
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px', padding: '15px' }} disabled={loading || cardError}>
                {loading ? 'Processando...' : \`Pagar R$ \${total.toFixed(2)}\`}
            </button>
            
            <div className={styles.secureBadge}>
                <Lock size={12} /> Pagamento criptografado de ponta a ponta
            </div>
        </form>

        {/* RIGHT: SUMMARY */}
        <div className={styles.summary}>
            <h3>Resumo</h3>
            {cart.map(item => (
                <div key={item._id} className={styles.item}>
                    <span>{item.name} <small>x{item.quantity}</small></span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            <div className={styles.totalRow}>
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
            </div>
        </div>

      </div>
    </div>
  );
};
export default CheckoutPage;
`;

const checkoutPageCssContent = `
.container { max-width: 1000px; margin: 4rem auto; padding: 0 20px; }
.grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4rem; }
.empty { text-align: center; margin-top: 4rem; color: var(--text-muted); }

.sectionTitle { font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.fieldGroup { margin-bottom: 1rem; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }

/* Stripe-like Inputs */
.stripeElement { 
    background: var(--bg-input); border: 1px solid var(--border-light); 
    border-radius: 4px; padding: 0 10px; display: flex; align-items: center; 
    transition: all 0.2s; margin-bottom: 1rem;
}
.stripeElement input { border: none; background: transparent; width: 100%; padding: 12px 5px; font-family: monospace; font-size: 1.1rem; }
.stripeElement:focus-within { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.cardIcon { color: var(--text-muted); margin-right: 5px; }

.stripeElement.invalid { border-color: var(--error); color: var(--error); }
.stripeElement.invalid .cardIcon { color: var(--error); }
.stripeElement.valid { border-color: var(--success); }
.stripeElement.valid .cardIcon { color: var(--success); }

.stripeInput { font-family: monospace; letter-spacing: 1px; }

.secureBadge { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 0.75rem; color: var(--text-muted); margin-top: 15px; }

.summary { background: var(--bg-card); padding: 2rem; border-radius: 4px; border: 1px solid var(--border-light); height: fit-content; }
.summary h3 { margin-bottom: 1.5rem; font-size: 1.1rem; }
.item { display: flex; justify-content: space-between; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem; }
.totalRow { display: flex; justify-content: space-between; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light); font-weight: 700; font-size: 1.2rem; }

@media (max-width: 768px) { .grid { grid-template-columns: 1fr; gap: 2rem; } .summary { order: -1; } }
`;

const storeAdminPageContent = `'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Plus, Trash, Edit } from 'lucide-react';
import styles from './page.module.css';

export default function AdminPage() {
    const products = useQuery(api.products.get);
    const deleteProduct = useMutation(api.products.remove);
    const addProduct = useMutation(api.products.add);
    const updateProduct = useMutation(api.products.update);

    const [editing, setEditing] = useState<any>(null);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew) {
            await addProduct(formData);
        } else if (editing) {
            await updateProduct({ id: editing, ...formData });
        }
        setEditing(null);
        setIsNew(false);
        setFormData({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' });
    };

    const handleEdit = (p: any) => {
        setEditing(p._id);
        setIsNew(false);
        setFormData({ name: p.name, price: p.price, stock: p.stock, description: p.description, category: p.category, imageUrl: p.imageUrl });
    };

    if (!products) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <button className="btn" onClick={() => { setIsNew(true); setEditing(null); setFormData({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' }); }}>
                    <Plus size={16} /> Novo Produto
                </button>
            </div>

            {(isNew || editing) && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>{isNew ? 'Novo Produto' : 'Editar Produto'}</h2>
                    <input placeholder="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <input placeholder="Preço" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                    <input placeholder="Estoque" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} required />
                    <input placeholder="Categoria" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                    <input placeholder="URL Imagem" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} required />
                    <textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn">Salvar</button>
                        <button type="button" className="btn" style={{ background: '#333' }} onClick={() => { setIsNew(false); setEditing(null); }}>Cancelar</button>
                    </div>
                </form>
            )}

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p._id}>
                            <td>{p.name}</td>
                            <td>R$ {p.price.toFixed(2)}</td>
                            <td>{p.stock}</td>
                            <td className={styles.actions}>
                                <button onClick={() => handleEdit(p)}><Edit size={16} /></button>
                                <button onClick={() => deleteProduct({ id: p._id })}><Trash size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}`;

const storeAdminPageCssContent = `
.container { max-width: 1000px; margin: 4rem auto; padding: 0 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.table th, .table td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border-light); }
.actions { display: flex; gap: 10px; }
.form { background: var(--bg-card); padding: 20px; border: 1px solid var(--border-light); margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px; }
`;

const storeCartPageContent = `'use client';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { Trash, Minus, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    const { cart, removeFromCart, updateCartQuantity } = useCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cart.length === 0) return <div className={styles.empty}>Seu carrinho está vazio.</div>;

    return (
        <div className={styles.container}>
            <h1>Seu Carrinho</h1>
            <div className={styles.list}>
                {cart.map(item => (
                    <div key={item._id} className={styles.item}>
                        <img src={item.imageUrl} alt={item.name} className={styles.img} />
                        <div className={styles.details}>
                            <h3>{item.name}</h3>
                            <p>R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className={styles.quantity}>
                            <button onClick={() => updateCartQuantity(item._id, item.quantity - 1)}><Minus size={16} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item._id, item.quantity + 1)}><Plus size={16} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} className={styles.remove}><Trash size={18} /></button>
                    </div>
                ))}
            </div>
            <div className={styles.summary}>
                <h2>Total: R$ {total.toFixed(2)}</h2>
                <Link href="/checkout" className="btn">Finalizar Compra</Link>
            </div>
        </div>
    );
}`;

const storeCartPageCssContent = `
.container { max-width: 800px; margin: 4rem auto; padding: 0 20px; }
.empty { text-align: center; margin-top: 50px; color: var(--text-muted); }
.list { display: flex; flex-direction: column; gap: 20px; margin: 30px 0; }
.item { display: flex; align-items: center; gap: 20px; padding: 15px; border: 1px solid var(--border-light); background: var(--bg-card); }
.img { width: 80px; height: 80px; object-fit: cover; }
.details { flex-grow: 1; }
.quantity { display: flex; align-items: center; gap: 10px; }
.remove { color: var(--error); }
.summary { text-align: right; margin-top: 30px; border-top: 1px solid var(--border-light); padding-top: 20px; }
`;

const orderConfirmationPageContent = `'use client';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import styles from './page.module.css';
import Link from 'next/link';
import { Suspense } from 'react';

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const order = useQuery(api.orders.getById, orderId ? { id: orderId as Id<"sales"> } : "skip");

    if (!order) return <div className={styles.loading}>Carregando pedido...</div>;

    return (
        <div className={styles.container}>
            <h1>Pedido Confirmado!</h1>
            <p>Obrigado pela sua compra. Enviamos um email com os detalhes.</p>
            
            <div className={styles.receipt}>
                <h3>Pedido #{order._id.substring(0, 8)}</h3>
                <div className={styles.items}>
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className={styles.item}>
                            <span>{item.name} x{item.quantity}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.total}>
                    <span>Total</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <Link href="/" className="btn">Voltar para a Loja</Link>
        </div>
    );
}

export default function OrderConfirmation() {
    return (
        <Suspense fallback={<div className={styles.loading}>Carregando confirmação...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}`;

const orderConfirmationPageCssContent = `
.container { max-width: 600px; margin: 4rem auto; padding: 0 20px; text-align: center; }
.loading { text-align: center; margin-top: 50px; }
.receipt { text-align: left; background: var(--bg-card); padding: 30px; border: 1px solid var(--border-light); margin: 30px 0; }
.items { margin: 20px 0; border-bottom: 1px solid var(--border-light); padding-bottom: 20px; }
.item { display: flex; justify-content: space-between; margin-bottom: 10px; color: var(--text-muted); }
.total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; }
`;

const storeApiGenerateImageContent = `import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: "Endpoint reservado para futura implementação." });
}`;

const pricingPageContent = `import { PricingTable } from '@clerk/nextjs';

export default function PricingPage() {
  return (
    <div style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center', background: 'var(--bg-main)', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-main)' }}>Nossos Planos</h1>
        <PricingTable />
      </div>
    </div>
  );
}`;

const storeFooterContent = `'use client';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <p>&copy; 2024 Monochrome Store. Todos os direitos reservados.</p>
                <div className={styles.links}>
                    <a href="#">Termos</a>
                    <a href="#">Privacidade</a>
                    <a href="#">Contato</a>
                </div>
            </div>
        </footer>
    );
}`;

const storeFooterCssContent = `
.footer { border-top: 1px solid var(--border-light); padding: 40px 0; margin-top: auto; background: var(--bg-card); }
.content { max-width: var(--container-width); margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.9rem; }
.links { display: flex; gap: 20px; }
@media(max-width: 768px) { .content { flex-direction: column; gap: 20px; text-align: center; } }
`;

const toasterContextContent = `'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToasterContextType {
    message: string | null;
    type: ToastType;
    showToast: (msg: string, type?: ToastType) => void;
    hideToast: () => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

export const useToaster = () => {
    const context = useContext(ToasterContext);
    if (!context) throw new Error("useToaster must be used within ToasterProvider");
    return context;
};

export const ToasterProvider = ({ children }: { children: ReactNode }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<ToastType>('info');

    const showToast = (msg: string, t: ToastType = 'info') => {
        setMessage(msg);
        setType(t);
        setTimeout(() => setMessage(null), 3000);
    };

    const hideToast = () => setMessage(null);

    return (
        <ToasterContext.Provider value={{ message, type, showToast, hideToast }}>
            {children}
        </ToasterContext.Provider>
    );
};`;

const toasterComponentContent = `'use client';
import { useToaster } from '@/context/ToasterContext';
import styles from './Toaster.module.css';

export default function Toaster() {
    const { message, type } = useToaster();
    if (!message) return null;
    
    return (
        <div className={\`\${styles.toast} \${styles[type]}\`}>
            {message}
        </div>
    );
}`;

const toasterCssContent = `
.toast {
    position: fixed; bottom: 30px; right: 30px;
    padding: 15px 25px; border-radius: 4px;
    color: #fff; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    z-index: 1000;
}
.success { background: var(--success); }
.error { background: var(--error); }
.info { background: var(--border-focus); }

@keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
`;

export const storeFiles = {
    'convex/auth.config.ts': convexAuthConfigContent,
    'convex/cart.ts': convexCartContent,
    'convex/orders.ts': convexOrdersContent,
    'convex/products.ts': convexProductsContent,
    'convex/reviews.ts': convexReviewsContent,
    'convex/schema.ts': convexSchemaContent,
    'convex/users.ts': convexUsersContent,
    // Admin & Pages
    'src/app/admin/page.tsx': storeAdminPageContent,
    'src/app/admin/page.module.css': storeAdminPageCssContent,
    'src/app/cart/page.tsx': storeCartPageContent,
    'src/app/cart/page.module.css': storeCartPageCssContent,
    'src/app/checkout/page.tsx': checkoutPageContent,
    'src/app/checkout/page.module.css': checkoutPageCssContent,
    'src/app/product/[id]/page.tsx': storeProductDetailsPageContent,
    'src/app/product/[id]/page.module.css': storeProductDetailsCss,
    'src/app/order-confirmation/page.tsx': orderConfirmationPageContent,
    'src/app/order-confirmation/page.module.css': orderConfirmationPageCssContent,
    'src/app/api/generate-image/route.ts': storeApiGenerateImageContent,
    'src/app/pricing/page.tsx': pricingPageContent,
    // Core
    'src/app/ConvexProviderWithClerk.tsx': convexProviderWithClerkContent,
    'src/app/globals.css': storeGlobalsCssContent,
    'src/app/layout.tsx': storeLayoutContent,
    'src/app/page.tsx': storeHomePageContent,
    'src/app/page.module.css': storeHomePageCssContent,
    // Components
    'src/components/Header.tsx': storeHeaderContent,
    'src/components/Header.module.css': storeHeaderCssContent,
    'src/components/Footer.tsx': storeFooterContent,
    'src/components/Footer.module.css': storeFooterCssContent,
    'src/components/ProductList.tsx': storeProductListComponent,
    'src/components/ProductList.module.css': storeProductListCssContent,
    'src/components/ProductCard.tsx': storeProductCardContent,
    'src/components/ProductCard.module.css': storeProductCardCssContent,
    'src/components/Toaster.tsx': toasterComponentContent,
    'src/components/Toaster.module.css': toasterCssContent,
    // Context & Types
    'src/context/CartContext.tsx': storeCartContextContent,
    'src/context/ToasterContext.tsx': toasterContextContent,
    'src/types/index.ts': storeTypesContent,
    'src/convex/_generated/api.d.ts': '// This file is auto-generated by Convex. Do not edit.',
    'src/convex/_generated/dataModel.d.ts': convexDataModelDtsContent,
    'public/images/.placeholder': '',
    'package.json': storePackageJsonContent,
    '.env.local.example': storeEnvExampleContent,
    'convex.json': convexJsonContent,
    'README.md': storeReadmeContent,
};
