import { PROJECT_TEMPLATES, createConvexProductsContent, AIProduct } from "./templates";
import { ProjectType } from "../types";
import { AIService } from "./aiService";

export type GenerationStatus = "idle" | "loading" | "success" | "error";

export interface GenerationProgress {
  stepIndex: number;
  status: GenerationStatus;
  message: string;
}

export interface GenerationOptions {
  /** Artificial pacing between UI steps (ms). Tests pass 0 for speed. */
  stepDelayMs?: number;
}

export const STORE_AI_STEPS = [
  "Carregando configurações e checando conexão com Provedor de IA",
  "Buscando informações do segmento e gerando catálogo de produtos",
  "Gerando fotos de estúdio profissionais para cada produto via IA",
  "Estruturando Schema de dados do catálogo dinâmico",
] as const;

/** Single source of truth for the step list shown in the UI and executed by the engine. */
export const getLifecycleSteps = (projectType: ProjectType): string[] => {
  const template = PROJECT_TEMPLATES[projectType];
  return projectType === "store" ? [...STORE_AI_STEPS, ...template.lifecycle] : [...template.lifecycle];
};

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export interface GenerationResult {
  type: ProjectType;
  name: string;
  files: Record<string, any>;
  lifecycle: string[];
}

/**
 * Core engine to orchestrate project generation with progress logging.
 */
export const orchestrateGeneration = async (
  projectType: ProjectType,
  theme: string,
  onProgress: (progress: GenerationProgress) => void,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  const template = PROJECT_TEMPLATES[projectType];
  if (!template) throw new Error(`Template desconhecido: ${projectType}`);
  const delay = options.stepDelayMs ?? 500;
  // Copy-on-write: the shared template registry is never mutated by a generation run.
  const updatedFiles = { ...template.files };
  const lifecycle = getLifecycleSteps(projectType);

  if (projectType === "blog" || projectType === "travel") {
    // For blog or travel, it's virtually instant, but we simulate steps to give real feedback
    for (let i = 0; i < lifecycle.length; i++) {
      onProgress({
        stepIndex: i,
        status: "loading",
        message: `${lifecycle[i]}...`,
      });
      await sleep(delay);
      onProgress({
        stepIndex: i,
        status: "success",
        message: `${lifecycle[i]} concluído ✅`,
      });
    }

    return {
      type: projectType,
      name: template.name,
      files: updatedFiles,
      lifecycle,
    };
  }

  // Segment: Store configuration (highly dynamic with AI products & images)
  const storeSteps = lifecycle;
  let activeStep = 0;

  // Helper to log steps (remembers the active step so failures point at the right one)
  const updateStep = (index: number, status: GenerationStatus, message: string) => {
    activeStep = index;
    onProgress({ stepIndex: index, status, message });
  };

  try {
    // Step 0: Check config
    updateStep(0, "loading", storeSteps[0]);
    await sleep(Math.round(delay * 0.8));
    updateStep(0, "success", `${storeSteps[0]} - OK!`);

    // Step 1: Generate Catalog Products
    updateStep(1, "loading", `${storeSteps[1]} ("${theme}")`);
    let products: AIProduct[] = [];

    if (theme === "__CARS__") {
      updateStep(1, "loading", "Acessando banco de dados de veículos (FIPE API)...");
      try {
        products = await fetchCarDataFromFipe();
      } catch (err) {
        console.warn("FIPE API failed, falling back to AI generated cars...", err);
        products = await AIService.generateProducts("Carros Esportivos e SUVs");
      }
    } else {
      products = await AIService.generateProducts(theme);
    }
    updateStep(1, "success", `${storeSteps[1]} - Encontrados ${products.length} itens.`);

    // Step 2: Generate studio photos for each product
    updateStep(2, "loading", storeSteps[2]);
    const imagePaths: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      updateStep(
        2,
        "loading",
        `Gerando imagem para o item ${i + 1} de ${products.length}: ${product.name}...`
      );

      const prompt = theme === "__CARS__"
        ? `Foto profissional em estúdio de um ${product.name}, cor prata, com iluminação de estúdio clean e fundo infinito.`
        : `Uma foto de estúdio promocional e de alta qualidade do produto: "${product.name}". O fundo deve ser limpo, minimalista, moderno, focado em e-commerce.`;

      let base64Image = await AIService.generateImage(prompt, product.name, i);

      if (base64Image) {
        const imagePath = `public/images/product_${i}.png`;
        updatedFiles[imagePath] = { base64: base64Image };
        imagePaths.push(`/${imagePath.replace("public/", "")}`);
      } else {
        // Fallback placeholder
        const text = theme === "__CARS__" ? product.name : "Indisponível";
        imagePaths.push(`https://placehold.co/300x300/1f2937/d1d5db?text=${encodeURIComponent(text)}`);
      }
    }
    updateStep(2, "success", `${storeSteps[2]} - ${products.length} imagens geradas com sucesso.`);

    // Step 3: Scaffold Schema to Convex Database
    updateStep(3, "loading", storeSteps[3]);
    const productsContent = createConvexProductsContent(products, imagePaths);
    updatedFiles["convex/products.ts"] = productsContent;
    await sleep(delay);
    updateStep(3, "success", `${storeSteps[3]} - schema gerado em convex/products.ts`);

    // Remaining standard setup steps
    for (let i = 4; i < storeSteps.length; i++) {
      updateStep(i, "loading", `${storeSteps[i]}...`);
      await sleep(delay);
      updateStep(i, "success", `${storeSteps[i]} concluído ✅`);
    }

    return {
      type: "store",
      name: template.name,
      files: updatedFiles,
      lifecycle: storeSteps,
    };
  } catch (error: any) {
    console.error("Orchestration failed:", error);
    onProgress({
      stepIndex: activeStep,
      status: "error",
      message: `Erro na geração: ${error.message || error}`,
    });
    throw error;
  }
};

