import { action, query } from "./_generated/server";
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
    const prompt = `
      Translate the user feeling/vibe "${vibe}" into a search query for an Anime database.
      Return a JSON object with a single key "q" containing 1 or 2 English keywords max.
      Example: "Sad cyberpunk" -> { "q": "cyberpunk drama" }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const { q } = JSON.parse(response.text || '{"q": "adventure"}');
        
        // 2. Busca na Jikan API
        const jikanResponse = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=3&order_by=score&sort=desc`);
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
        const response = await fetch(`https://api.jikan.moe/v4/schedules?filter=${currentDay}`);
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
                output_summary: `Promo defined: ${title}`,
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
            
            const prompt = `
                Atue como 'Kira', um autor fictício apaixonado por animes deste blog.
                Escreva um post de blog RECOMENDANDO o anime "${anime.title}".
                
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
                    "slug": "slug-amigavel-do-post-${anime.mal_id}",
                    "comments": [
                        { "user": "DarkSasuke00", "content": "Texto do hater...", "type": "hater" },
                        { "user": "KawaiiChan", "content": "Texto fofo...", "type": "fanboy" },
                        { "user": "DevOps_San", "content": "Texto técnico...", "type": "tech" }
                    ]
                }
            `;

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
                input_prompt: `Recomendar Random + Comments: ${anime.title}`,
                output_summary: `Gerado: ${data.title}`,
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
    return `SUCESSO: ${successCount} recomendações geradas com comentários.`;
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
                const response = await fetch(`https://www.freetogame.com/api/game?id=${randomId}`);
                if (response.ok) {
                    gameData = await response.json();
                }
            } catch (e) {
                console.log(`Tentativa ${attempts} falhou para ID ${randomId}`);
            }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!gameData) throw new Error("Não foi possível encontrar um jogo aleatório após várias tentativas.");

        // Gera recomendação curta com Gemini
        const prompt = `
            Gere uma recomendação MUITO BREVE e IMPERATIVA para o jogo "${gameData.title}" (${gameData.platform}).
            Estilo: "Gamer", Tech, Curto.
            Deve terminar com um CTA (Call to Action) chamativo.
            Máximo de 2 frases.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const recommendation = response.text || `Jogue ${gameData.title} agora mesmo! Uma experiência incrível no ${gameData.platform}.`;

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
            input_prompt: `Game: ${gameData.title}`,
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
                const picsResponse = await fetch(`https://api.jikan.moe/v4/characters/${char.mal_id}/pictures`);
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
