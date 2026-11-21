import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI, Type } from "@google/genai";
import { geminiKey, geminiModel } from "./aiConfig";
import { requireUser } from "./authz";
import { SITE } from "../src/lib/site";

const ITINERARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    dailyPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          theme: { type: Type.STRING },
          activities: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["day", "theme", "activities"],
      },
    },
  },
  required: ["title", "summary", "dailyPlan"],
};

const clip = (value: string, max: number) => value.trim().slice(0, max);

/** Gera o roteiro dia a dia. Retorna o JSON como texto (mesmo formato salvo em trips.itinerary). */
export const generateItinerary = action({
  args: {
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const days = Math.trunc(args.days);
    if (!Number.isFinite(days) || days < 1 || days > 21) throw new Error("Escolha entre 1 e 21 dias.");
    const destination = clip(args.destination, 100);
    if (!destination) throw new Error("Informe o destino.");

    const ai = new GoogleGenAI({ apiKey: geminiKey() });
    const result = await ai.models.generateContent({
      model: geminiModel(),
      config: {
        systemInstruction: `Você é o planejador de viagens de "${SITE.name}" (${SITE.tagline}). Responda em português do Brasil.`,
        responseMimeType: "application/json",
        responseSchema: ITINERARY_SCHEMA,
      },
      contents: `Crie um roteiro para ${destination}: ${days} dias, orçamento ${clip(args.budget, 50)}, viajantes: ${clip(args.travelers, 50)}. Um item em dailyPlan por dia.`,
    });
    const text = result.text ?? "";
    JSON.parse(text); // garante que é JSON válido antes de devolver
    return text;
  },
});

export const chat = action({
  args: {
    message: v.string(),
    history: v.array(v.object({ role: v.string(), parts: v.array(v.object({ text: v.string() })) })),
  },
  handler: async (ctx, { message, history }) => {
    await requireUser(ctx);
    const ai = new GoogleGenAI({ apiKey: geminiKey() });
    const chat = ai.chats.create({
      model: geminiModel(),
      config: {
        systemInstruction: `Você é um especialista em viagens de "${SITE.name}". Responda de forma concisa, em português do Brasil.`,
      },
      history: history.slice(-20).map((h) => ({
        role: h.role === "model" ? "model" : "user",
        parts: h.parts.map((p) => ({ text: clip(p.text, 2000) })),
      })),
    });
    const result = await chat.sendMessage({ message: clip(message, 1000) });
    return result.text;
  },
});