const FIPE_API_BASE_V2 = "https://fipe.parallelum.com.br/api/v2";

async function fipeRequest(endpoint: string) {
  const response = await fetch(`${FIPE_API_BASE_V2}${endpoint}`);
  if (!response.ok) {
    throw new Error(`FIPE API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * FIPE API fetcher decoupled from view library
 */
const fetchCarDataFromFipe = async (): Promise<AIProduct[]> => {
  const targetBrandNames = ["Volkswagen", "Fiat", "Chevrolet", "Ford"];
  const allBrands = await fipeRequest("/cars/brands");

  const targetBrands = targetBrandNames
    .map((name) =>
      allBrands.find((brand: { name: string; code: string }) =>
        brand.name.toLowerCase().includes(name.toLowerCase())
      )
    )
    .filter((b) => b);

  if (targetBrands.length === 0) {
    throw new Error("Marcas não encontradas.");
  }

  const carPromises = targetBrands.map(async (brand) => {
    try {
      const models = await fipeRequest(`/cars/brands/${brand.code}/models`);
      if (!models || models.length === 0) return null;
      const randomModel = models[Math.floor(Math.random() * models.length)];

      const years = await fipeRequest(`/cars/brands/${brand.code}/models/${randomModel.code}/years`);
      if (!years || years.length === 0) return null;
      const randomYear = years[Math.floor(Math.random() * years.length)];

      const details = await fipeRequest(
        `/cars/brands/${brand.code}/models/${randomModel.code}/years/${randomYear.code}`
      );

      const price = parseFloat(details.price.replace(/[^0-9,]/g, "").replace(",", "."));

      return {
        name: details.model,
        price: isNaN(price) ? 50000 : price,
        description: `Código FIPE: ${details.codeFipe}. Ano ${details.modelYear}, combustível: ${details.fuel}.`,
        category: details.brand,
        stock: Math.floor(Math.random() * 5) + 1,
      };
    } catch (e) {
      return null;
    }
  });

  const results = await Promise.all(carPromises);
  const validCars = results.filter((car): car is AIProduct => car !== null);

  if (validCars.length === 0) {
    throw new Error("No FIPE data found.");
  }

  return validCars.slice(0, 4);
};
