import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { geminiKey, geminiModel } from "./aiConfig";
import { SITE } from "../src/lib/site";

/** Chatbot do blog. Exige login para não expor a cota da chave Gemini a visitantes anônimos. */
export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    if (!(await ctx.auth.getUserIdentity())) return "Faça login para conversar com o assistente.";
    const text = message.trim().slice(0, 1000);
    if (!text) return "Escreva uma mensagem.";

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey() });
      const response = await ai.models.generateContent({
        model: geminiModel(),
        config: {
          systemInstruction: `Você é o assistente virtual do blog "${SITE.name}" (${SITE.tagline}).
Ajude os visitantes com dúvidas sobre animes, games e o conteúdo do site.
Responda em português do Brasil, de forma natural, clara e educada.`,
        },
        contents: text,
      });
      return response.text ?? "Não consegui gerar uma resposta.";
    } catch {
      return "Desculpe, não consegui processar sua mensagem no momento.";
    }
  },
});
