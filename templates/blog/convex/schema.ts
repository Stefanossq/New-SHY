import { defineSchema, defineTable } from "convex/server";
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
