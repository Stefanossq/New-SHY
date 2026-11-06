
/**
 * @file Contains all file content for the 'Blog' project template (Terminal/Hacker Theme with Light Mode support).
 */

const blogPackageJsonContent = `{
  "name": "blog-pessoal-ai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@clerk/nextjs": "^5.0.0",
    "@clerk/themes": "^1.7.5",
    "@google/genai": "^1.28.0",
    "convex": "^1.12.0",
    "next": "14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.1",
    "lucide-react": "^0.378.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}`;

const blogReadmeContent = `# Blog Pessoal AI (Jikan + Gemini)

Este é um blog gerado automaticamente utilizando dados da **Jikan API** (Animes) e textos do **Google Gemini**.
Possui suporte a temas Dark (Terminal Refinado) e Light (Clean).

## Funcionalidades

- **Conteúdo:** Recomendações de animes geradas por IA (pt-BR) via endpoint Random.
- **Real-time Respect (Likes):** Sistema de likes em tempo real via WebSockets do Convex.
- **Busca:** Filtragem instantânea de posts por título.
- **Airing Now:** Widget lateral mostrando animes lançados no dia atual (Jikan Schedules) em PT-BR.
- **Comentários IA:** O Gemini gera comentários de personas (Hater, Fanboy, etc) para cada post.
- **CMS Admin:** Edite e exclua posts diretamente pelo dashboard.
- **Promo Widget:** Exibe trailers recentes de animes na Home via Jikan API (/watch/promos).
- **Vibe Matcher:** Encontre animes baseados no seu sentimento atual (IA).
- **Times:** Geração aleatória de times de personagens via Jikan API (Agora na Home).
- **Game da Semana:** Recomendação de game via FreeToGame API.
- **Chatbot TTS:** Assistente virtual com Text-to-Speech para acessibilidade.
- **Temas:** Alternância entre modo Terminal Soft e modo Clean.

## Configuração

1. Instale as dependências: \`npm install\` (Compatível com React 18).
2. Configure as variáveis em \`.env.local\`.
3. Rode o Convex: \`npx convex dev\`
4. Rode o Next.js: \`npm run dev\`
`;

const blogMiddlewareContent = `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
`;

