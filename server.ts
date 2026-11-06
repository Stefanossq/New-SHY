import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to instantiate server-side Gemini client utility
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Fallback product generator if Gemini key is missing or quota/permission exceeded
const generateFallbackProducts = (theme: string) => {
  const norm = (theme || "").toLowerCase().trim();
  if (norm.includes("car") || norm.includes("veic") || norm.includes("auto")) {
    return [
      {
        name: "Tesla Model S Plaid (Edição Especial)",
        price: 499000,
        description: "Sedã 100% elétrico de altíssima performance. Aceleração extrema de 0-100 km/h em 2.1s com interior premium minimalista.",
        category: "Elétricos",
        stock: 3,
      },
      {
        name: "Porsche 911 Carrera S GTS",
        price: 840000,
        description: "O clássico esportivo alemão. Motor Boxer biturbo, transmissão PDK de dupla embreagem e suspensão adaptativa.",
        category: "Esportivos",
        stock: 2,
      },
      {
        name: "Jeep Compass Trailhawk TD350 4x4",
        price: 245000,
        description: "SUV robusto com tração integral 4x4, motor turbodiesel de 170cv e suspensão off-road.",
        category: "SUVs",
        stock: 5,
      },
      {
        name: "BYD Song Plus DM-i Híbrido",
        price: 239000,
        description: "Híbrido plug-in inteligente com autonomia combinada superior a 1.000 km e cockpit 100% digital.",
        category: "Híbridos",
        stock: 4,
      },
    ];
  }

  return [
    {
      name: `Coleção Signature de ${theme}`,
      price: 189.9,
      description: `Item premium artesanal desenvolvido com curadoria especializada para entusiastas de ${theme}.`,
      category: "Destaques",
      stock: 12,
    },
    {
      name: `Kit Vanguard ${theme} Pro`,
      price: 299.0,
      description: `Solução inovadora com ergonomia avançada e acabamento em alumínio anodizado de alta resistência.`,
      category: "Novidades",
      stock: 8,
    },
    {
      name: `Módulo Essencial ${theme}`,
      price: 79.5,
      description: `Acessório versátil e de alta durabilidade projetado para otimizar sua rotina diária.`,
      category: "Acessórios",
      stock: 20,
    },
    {
      name: `Box Colecionador ${theme} Deluxe`,
      price: 450.0,
      description: `Edição limitada com embalagem comemorativa, manual ilustrado e itens exclusivos numerados.`,
      category: "Colecionáveis",
      stock: 5,
    },
  ];
};

// SVG base64 generator for clean instant mockups
const generateSvgBase64 = (name: string, bgHex: string = "06b6d4") => {
  const safeName = (name || "Produto").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="100%" height="100%" fill="#0D131F"/>
    <rect x="20" y="20" width="360" height="360" rx="16" fill="#141E33" stroke="#1F2E4D" stroke-width="2"/>
    <circle cx="200" cy="170" r="70" fill="#${bgHex}" fill-opacity="0.15" stroke="#${bgHex}" stroke-width="2"/>
    <path d="M175 170 L225 170 M200 145 L200 195" stroke="#${bgHex}" stroke-width="4" stroke-linecap="round"/>
    <text x="50%" y="280" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#F3F4F6" font-weight="600">${safeName}</text>
    <text x="50%" y="315" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#9CA3AF">Catálogo Dinâmico · ScaffoldEngine</text>
  </svg>`;
  return Buffer.from(svg).toString("base64");
};

// API: Health & API status
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.json({ status: "ok", hasGeminiKey: hasKey });
});

// API: Server-side Gemini product generation
app.post("/api/ai/products", async (req, res) => {
  const { theme } = req.body || {};
  const currentTheme = (typeof theme === "string" && theme.trim()) ? theme.trim() : "Tecnologia & Acessórios";

  try {
    const ai = getGeminiClient();

    if (!ai) {
      console.warn("[Server Gemini] No GEMINI_API_KEY present on server. Using fallback products.");
      const fallback = generateFallbackProducts(currentTheme);
      return res.json({ products: fallback, source: "fallback-no-key" });
    }

    // Call standard recommended text model: gemini-3.8-flash (no paid tier required)
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Gere uma lista de 4 produtos comerciais originais e realistas para uma loja online sobre "${currentTheme}". Retorne preços realistas em BRL, descrições persuasivas e estoques coerentes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome do produto" },
              price: { type: Type.NUMBER, description: "Preço do produto em reais (BRL)" },
              description: { type: Type.STRING, description: "Breve descrição do produto" },
              category: { type: Type.STRING, description: "Categoria do produto" },
              stock: { type: Type.INTEGER, description: "Quantidade em estoque" },
            },
            required: ["name", "price", "description", "category", "stock"],
          },
        },
      },
    });

    const text = response.text?.trim() || "[]";
    const products = JSON.parse(text);

    if (Array.isArray(products) && products.length > 0) {
      return res.json({ products: products.slice(0, 4), source: "gemini-3.8-flash" });
    }

    const fallback = generateFallbackProducts(currentTheme);
    return res.json({ products: fallback, source: "fallback-empty" });
  } catch (error: any) {
    console.error("[Server Gemini] Error during generateContent:", error?.message || error);
    // Graceful fallback prevents frontend crashes and avoids uncaught 403 halts
    const fallback = generateFallbackProducts(currentTheme);
    return res.json({
      products: fallback,
      source: "fallback-error",
      warning: error?.message || "Gemini API unavailable",
    });
  }
});

// API: Server-side Image Generation
app.post("/api/ai/image", async (req, res) => {
  const { productName, bgIndex } = req.body || {};
  const palette = ["06b6d4", "10b981", "3b82f6", "f59e0b", "8b5cf6"];
  const color = palette[Math.abs(Number(bgIndex) || 0) % palette.length];

  try {
    // Generate clean SVG representation to guarantee 100% reliable 0-cost, 0-permission image generation
    const svgBase64 = generateSvgBase64(productName || "Produto", color);
    return res.json({ imageBase64: svgBase64 });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to generate image" });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] ScaffoldEngine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
