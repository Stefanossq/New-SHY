/**
 * Chamadas à Gemini feitas pelo servidor web (a chave nunca vai para o navegador).
 * Os prompts e schemas vêm de shared/content.ts, os mesmos usados pelo app desktop.
 */
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL } from '../shared/config';
import {
  BRAND_SCHEMA,
  Brand,
  GenerationRequest,
  PRODUCTS_SCHEMA,
  Product,
  brandPrompt,
  parseBrand,
  parseProducts,
  productImagePrompt,
  productsPrompt,
} from '../shared/content';
import type { GeneratedImage } from '../shared/api';

export const textModel = () => process.env.GEMINI_MODEL || DEFAULT_TEXT_MODEL;
export const imageModel = () => process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
export const hasKey = () => Boolean(process.env.GEMINI_API_KEY);
export const imagesEnabled = () => hasKey() && process.env.GENERATE_IMAGES !== '0';

let client: GoogleGenAI | null = null;
const ai = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const generateJson = async (prompt: string, schema: Record<string, unknown>): Promise<unknown> => {
  const response = await ai().models.generateContent({
    model: textModel(),
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: schema },
  });
  const text = response.text?.trim();
  if (!text) throw new Error('A IA retornou uma resposta vazia.');
  return JSON.parse(text);
};

export const generateBrand = async (req: GenerationRequest): Promise<Brand> =>
  parseBrand(await generateJson(brandPrompt(req), BRAND_SCHEMA), req);

export const generateProducts = async (req: GenerationRequest): Promise<Product[]> =>
  parseProducts(await generateJson(productsPrompt(req), PRODUCTS_SCHEMA));

export const generateImage = async (product: Product, brand: Brand): Promise<GeneratedImage> => {
  const response = await ai().models.generateContent({
    model: imageModel(),
    contents: productImagePrompt(product, brand),
    config: { responseModalities: ['IMAGE'] },
  });
  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error('A IA não retornou imagem.');
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType ?? 'image/png' };
};
