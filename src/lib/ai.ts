/**
 * Acesso à IA a partir da interface.
 * - Web: chama o servidor do gerador (a chave fica no .env do servidor).
 * - Desktop: chama o backend Rust, que usa a chave guardada no cofre do Windows.
 * Prompts, schemas e validação são os mesmos nos dois casos (shared/content.ts).
 */
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL } from '../../shared/config';
import type { GeneratedImage, HealthResponse } from '../../shared/api';
import {
  BRAND_SCHEMA,
  PRODUCTS_SCHEMA,
  brandPrompt,
  parseBrand,
  parseProducts,
  productImagePrompt,
  productsPrompt,
  type Brand,
  type GenerationRequest,
  type Product,
} from '../../shared/content';
import { callDesktop, isDesktop } from './platform';

export interface AiStatus {
  available: boolean;
  images: boolean;
  textModel: string;
  /** Motivo quando a IA não está disponível. */
  reason?: string;
}

const post = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
  return data as T;
};

export const getAiStatus = async (): Promise<AiStatus> => {
  if (isDesktop()) {
    try {
      const has = await callDesktop<boolean>('has_api_key');
      return has
        ? { available: true, images: true, textModel: DEFAULT_TEXT_MODEL }
        : { available: false, images: false, textModel: DEFAULT_TEXT_MODEL, reason: 'Nenhuma chave Gemini salva neste computador.' };
    } catch (err) {
      return { available: false, images: false, textModel: DEFAULT_TEXT_MODEL, reason: String(err) };
    }
  }
  try {
    const res = await fetch('/api/health');
    const health = (await res.json()) as HealthResponse;
    return health.ai
      ? { available: true, images: health.images, textModel: health.textModel }
      : { available: false, images: false, textModel: health.textModel, reason: 'O servidor não tem GEMINI_API_KEY configurada.' };
  } catch {
    return { available: false, images: false, textModel: DEFAULT_TEXT_MODEL, reason: 'Servidor do gerador indisponível.' };
  }
};

const desktopJson = (prompt: string, schema: Record<string, unknown>) =>
  callDesktop<unknown>('gemini_generate_json', { model: DEFAULT_TEXT_MODEL, prompt, schema });

export const aiBrand = async (req: GenerationRequest): Promise<Brand> =>
  isDesktop() ? parseBrand(await desktopJson(brandPrompt(req), BRAND_SCHEMA), req) : post<Brand>('/api/generate/brand', { request: req });

export const aiProducts = async (req: GenerationRequest): Promise<Product[]> =>
  isDesktop()
    ? parseProducts(await desktopJson(productsPrompt(req), PRODUCTS_SCHEMA))
    : parseProducts(await post<unknown>('/api/generate/products', { request: req }));

export const aiImage = async (product: Product, brand: Brand): Promise<GeneratedImage> =>
  isDesktop()
    ? callDesktop<GeneratedImage>('gemini_generate_image', { model: DEFAULT_IMAGE_MODEL, prompt: productImagePrompt(product, brand) })
    : post<GeneratedImage>('/api/generate/image', { product, brand });
