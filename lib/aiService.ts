import { AIProduct } from "./templates";
import { PlatformAdapter } from "./platformAdapter";

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
 * Invoca com segurança comandos do Tauri no container Desktop (.exe).
 */
async function invokeTauri<T>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  const tauri = (window as any).__TAURI__;
  if (tauri && typeof tauri.invoke === "function") {
    return await tauri.invoke(cmd, args);
  }
  if ((window as any).__TAURI_INTERNALS__?.invoke) {
    return await (window as any).__TAURI_INTERNALS__.invoke(cmd, args);
  }
  throw new Error(`Ambiente Tauri não detectado para invocar comando: ${cmd}`);
}

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
 * Fallback de produtos estruturados locais em caso de indisponibilidade ou modo mock.
 */
export const generateFallbackProducts = (theme: string): AIProduct[] => {
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
 * Gera imagens SVG em base64 sem dependências de rede.
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
 * Service to manage AI generations across Gemini (Tauri Rust BYOK Desktop vs Server Proxy Web).
 */
export class AIService {
  /**
   * Verifica se já existe chave configurada.
   * No Tauri Desktop: consulta o Windows Credential Manager via invoke('has_api_key').
  /**
   * Verifica se já existe chave configurada no keyring do Windows.
   * No Tauri Desktop: invoca has_api_key() que retorna Result<bool, String>.
   * Se Ok(false) -> retorna { exists: false } (abre ApiKeyModal).
   * Se Err(msg) -> retorna { exists: false, error: msg } para exibir alerta sem mascarar falhas no cofre.
   * No Web/Dev -> retorna { exists: true } pois a chave é provida pelo .env do servidor.
   */
  static async checkApiKeyStatus(): Promise<{ exists: boolean; error?: string }> {
    if (PlatformAdapter.isTauriApp()) {
      try {
        const has = await invokeTauri<boolean>("has_api_key");
        return { exists: Boolean(has) };
      } catch (err: any) {
        const errorMsg = err?.toString() || "Erro ao acessar o Windows Credential Manager";
        console.error("[Keyring Error]:", errorMsg);
        return { exists: false, error: errorMsg };
      }
    }

    // Modo Web / Dev: a chave vem do .env do servidor; não requer modal
    return { exists: true };
  }

  /**
   * Helper simplificado para verificações booleanas retrocompatíveis
   */
  static async hasApiKey(): Promise<boolean> {
    const status = await this.checkApiKeyStatus();
    return status.exists;
  }

  /**
   * Salva a chave de API no Windows Credential Manager exclusivamente via Tauri.
   * Não persiste no localStorage em modo dev.
   */
  static async saveApiKey(key: string): Promise<void> {
    const trimmed = key.trim();
    if (!trimmed) throw new Error("A chave de API não pode estar vazia.");

    if (PlatformAdapter.isTauriApp()) {
      await invokeTauri("save_api_key", { key: trimmed });
    }
  }

  /**
   * Remove a chave salva no Windows Credential Manager via Tauri.
   */
  static async deleteApiKey(): Promise<void> {
    if (PlatformAdapter.isTauriApp()) {
      await invokeTauri("delete_api_key");
    }
  }

  /**
   * Valida conexão da chave com o Gemini 3.8 Flash
   */
  static async testApiKey(): Promise<{ success: boolean; message: string }> {
    if (PlatformAdapter.isTauriApp()) {
      try {
        const msg = await invokeTauri<string>("test_api_key");
        return { success: true, message: msg || "Conexão OK!" };
      } catch (err: any) {
        return { success: false, message: err?.toString() || "Falha ao validar chave." };
      }
    }

    // Modo Web Dev: testa via servidor proxy do Express
    try {
      const res = await fetch("/api/ai/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: "Teste Conexão" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.source === "fallback-no-key") {
          return { success: false, message: "GEMINI_API_KEY não encontrada no .env do servidor." };
        }
        return { success: true, message: "Conexão validada com sucesso com Gemini 3.8 Flash!" };
      }
      return { success: false, message: `Servidor retornou erro HTTP ${res.status}.` };
    } catch (err: any) {
      return { success: false, message: err?.message || "Falha na conexão de rede." };
    }
  }

  /**
   * Generates products list
   * Regra estrita de fallback:
   * 1. Se for Tauri Desktop: chama invoke('generate_store_products').
   *    Se falhar, propaga o erro detalhado — NÃO tenta fetch('/api/ai/...') pois no Desktop o Express não existe.
   * 2. Se for Web (dev): usa fetch('/api/ai/products').
   * Em ambos os casos, dados de fallback locais podem ser usados com aviso visual caso haja falha não fatal.
   */
  static async generateProducts(theme: string): Promise<AIProduct[]> {
    const config = getAIConfig();

    if (config.provider === "mock") {
      await new Promise((r) => setTimeout(r, 400));
      return generateFallbackProducts(theme);
    }

    if (config.provider === "openai") {
      return this.generateWithOpenAI(theme, config);
    }

    // Provedor padrão: Gemini 3.8 Flash
    if (PlatformAdapter.isTauriApp()) {
      try {
        const tauriProducts = await invokeTauri<any[]>("generate_store_products", { theme });
        if (Array.isArray(tauriProducts) && tauriProducts.length > 0) {
          return tauriProducts.map((p) => ({
            name: p.name || `Produto ${theme}`,
            price: Number(p.price) || 99.9,
            description: p.description || `Item da coleção ${theme}`,
            category: p.category || "Geral",
            stock: Number(p.stock) || 10,
          }));
        }
        // Se retornou vazio do Rust
        return generateFallbackProducts(theme);
      } catch (tauriErr: any) {
        const errorMsg = tauriErr?.toString() || "Falha desconhecida no backend Tauri Desktop";
        console.error("[Tauri Gemini Desktop Error]:", errorMsg);
        // Propaga o erro claro no desktop sem tentar Express
        throw new Error(`[Desktop Gemini] ${errorMsg}`);
      }
    }

    // Modo Web / Dev (onde o Express existe)
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

    // Se estiver em modo web/dev, pode usar o endpoint de imagem do Express
    if (!PlatformAdapter.isTauriApp()) {
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
    }

    // Fallback local SVG para desktop e dev
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

    return generateFallbackProducts(theme);
  }

  private static async generateWithOpenAI(theme: string, config: AIServiceConfig): Promise<AIProduct[]> {
    if (!config.openaiKey) {
      return generateFallbackProducts(theme);
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
      return generateFallbackProducts(theme);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanContent);
    return parsed.slice(0, 4);
  }
}
