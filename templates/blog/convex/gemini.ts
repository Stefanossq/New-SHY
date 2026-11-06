import { action } from "./_generated/server";
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
            contents: `Atue como um assistente virtual útil e amigável para o blog 'Terminal Blog'.
            Sua função é ajudar os visitantes com dúvidas sobre animes, tecnologia e o conteúdo do site.
            
            Diretrizes:
            1. Responda de forma natural, como uma pessoa normal (sem exagerar em gírias ou roleplay).
            2. Seja claro, objetivo e educado.
            3. O idioma é Português do Brasil (PT-BR).
            
            Mensagem do usuário: "${message}"`
        });
        return response.text;
    } catch (e) {
        return "Desculpe, não consegui processar sua mensagem no momento.";
    }
  }
});
