// Modelo de texto da Gemini usado pelo app. Troque pela variável GEMINI_MODEL no Convex.
export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

export const geminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada no Convex (npx convex env set GEMINI_API_KEY ...).");
  return key;
};
