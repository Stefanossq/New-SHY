/**
 * Chamadas à Gemini feitas pelo servidor web (a chave nunca vai para o navegador).
 * A implementação fica em shared/gemini.ts, a mesma usada pela CLI.
 */
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL } from '../shared/config';
import * as gemini from '../shared/gemini';
import type { Brand, GenerationRequest, Product } from '../shared/content';

export const textModel = () => process.env.GEMINI_MODEL || DEFAULT_TEXT_MODEL;
export const imageModel = () => process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
export const hasKey = () => Boolean(process.env.GEMINI_API_KEY);
export const imagesEnabled = () => hasKey() && process.env.GENERATE_IMAGES !== '0';

const options = (): gemini.GeminiOptions => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  return {
    apiKey: process.env.GEMINI_API_KEY,
    textModel: textModel(),
    imageModel: imageModel(),
    onRetry: (attempt, reason) => console.warn(`[gerador] tentativa ${attempt} falhou, tentando de novo: ${reason}`),
  };
};

export const generateBrand = (req: GenerationRequest) => gemini.generateBrand(options(), req);
export const generateCatalog = (req: GenerationRequest) => gemini.generateCatalog(options(), req);
export const generateImage = (product: Product, brand: Brand) => gemini.generateImage(options(), product, brand);
