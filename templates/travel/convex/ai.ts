import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const generateItinerary = action({
  args: {
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      Crie um roteiro de viagem para ${args.destination} (${args.days} dias, ${args.budget}, ${args.travelers}).
      Retorne APENAS JSON válido:
      {
        "title": "Título Criativo",
        "summary": "Resumo curto em 1 frase",
        "dailyPlan": [
          { "day": 1, "theme": "Tema do Dia", "activities": ["Atividade A", "Atividade B"] }
        ]
      }
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return result.text;
  },
});

export const chat = action({
  args: { message: v.string(), history: v.array(v.object({ role: v.string(), parts: v.array(v.object({ text: v.string() })) })) },
  handler: async (ctx, { message, history }) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = "Você é um expert em viagens. Responda de forma concisa e elegante.";
    
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "OK." }] },
        ...history
      ]
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  }
});
