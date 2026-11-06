import { AIProduct } from "./templates";

export type AIProviderType = "gemini" | "openai" | "mock";

export interface AIServiceConfig {
  provider: AIProviderType;
  openaiKey?: string;
  openaiEndpoint?: string;
  openaiModel?: string;
}

const STORAGE_KEY = "generator_ai_config";

// Default configuration
const DEFAULT_CONFIG: AIServiceConfig = {
  provider: "gemini",
  openaiEndpoint: "https://api.openai.com/v1",
  openaiModel: "gpt-4o-mini",
};

/**
 * Recovers configuration from localStorage
 */
export const getAIConfig = (): AIServiceConfig => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.error("Error reading AI config from storage:", e);
  }

  return { ...DEFAULT_CONFIG };
};

/**
 * Saves current config back to localStorage.
 */
export const saveAIConfig = (config: AIServiceConfig) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

/**
 * Mock generator for completely offline or zero-key usage.
 */
const generateMockProducts = (theme: string): AIProduct[] => {
  const norm = (theme || "").toLowerCase().trim();
  if (norm.includes("car") || norm.includes("veic") || norm.includes("auto")) {
    return [
      { name: "Tesla Model S Plaid (Simulado)", price: 499000, description: "Sedã 100% elétrico de altíssima performance. Aceleração extrema (0-100 km/h em 2.1s) com modo Plaid ativo.", category: "Elétricos", stock: 2 },
      { name: "Porsche 911 Carrera S (Simulado)", price: 830000, description: "O clássico esportivo alemão. Motor Boxer biturbo, câmbio PDK de 8 marchas e design atemporal.", category: "Esportivos", stock: 1 },
      { name: "Jeep Compass Trailhawk TD350 (Simulado)", price: 240000, description: "SUV robusto com tração integral 4x4, motor turbodiesel de 170cv e suspensão preparada para off-road.", category: "SUVs", stock: 4 },
      { name: "BYD Song Plus DM-i (Simulado)", price: 230000, description: "Híbrido plug-in inteligente com autonomia combinada superior a 1000 km e interior super tecnológico.", category: "Híbridos", stock: 3 },
    ];
  }

  return [
    { name: `Produto Alfa de ${theme}`, price: 99.90, description: `Um item premium exclusivo desenvolvido especialmente para os amantes de ${theme}.`, category: "Destaques", stock: 15 },
    { name: `Inovação Beta ${theme}`, price: 149.00, description: `A reinvenção tecnológica aplicada a produtos de ${theme}. Design ergonômico e material ecológico.`, category: "Novidades", stock: 8 },
    { name: `Acessório Gamma Pro`, price: 45.00, description: `O complemento ideal para turbinar seu setup de ${theme}. Altamente resistente e durável.`, category: "Acessórios", stock: 25 },
    { name: `Kit Completo ${theme} Deluxe`, price: 299.90, description: `A melhor seleção de itens sobre ${theme} em uma caixa especial de colecionador.`, category: "Colecionáveis", stock: 5 },
  ];
};

/**
 * Generates base64 SVG mock images for instant, keyless image output.
 */
const generateMockImageSvgBase64 = (name: string, bg: string = "22d3ee"): string => {
  const safeName = (name || "Produto").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" fill="#1f2937"/>
    <circle cx="150" cy="130" r="50" fill="#${bg}"/>
    <text x="50%" y="220" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#f3f4f6" font-weight="bold">${safeName}</text>
    <text x="50%" y="250" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">Mockup de IA</text>
  </svg>`;
  try {
    return btoa(unescape(encodeURIComponent(svg)));
  } catch {
    return "";
  }
};

/**
 * Service to manage AI generations across Gemini (server-side proxy), custom OpenAI API, and Mock.
 */
export class AIService {
  /**
   * Generates products list
   */
  static async generateProducts(theme: string): Promise<AIProduct[]> {
    const config = getAIConfig();

    if (config.provider === "mock") {
      await new Promise((r) => setTimeout(r, 400));
      return generateMockProducts(theme);
    }

    if (config.provider === "openai") {
      return this.generateWithOpenAI(theme, config);
    }

    // Default: Server-side Gemini endpoint
    return this.generateWithServerGemini(theme);
  }

  /**
   * Generates an image for a description
   */
  static async generateImage(_prompt: string, productName: string, bgIndex: number = 0): Promise<string | null> {
    const config = getAIConfig();

    if (config.provider === "mock") {
      await new Promise((r) => setTimeout(r, 200));
      const colors = ["22d3ee", "10b981", "3b82f6", "f59e0b"];
      const bg = colors[bgIndex % colors.length];
      return generateMockImageSvgBase64(productName, bg);
    }

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, bgIndex }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageBase64) {
          return data.imageBase64;
        }
      }
    } catch (err) {
      console.warn("Server image endpoint error, falling back to local SVG:", err);
    }

    // Fallback local SVG
    const colors = ["22d3ee", "10b981", "3b82f6", "f59e0b"];
    const bg = colors[bgIndex % colors.length];
    return generateMockImageSvgBase64(productName, bg);
  }

  private static async generateWithServerGemini(theme: string): Promise<AIProduct[]> {
    try {
      const response = await fetch("/api/ai/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          return data.products;
        }
      } else {
        console.warn(`Server responded with ${response.status} to /api/ai/products`);
      }
    } catch (err) {
      console.warn("Failed to contact /api/ai/products, using robust fallback:", err);
    }

    // If server had any issue or network failure, return graceful theme products without throwing
    return generateMockProducts(theme);
  }

  private static async generateWithOpenAI(theme: string, config: AIServiceConfig): Promise<AIProduct[]> {
    if (!config.openaiKey) {
      return generateMockProducts(theme);
    }

    const endpoint = config.openaiEndpoint || "https://api.openai.com/v1";
    const model = config.openaiModel || "gpt-4o-mini";

    const prompt = `Gere uma lista de 4 produtos para uma loja sobre "${theme}".
Retorne estritamente um array JSON de objetos com as seguintes chaves:
[
  {
    "name": "Nome",
    "price": 150.00,
    "description": "Breve descrição",
    "category": "Categoria",
    "stock": 10
  }
]
Não escreva explicações, markdown ou blocos de código além do JSON puro.`;

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openaiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.warn(`OpenAI status ${response.status}, falling back to mock`);
      return generateMockProducts(theme);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanContent);
    return parsed.slice(0, 4);
  }
}