const blogConvexSchemaContent = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    content_markdown: v.string(), // Conteúdo do post
    image_url: v.string(),        // URL original da Jikan API
    jikan_id: v.number(),         // ID de referência
    slug: v.string(),             // URL amigável
    authorId: v.string(),         // Clerk ID do autor
    published_date: v.string(),
    likes: v.optional(v.number()), // Contador de Respects
    comments: v.optional(v.array(v.object({ // Comentários gerados por IA
        user: v.string(),
        content: v.string(),
        type: v.string() // 'hater', 'fanboy', 'tech'
    })))
  }).index("by_slug", ["slug"]),

  teams: defineTable({
    ownerId: v.string(), // Clerk ID de quem gerou
    characters: v.array(
      v.object({
        jikanId: v.number(),
        name: v.string(),
        imageUrl: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  games: defineTable({
    title: v.string(),
    thumbnail: v.string(),
    platform: v.string(),
    short_description: v.string(),
    gemini_recommendation: v.string(),
    game_url: v.string(),
    generatedAt: v.number(),
  }).index("by_date", ["generatedAt"]),

  promos: defineTable({
    title: v.string(),
    embed_url: v.string(),
    image_url: v.string(),
    updatedAt: v.number(),
  }).index("by_date", ["updatedAt"]),

  audit_logs: defineTable({
    action: v.string(),           // Ex: "AI_GENERATION_RUN"
    model: v.string(),            // Ex: "gemini-2.5-flash"
    input_prompt: v.string(),     // O prompt enviado
    output_summary: v.string(),   // Resumo do resultado
    status: v.union(v.literal("SUCCESS"), v.literal("FAILURE")),
    timestamp: v.number(),
    executorId: v.optional(v.string()), // Quem disparou a ação
    error: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]),
});
`;

const blogConvexMutationsContent = `import { internalMutation, mutation } from "./_generated/server";
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
`;

const blogConvexJikanContent = `import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenAI, Type } from "@google/genai";

// --- Actions (Orquestração) ---

/**
 * Traduz um "Vibe" do usuário para parâmetros de busca da Jikan.
 */
export const matchVibe = action({
  args: { vibe: v.string() },
  handler: async (ctx, { vibe }) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Gemini traduz Vibe -> Keywords
    const prompt = \`
      Translate the user feeling/vibe "\${vibe}" into a search query for an Anime database.
      Return a JSON object with a single key "q" containing 1 or 2 English keywords max.
      Example: "Sad cyberpunk" -> { "q": "cyberpunk drama" }
    \`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const { q } = JSON.parse(response.text || '{"q": "adventure"}');
        
        // 2. Busca na Jikan API
        const jikanResponse = await fetch(\`https://api.jikan.moe/v4/anime?q=\${encodeURIComponent(q)}&limit=3&order_by=score&sort=desc\`);
        const jikanData = await jikanResponse.json();
        
        return {
            keyword: q,
            animes: jikanData.data || []
        };

    } catch (e) {
        console.error(e);
        return { keyword: "Error", animes: [] };
    }
  }
});

/**
 * FEATURE: AIRING NOW
 * Busca a programação do dia atual na Jikan API.
 */
export const getAiringSchedule = action({
  args: {},
  handler: async () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[new Date().getDay()];
    
    try {
        const response = await fetch(\`https://api.jikan.moe/v4/schedules?filter=\${currentDay}\`);
        if (!response.ok) return [];
        const data = await response.json();
        // Filtra e retorna apenas os 10 primeiros com Score mais alto
        const animes = data.data || [];
        return animes
            .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
            .slice(0, 10);
    } catch (e) {
        console.error("Schedule fetch failed", e);
        return [];
    }
  }
});


/**
 * Busca Promos Recentes na Jikan e Salva um Aleatório.
 */
export const generatePromoVideo = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Auth required");

        try {
            // Endpoint específico da Jikan v4 para Promos
            const response = await fetch("https://api.jikan.moe/v4/watch/promos");
            if (!response.ok) throw new Error("Falha ao buscar promos na Jikan");
            
            const data = await response.json();
            const promos = data.data;

            if (!promos || promos.length === 0) throw new Error("Nenhum promo encontrado");

            // Pega um promo aleatório da lista recente (limitado aos 10 primeiros para garantir relevância)
            const randomPromo = promos[Math.floor(Math.random() * Math.min(promos.length, 10))];
            
            const title = randomPromo.entry.title;
            const embedUrl = randomPromo.trailer.embed_url;
            const imageUrl = randomPromo.entry.images.jpg.large_image_url;

            if (!embedUrl) throw new Error("Promo escolhido não tem vídeo (embed_url missing)");

            await ctx.runMutation(internal.mutations.savePromo, {
                title,
                embed_url: embedUrl,
                image_url: imageUrl
            });

            await ctx.runMutation(internal.mutations.logAudit, {
                action: "JIKAN_PROMO_FETCH",
                model: "jikan-api-v4",
                input_prompt: "getWatchRecentPromos",
                output_summary: \`Promo defined: \${title}\`,
                status: "SUCCESS",
                executorId: identity.subject
            });

            return "Novo vídeo promo definido com sucesso!";

        } catch (e) {
            console.error(e);
             await ctx.runMutation(internal.mutations.logAudit, {
                action: "JIKAN_PROMO_FETCH",
                model: "jikan-api-v4",
                input_prompt: "getWatchRecentPromos",
                output_summary: "Falha ao buscar promo",
                status: "FAILURE",
                error: (e as Error).message,
                executorId: identity.subject
            });
            throw e;
        }
    }
});

/**
 * Gera posts de recomendação de animes usando Jikan Random + COMENTÁRIOS DE PERSONAS.
 */
export const generateContent = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("ACESSO NEGADO: Usuário não autenticado.");

    if (!process.env.GEMINI_API_KEY) throw new Error("FATAL: GEMINI_API_KEY missing.");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let successCount = 0;

    // Gera 3 recomendações
    for (let i = 0; i < 3; i++) {
        try {
            // Endpoint RANDOM da Jikan API v4
            const jikanResponse = await fetch("https://api.jikan.moe/v4/random/anime");
            
            if (!jikanResponse.ok) continue;
            
            const jikanData = await jikanResponse.json();
            const anime = jikanData.data;
            const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            
            const prompt = \`
                Atue como 'Kira', um autor fictício apaixonado por animes deste blog.
                Escreva um post de blog RECOMENDANDO o anime "\${anime.title}".
                
                Diretrizes do Post:
                - Idioma: Português do Brasil (PT-BR).
                - Tom: Casual, empolgado, jornalístico (estilo revista pop).
                - PROIBIDO: Usar termos técnicos de programação no corpo do texto.
                
                ALÉM DISSO, gere 3 comentários fictícios para este post com as seguintes personas:
                1. 'DarkSasuke00': Odeia tudo, acha superestimado (Hater).
                2. 'KawaiiChan': Ama tudo, usa muitos emojis (Fanboy/Fangirl).
                3. 'DevOps_San': Analisa a animação de forma técnica e fria (Tech).
                
                Saída estrita em JSON:
                {
                    "title": "Um título chamativo para o post",
                    "content_markdown": "O texto do post em Markdown (use h2, h3, listas)",
                    "slug": "slug-amigavel-do-post-\${anime.mal_id}",
                    "comments": [
                        { "user": "DarkSasuke00", "content": "Texto do hater...", "type": "hater" },
                        { "user": "KawaiiChan", "content": "Texto fofo...", "type": "fanboy" },
                        { "user": "DevOps_San", "content": "Texto técnico...", "type": "tech" }
                    ]
                }
            \`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content_markdown: { type: Type.STRING },
                            slug: { type: Type.STRING },
                            comments: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        user: { type: Type.STRING },
                                        content: { type: Type.STRING },
                                        type: { type: Type.STRING }
                                    },
                                    required: ["user", "content", "type"]
                                }
                            }
                        },
                        required: ["title", "content_markdown", "slug", "comments"]
                    }
                }
            });

            const data = JSON.parse(response.text!);

            await ctx.runMutation(internal.mutations.savePost, {
                title: data.title,
                content_markdown: data.content_markdown,
                image_url: imageUrl,
                jikan_id: anime.mal_id,
                slug: data.slug,
                authorId: identity.subject,
                published_date: new Date().toISOString(),
                comments: data.comments
            });

            await ctx.runMutation(internal.mutations.logAudit, {
                action: "AI_RECOMMENDATION_POST",
                model: "gemini-2.5-flash",
                input_prompt: \`Recomendar Random + Comments: \${anime.title}\`,
                output_summary: \`Gerado: \${data.title}\`,
                status: "SUCCESS",
                executorId: identity.subject
            });
            
            successCount++;
            // Delay obrigatório para não tomar 429 da Jikan (Rate Limit agressivo)
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (err) {
            console.error("Erro ao gerar post:", err);
            // Continua para o próximo
        }
    }
    return \`SUCESSO: \${successCount} recomendações geradas com comentários.\`;
  },
});

/**
 * Gera Game of the Week usando Random ID.
 */
export const generateGame = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Auth required");

        if (!process.env.GEMINI_API_KEY) throw new Error("FATAL: GEMINI_API_KEY missing.");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        let gameData = null;
        let attempts = 0;

        // Tenta achar um jogo válido por ID aleatório (evita fetch all)
        while (!gameData && attempts < 5) {
            attempts++;
            // IDs da FreeToGame geralmente vão de 1 a ~580
            const randomId = Math.floor(Math.random() * 540) + 1;
            
            try {
                const response = await fetch(\`https://www.freetogame.com/api/game?id=\${randomId}\`);
                if (response.ok) {
                    gameData = await response.json();
                }
            } catch (e) {
                console.log(\`Tentativa \${attempts} falhou para ID \${randomId}\`);
            }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!gameData) throw new Error("Não foi possível encontrar um jogo aleatório após várias tentativas.");

        // Gera recomendação curta com Gemini
        const prompt = \`
            Gere uma recomendação MUITO BREVE e IMPERATIVA para o jogo "\${gameData.title}" (\${gameData.platform}).
            Estilo: "Gamer", Tech, Curto.
            Deve terminar com um CTA (Call to Action) chamativo.
            Máximo de 2 frases.
        \`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const recommendation = response.text || \`Jogue \${gameData.title} agora mesmo! Uma experiência incrível no \${gameData.platform}.\`;

        await ctx.runMutation(internal.mutations.saveGame, {
            title: gameData.title,
            thumbnail: gameData.thumbnail,
            platform: gameData.platform,
            short_description: gameData.short_description,
            gemini_recommendation: recommendation,
            game_url: gameData.game_url,
        });

        await ctx.runMutation(internal.mutations.logAudit, {
            action: "AI_GAME_GENERATION",
            model: "gemini-2.5-flash",
            input_prompt: \`Game: \${gameData.title}\`,
            output_summary: "Game gerado com sucesso",
            status: "SUCCESS",
            executorId: identity.subject
        });

        return "Game da semana atualizado!";
    }
});

/**
 * Gera um time aleatório.
 * SE logado: Salva no banco.
 * SE não logado: Apenas retorna os dados para visualização.
 */
export const generateTeam = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        
        const characters = [];
        for (let i = 0; i < 3; i++) {
            try {
                const response = await fetch("https://api.jikan.moe/v4/random/characters");
                if (!response.ok) throw new Error("Jikan API Error");
                const data = await response.json();
                const char = data.data;
                const picsResponse = await fetch(\`https://api.jikan.moe/v4/characters/\${char.mal_id}/pictures\`);
                const picsData = await picsResponse.json();
                const finalImage = picsData.data?.[0]?.jpg?.image_url || char.images?.jpg?.image_url;

                characters.push({ jikanId: char.mal_id, name: char.name, imageUrl: finalImage });
                // Delay para rate limit
                await new Promise(r => setTimeout(r, 1200));
            } catch (e) {
                characters.push({ jikanId: 0, name: "Unknown", imageUrl: "https://placehold.co/200x300?text=Error" });
            }
        }

        // Se estiver autenticado, salva no histórico
        if (identity) {
            await ctx.runMutation(internal.mutations.saveTeam, {
                ownerId: identity.subject,
                characters: characters
            });
        }

        return characters;
    }
});

// --- Queries ---

export const getPosts = query({
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").collect();
  },
});

export const getPostBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", args.slug)).unique();
  },
});

export const getAuditLogs = query({
    handler: async (ctx) => {
        return await ctx.db.query("audit_logs").order("desc").take(10);
    }
});

export const getTeams = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        return await ctx.db.query("teams").withIndex("by_owner", q => q.eq("ownerId", identity.subject)).order("desc").take(1);
    }
});

export const getLatestGame = query({
    handler: async (ctx) => {
        return await ctx.db.query("games").order("desc").first();
    }
});

export const getPromo = query({
    handler: async (ctx) => {
        return await ctx.db.query("promos").order("desc").first();
    }
});
`;

const blogTeamCardsComponent = `'use client';
import React from 'react';

interface Character {
    jikanId: number;
    name: string;
    imageUrl: string;
}

interface TeamCardsProps {
    characters: Character[];
}

export default function TeamCards({ characters }: TeamCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '15px' }}>
        {characters.map((char) => (
            <a 
                key={char.jikanId} 
                href={\`https://myanimelist.net/character/\${char.jikanId}\`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                    display: 'block', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    textAlign: 'center',
                    textDecoration: 'none',
                    background: 'var(--card-bg)',
                    transition: 'transform 0.2s, border-color 0.2s'
                }}
                className="team-card"
            >
                <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                    <img 
                        src={char.imageUrl} 
                        alt={char.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                </div>
                <div style={{ padding: '10px' }}>
                    <p style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold', 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {char.name}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)' }}>ver perfil &rarr;</span>
                </div>
            </a>
        ))}
        <style jsx>{\`
            .team-card:hover {
                transform: translateY(-3px);
                border-color: var(--color-accent) !important;
            }
        \`}</style>
    </div>
  );
}
`;

const blogPostsPageContent = `'use client';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import MatrixLoader from "@/components/MatrixLoader";
import VibeMatcher from "@/components/VibeMatcher";
import AiringWidget from "@/components/AiringWidget";

export default function PostsPage() {
  const posts = useQuery(api.jikan.getPosts);
  const latestGame = useQuery(api.jikan.getLatestGame);
  const promo = useQuery(api.jikan.getPromo);
  const [search, setSearch] = useState("");

  if (posts === undefined) return <MatrixLoader />;

  // Client-side filtering
  const filteredPosts = posts.filter(post => 
      post.title.toLowerCase().includes(search.toLowerCase()) || 
      post.content_markdown.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Blog Posts</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Recomendações & Games.</p>
        </div>
        <Link href="/admin/dashboard" className="btn">Admin Panel</Link>
      </header>

      {/* GRID LAYOUT FOR MAIN CONTENT AND SIDEBAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
        
        {/* MAIN COLUMN */}
        <div>
            {/* SEARCH BAR - MOVED TO TOP */}
            <section style={{ marginBottom: '30px' }}>
                <input 
                    type="text" 
                    placeholder="> Buscar post por título ou conteúdo..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family)',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(138, 255, 138, 0.1)'
                    }}
                />
            </section>

            {/* PROMO VIDEO SECTION */}
            {promo && (
                <section style={{ marginBottom: '40px' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-accent)' }}>
                        <div style={{ background: 'var(--color-accent)', color: 'var(--bg-color)', padding: '5px 15px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>FEATURED_PROMO</span>
                            <span>REC ●</span>
                        </div>
                        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                            <iframe 
                                src={\`\${promo.embed_url}?autoplay=0\`} 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allowFullScreen
                                title={promo.title}
                            />
                        </div>
                        <div style={{ padding: '15px' }}>
                            <h3 style={{ margin: 0 }}>{promo.title}</h3>
                        </div>
                    </div>
                </section>
            )}

            {/* VIBE MATCHER SECTION */}
            <section style={{ marginBottom: '40px' }}>
                <VibeMatcher />
            </section>

            {/* GAME OF THE WEEK SECTION */}
            {latestGame && !search && (
                <section className="card" style={{ marginBottom: '40px', border: '1px solid var(--color-accent)' }}>
                    <h2 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        /// GAME_OF_THE_WEEK_PROTOCOL
                    </h2>
                    <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'start' }}>
                        <img src={latestGame.thumbnail} alt={latestGame.title} style={{ width: '150px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>{latestGame.title}</h3>
                            <div style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--border-color)', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '10px' }}>
                                {latestGame.platform}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{latestGame.short_description}</p>
                            <a href={latestGame.game_url} target="_blank" className="btn" style={{ display: 'inline-block', fontSize: '0.8rem' }}>
                                DATA LINK &rarr;
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* POSTS LIST */}
            <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filteredPosts.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>{search ? \`Nenhum resultado para "\${search}".\` : "Nenhum post encontrado."}</p>
                    <br />
                    {!search && <Link href="/admin/dashboard" style={{ color: 'var(--color-accent)' }}>Vá ao Dashboard para gerar conteúdo &rarr;</Link>}
                </div>
                ) : (
                filteredPosts.map((post) => (
                    <article key={post._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ height: '180px', overflow: 'hidden', borderRadius: '4px 4px 0 0', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                        <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none', borderRadius: 0 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', border: 'none', padding: 0, lineHeight: '1.3' }}>
                            <Link href={\`/posts/\${post.slug}\`} style={{ textDecoration: 'none', border: 'none' }}>
                                {post.title}
                            </Link>
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{new Date(post.published_date).toLocaleDateString()}</span>
                            <span style={{color: 'var(--color-accent)'}}>♥ {post.likes || 0}</span>
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <Link href={\`/posts/\${post.slug}\`} className="btn" style={{ display: 'block', textAlign: 'center' }}>Ler Post</Link>
                        </div>
                    </div>
                    </article>
                ))
                )}
            </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AiringWidget />
            
            <div className="card">
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>ABOUT_US</h3>
                <p style={{ fontSize: '0.8rem' }}>Blog gerado 100% por IA.</p>
            </div>
        </div>

      </div>
      
      <style jsx>{\`
        @media (max-width: 800px) {
            div[style*="grid-template-columns: 1fr 300px"] {
                grid-template-columns: 1fr !important;
            }
        }
      \`}</style>
    </div>
  );
}
`;

const blogPostViewContent = `'use client';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import MatrixLoader from "@/components/MatrixLoader";

export default function PostView({ params }: { params: { slug: string } }) {
  const post = useQuery(api.jikan.getPostBySlug, { slug: params.slug });
  const likePost = useMutation(api.mutations.likePost);

  if (post === undefined) return <MatrixLoader />;
  if (post === null) return <div className="container"><h1>404 - Post Not Found</h1><Link href="/posts">Voltar</Link></div>;

  return (
    <div className="container">
        <nav style={{ marginBottom: '20px' }}>
            <Link href="/posts">← Voltar para Lista</Link>
        </nav>

        <article className="card">
            <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{post.title}</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Por Kira (AI) | {new Date(post.published_date).toLocaleDateString()}</span>
                    
                    <button 
                        onClick={() => likePost({ id: post._id })}
                        className="btn"
                        style={{ padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>RESPECT</span>
                        <span style={{ background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                            {post.likes || 0}
                        </span>
                    </button>
                </div>
            </header>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img src={post.image_url} alt="Cover" style={{ maxHeight: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', borderRadius: '8px' }} />
            </div>

            <div className="markdown-body">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
            </div>
            
            {/* AI COMMENT SECTION */}
            {post.comments && post.comments.length > 0 && (
                <div style={{ marginTop: '50px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--color-accent)' }}>
                        >_ USER_COMMENTS [SIMULATION]
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {post.comments.map((comment: any, idx: number) => (
                            <div key={idx} style={{ 
                                background: 'var(--bg-color)', 
                                border: '1px solid var(--border-color)', 
                                padding: '15px', 
                                borderRadius: '4px',
                                borderLeft: \`3px solid \${
                                    comment.type === 'hater' ? 'var(--error-color)' : 
                                    comment.type === 'fanboy' ? 'var(--color-accent)' : 
                                    '#38bdf8'
                                }\`
                            }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>@{comment.user}</span>
                                    <span style={{ 
                                        textTransform: 'uppercase', 
                                        fontSize: '0.65rem', 
                                        opacity: 0.7,
                                        padding: '2px 5px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '3px'
                                    }}>{comment.type}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    </div>
  );
}`;

const blogConvexGeminiContent = `import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "Erro de Configuração: API Key ausente.";

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            // Prompt atualizado para uma persona mais natural e útil
            contents: \`Atue como um assistente virtual útil e amigável para o blog 'Terminal Blog'.
            Sua função é ajudar os visitantes com dúvidas sobre animes, tecnologia e o conteúdo do site.
            
            Diretrizes:
            1. Responda de forma natural, como uma pessoa normal (sem exagerar em gírias ou roleplay).
            2. Seja claro, objetivo e educado.
            3. O idioma é Português do Brasil (PT-BR).
            
            Mensagem do usuário: "\${message}"\`
        });
        return response.text;
    } catch (e) {
        return "Desculpe, não consegui processar sua mensagem no momento.";
    }
  }
});
`;

const blogConvexAuthConfigContent = `
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
`;

const blogGlobalsCssContent = `
:root {
  --bg-color: #0a0a0a;
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --color-accent: #00ff41; /* Matrix Green */
  --border-color: #333;
  --card-bg: #111;
  --font-family: "Courier New", Courier, monospace;
  --error-color: #ff3333;
}

* { box-sizing: border-box; }

body {
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: var(--font-family);
  margin: 0;
  line-height: 1.6;
}

a { color: inherit; text-decoration: none; transition: color 0.2s; }
a:hover { color: var(--color-accent); }

.container { max-width: 900px; margin: 0 auto; padding: 20px; }

.btn {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 10px 20px;
  cursor: pointer;
  font-family: inherit;
  text-transform: uppercase;
  font-weight: bold;
  transition: all 0.2s;
}
.btn:hover {
  background: var(--color-accent);
  color: black;
  box-shadow: 0 0 10px var(--color-accent);
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.card {
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
}

input, textarea {
  background: #000;
  border: 1px solid var(--border-color);
  color: var(--color-accent);
  padding: 10px;
  font-family: inherit;
  width: 100%;
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.markdown-body h1, .markdown-body h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 1.5rem; }
.markdown-body ul { padding-left: 20px; }
.markdown-body img { max-width: 100%; }
.markdown-body blockquote { border-left: 4px solid var(--color-accent); padding-left: 1rem; color: var(--text-secondary); }

/* Scanline effect */
body::before {
  content: " ";
  display: block;
  position: fixed;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  z-index: 2;
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
}
`;

const blogLayoutContent = `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import WelcomeChatBot from "@/components/WelcomeChatBot";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Terminal Blog AI",
  description: "Blog gerado por IA com tema cyberpunk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body className={inter.className}>
          <ConvexClientProvider>
            <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #333', marginBottom: '20px' }}>
                <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                    &gt;_ TERMINAL_BLOG
                </Link>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn" style={{ padding: '5px 15px', fontSize: '0.8rem' }}>LOGIN</button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </header>
            
            {children}
            <WelcomeChatBot />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
`;

const blogWelcomeChatBotComponent = `'use client';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MessageSquare, X, Volume2 } from 'lucide-react';

export default function WelcomeChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{sender: 'user'|'bot', text: string}[]>([{sender: 'bot', text: 'Olá! Sou o assistente virtual do blog. Em que posso ajudar hoje?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    const sendMessage = useAction(api.gemini.chat);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);
        
        try {
            const reply = await sendMessage({ message: userMsg });
            setMessages(prev => [...prev, { sender: 'bot', text: reply ?? '' }]);
        } catch(e) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Desculpe, ocorreu um erro de conexão.' }]);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Seu navegador não suporta Text-to-Speech.");
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="btn" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare />
                </button>
            )}
            
            {isOpen && (
                <div className="card" style={{ width: '300px', height: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: 'var(--color-accent)', color: 'black', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>ASSISTENTE VIRTUAL</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'black' }}><X size={16} /></button>
                    </div>
                    
                    <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: m.sender === 'user' ? '#333' : 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                padding: '8px',
                                borderRadius: '4px',
                                maxWidth: '85%',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>{m.text}</span>
                                {m.sender === 'bot' && (
                                    <button 
                                        onClick={() => speak(m.text)} 
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', padding: 0, minWidth: '16px' }}
                                        title="Ouvir mensagem"
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Digitando...</div>}
                    </div>
                    
                    <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '5px' }}>
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Digite sua mensagem..." 
                            style={{ flex: 1, fontSize: '0.9rem' }}
                        />
                        <button onClick={handleSend} className="btn" style={{ padding: '5px 10px' }}>&gt;</button>
                    </div>
                </div>
            )}
        </div>
    );
}
`;

const blogMatrixLoaderComponent = `
export default function MatrixLoader() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--color-accent)' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'monospace', marginBottom: '10px' }}>LOADING...</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Decrypting data stream from Jikan API</div>
        </div>
    );
}
`;

const blogVibeMatcherComponent = `'use client';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function VibeMatcher() {
    const [vibe, setVibe] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const matchVibe = useAction(api.jikan.matchVibe);

    const handleMatch = async () => {
        if (!vibe) return;
        setLoading(true);
        try {
            const data = await matchVibe({ vibe });
            setResult(data);
        } catch (e) {
            alert('Erro ao processar vibe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ border: '1px dashed var(--color-accent)' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '10px' }}>VIBE_MATCHER_PROTOCOL</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                Como você está se sentindo hoje? A IA encontrará o anime perfeito.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    value={vibe} 
                    onChange={(e) => setVibe(e.target.value)} 
                    placeholder="Ex: Triste mas esperançoso, Quero adrenalina..." 
                />
                <button onClick={handleMatch} disabled={loading} className="btn">
                    {loading ? '...' : 'MATCH'}
                </button>
            </div>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        KEYWORD DETECTED: <span style={{ color: 'var(--text-primary)' }}>{result.keyword}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.animes.map((anime: any) => (
                            <a key={anime.mal_id} href={anime.url} target="_blank" style={{ display: 'flex', gap: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', padding: '5px' }}>
                                <img src={anime.images.jpg.image_url} style={{ width: '50px', height: '70px', objectFit: 'cover' }} />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{anime.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score: {anime.score}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
`;

const blogDevQuoteComponent = `
// Component Placeholder - Not actively used in main layout but available for expansion
export default function DevQuote() {
    return (
        <div style={{ padding: '10px', fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: '2px solid var(--color-accent)' }}>
            "Talk is cheap. Show me the code." - Linus Torvalds
        </div>
    );
}
`;

const blogAiringWidgetComponent = `'use client';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export default function AiringWidget() {
    const getSchedule = useAction(api.jikan.getAiringSchedule);
    const [animes, setAnimes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSchedule().then(data => {
            setAnimes(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <span>NO AR AGORA</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>AO VIVO</span>
            </h3>
            
            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Buscando dados do satélite...</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                    {animes.slice(0, 5).map(anime => (
                        <li key={anime.mal_id} style={{ marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                            <a href={anime.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', maxWidth: '70%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        {anime.title}
                                    </span>
                                    <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', border: '1px solid var(--color-accent)', padding: '0 4px', borderRadius: '4px' }}>
                                        {anime.score || 'N/A'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Assistir Agora &rarr;
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
`;

const blogAdminDashboardContent = `'use client';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function AdminDashboard() {
  const posts = useQuery(api.jikan.getPosts);
  const auditLogs = useQuery(api.jikan.getAuditLogs);
  const deletePost = useMutation(api.mutations.deletePostPublic);
  const updatePost = useMutation(api.mutations.updatePostPublic);
  const generateContent = useAction(api.jikan.generateContent);
  const generateGame = useAction(api.jikan.generateGame);
  const generatePromo = useAction(api.jikan.generatePromoVideo);

  const [loading, setLoading] = useState("");
  const [editingPost, setEditingPost] = useState<any>(null);

  const handleGenerate = async (type: 'posts' | 'game' | 'promo') => {
    setLoading(type);
    try {
        if (type === 'posts') await generateContent();
        if (type === 'game') await generateGame();
        if (type === 'promo') await generatePromo();
        alert("Comando executado com sucesso.");
    } catch (e) {
        alert("Erro na execução: " + e);
    } finally {
        setLoading("");
    }
  };

  const handleEdit = (post: any) => {
      setEditingPost({ ...post });
  };

  const handleSaveUpdate = async () => {
      if (!editingPost) return;
      try {
          await updatePost({
              id: editingPost._id,
              title: editingPost.title,
              slug: editingPost.slug,
              content_markdown: editingPost.content_markdown,
              image_url: editingPost.image_url
          });
          setEditingPost(null);
          alert("Post atualizado com sucesso!");
      } catch (e) {
          alert("Erro ao atualizar: " + e);
      }
  };

  if (!posts) return <div className="container">Carregando painel...</div>;

  return (
    <div className="container">
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: 'var(--color-accent)' }}>ADMIN_MAINFRAME</h1>
            <Link href="/" className="btn">VOLTAR AO SITE</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            {/* ACTION PANEL */}
            <div className="card">
                <h3 style={{ marginBottom: '15px' }}>Comandos de Geração (IA)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleGenerate('posts')} disabled={!!loading} className="btn">
                        {loading === 'posts' ? "PROCESSANDO..." : "GERAR NOVOS POSTS (Jikan + Gemini)"}
                    </button>
                    <button onClick={() => handleGenerate('game')} disabled={!!loading} className="btn">
                        {loading === 'game' ? "PROCESSANDO..." : "GERAR GAME DA SEMANA"}
                    </button>
                    <button onClick={() => handleGenerate('promo')} disabled={!!loading} className="btn">
                         {loading === 'promo' ? "PROCESSANDO..." : "ATUALIZAR VÍDEO PROMO"}
                    </button>
                </div>
            </div>

            {/* AUDIT LOGS */}
            <div className="card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '15px' }}>Logs de Auditoria</h3>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {auditLogs?.map((log, i) => (
                        <div key={i} style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #333' }}>
                            <span style={{ color: log.status === 'SUCCESS' ? 'var(--color-accent)' : 'red' }}>[{log.status}]</span> {log.action}: {log.output_summary}
                        </div>
                    ))}
                    {!auditLogs?.length && "Nenhum log registrado."}
                </div>
            </div>
        </div>

        <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Gerenciar Posts Existentes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid white' }}>
                        <th style={{ textAlign: 'left', padding: '10px' }}>Título</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>Data</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post._id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '10px' }}>{post.title}</td>
                            <td style={{ padding: '10px' }}>{new Date(post.published_date).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleEdit(post)} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    [EDITAR]
                                </button>
                                <button onClick={() => deletePost({ id: post._id })} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    [DELETAR]
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* EDIT MODAL */}
        {editingPost && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-accent)' }}>
                    <h2 style={{ marginBottom: '20px', color: 'var(--color-accent)' }}>Editar Post</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Título</label>
                            <input value={editingPost.title} onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Slug (URL)</label>
                            <input value={editingPost.slug} onChange={(e) => setEditingPost({...editingPost, slug: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Imagem URL</label>
                            <input value={editingPost.image_url} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Conteúdo (Markdown)</label>
                            <textarea 
                                value={editingPost.content_markdown} 
                                onChange={(e) => setEditingPost({...editingPost, content_markdown: e.target.value})} 
                                style={{ height: '200px', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => setEditingPost(null)} className="btn" style={{ borderColor: '#666', color: '#888' }}>Cancelar</button>
                        <button onClick={handleSaveUpdate} className="btn">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        )}

      </SignedIn>
    </div>
  );
}
`;

const libGeminiTransformerContent = `
/**
 * Utility functions for processing Gemini output.
 */

export function cleanMarkdown(text: string): string {
    // Remove code blocks wrappers if present
    return text.replace(/^\\\`\\\`\\\`json/, '').replace(/\\\`\\\`\\\`$/, '').trim();
}

export function parseAIJSON(text: string): any {
    try {
        return JSON.parse(cleanMarkdown(text));
    } catch (e) {
        console.error("Failed to parse AI JSON", e);
        return null;
    }
}
`;

// Re-exporting the files map with updated content
export const blogFiles = {
    // Config Files
    'package.json': blogPackageJsonContent,
    'README.md': blogReadmeContent,
    '.env.local.example': 'CONVEX_DEPLOYMENT=\nNEXT_PUBLIC_CONVEX_URL=\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\nCLERK_SECRET_KEY=\nGEMINI_API_KEY=',
    'tsconfig.json': `{
      "compilerOptions": {
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [{ "name": "next" }],
        "paths": { "@/*": ["./src/*"] }
      },
      "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      "exclude": ["node_modules"]
    }`,

    // Backend (Convex)
    'convex/schema.ts': blogConvexSchemaContent,
    'convex/mutations.ts': blogConvexMutationsContent,
    'convex/jikan.ts': blogConvexJikanContent,
    'convex/gemini.ts': blogConvexGeminiContent,
    'convex/auth.config.ts': blogConvexAuthConfigContent,
    'convex.json': `{ "project": "terminal-blog", "team": "my-team" }`,
    'src/convex/_generated/api.d.ts': '// Auto-generated',
    'src/convex/_generated/dataModel.d.ts': '// Auto-generated',

    // Frontend
    'src/middleware.ts': blogMiddlewareContent,
    'src/app/layout.tsx': blogLayoutContent,
    'src/app/ConvexClientProvider.tsx': `"use client";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}`,
    'src/app/globals.css': blogGlobalsCssContent,
    // Page.tsx (Home) se mantém o mesmo da última versão (já está correto com o Team Generator)
    'src/app/page.tsx': `'use client';
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from 'next/link';
import TeamCards from "@/components/TeamCards";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  const generateTeam = useAction(api.jikan.generateTeam);
  const mySavedTeam = useQuery(api.jikan.getTeams); // Fetch saved team if logged in

  const [generatedTeam, setGeneratedTeam] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // If user has a saved team and hasn't generated a new one in this session, show saved
  const displayedTeam = generatedTeam || (mySavedTeam && mySavedTeam.length > 0 ? mySavedTeam[0].characters : null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const team = await generateTeam();
        setGeneratedTeam(team);
    } catch (e) {
        alert("Erro ao gerar time: " + e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '30px' }}>
      
      {/* HERO SECTION */}
      <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>BLOG_PESSOAL_AI</h1>
          <p style={{ margin: '0 auto', maxWidth: '600px', color: 'var(--text-secondary)' }}>
            Conectando Neural Net (Gemini) à Jikan API para gerar conteúdo otaku automaticamente.
          </p>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <Link href="/posts" className="btn">ACESSAR BLOG</Link>
        <Link href="/admin/dashboard" className="btn" style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}>ADMIN</Link>
      </div>

      {/* TEAM GENERATOR SECTION */}
      <section className="card" style={{ width: '100%', maxWidth: '800px', marginTop: '20px', border: '1px solid var(--color-accent)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--color-accent)' }}>
            >_ GERADOR DE TIME ALEATÓRIO
        </h2>
        
        <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Recrute 3 personagens aleatórios do multiverso dos animes.
            <SignedOut><br/><span style={{fontSize: '0.8rem'}}>(Faça login para salvar seu time permanentemente)</span></SignedOut>
        </p>

        {displayedTeam ? (
            <div style={{ marginBottom: '20px' }}>
                <TeamCards characters={displayedTeam} />
            </div>
        ) : (
            <div style={{ padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '20px', opacity: 0.5 }}>
                SEM DADOS DE EQUIPE
            </div>
        )}

        <button onClick={handleGenerate} disabled={loading} className="btn" style={{ minWidth: '200px' }}>
            {loading ? "RECRUTANDO..." : "GERAR NOVO TIME"}
        </button>
      </section>

    </div>
  );
}`,
    
    // Components
    'src/components/WelcomeChatBot.tsx': blogWelcomeChatBotComponent,
    'src/components/TeamCards.tsx': blogTeamCardsComponent,
    'src/components/MatrixLoader.tsx': blogMatrixLoaderComponent,
    'src/components/VibeMatcher.tsx': blogVibeMatcherComponent,
    'src/components/DevQuote.tsx': blogDevQuoteComponent,
    'src/components/AiringWidget.tsx': blogAiringWidgetComponent,
    
    // Posts
    'src/app/posts/page.tsx': blogPostsPageContent,
    'src/app/posts/[slug]/page.tsx': blogPostViewContent,

    // Admin
    'src/app/admin/dashboard/page.tsx': blogAdminDashboardContent,

    // Lib
    'src/lib/gemini-transformer.ts': libGeminiTransformerContent,
};
