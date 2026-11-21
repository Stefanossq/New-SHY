/**
 * Cliente mínimo da API Gemini (REST, só `fetch`). Usado pelo servidor web e pela CLI;
 * o app desktop faz a mesma chamada em Rust. Toda resposta de texto passa por
 * `generateValidated` (zod + nova tentativa) em shared/content.ts.
 */
import {
  BRAND_SCHEMA,
  CATALOG_SCHEMA,
  brandPrompt,
  catalogPrompt,
  generateValidated,
  parseBrand,
  parseCatalog,
  parseModelJson,
  productImagePrompt,
  type Brand,
  type Catalog,
  type GeminiSchema,
  type GenerationRequest,
  type Product,
} from './content';
import type { GeneratedImage } from './api';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiOptions {
  apiKey: string;
  textModel: string;
  imageModel: string;
  onRetry?: (attempt: number, reason: string) => void;
}

/** Mensagem curta e legível em vez do JSON cru do Google. */
const errorMessage = (status: number, body: string): string => {
  let message = body;
  try {
    message = JSON.parse(body)?.error?.message ?? body;
  } catch {
    /* corpo não é JSON */
  }
  return `Gemini HTTP ${status}: ${String(message).slice(0, 300)}`;
};

const callModel = async (opts: GeminiOptions, model: string, body: unknown): Promise<any> => {
  const res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, text));
  return JSON.parse(text);
};

const firstText = (resp: any): string | undefined =>
  resp?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') || undefined;

export const geminiJson = async (opts: GeminiOptions, prompt: string, schema: GeminiSchema): Promise<unknown> =>
  parseModelJson(
    firstText(
      await callModel(opts, opts.textModel, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
      }),
    ),
  );

export const generateBrand = (opts: GeminiOptions, req: GenerationRequest): Promise<Brand> =>
  generateValidated({
    prompt: brandPrompt(req),
    call: (prompt) => geminiJson(opts, prompt, BRAND_SCHEMA),
    parse: (raw) => parseBrand(raw, req),
    onRetry: opts.onRetry,
  });

export const generateCatalog = (opts: GeminiOptions, req: GenerationRequest): Promise<Catalog> =>
  generateValidated({
    prompt: catalogPrompt(req),
    call: (prompt) => geminiJson(opts, prompt, CATALOG_SCHEMA),
    parse: parseCatalog,
    onRetry: opts.onRetry,
  });

export const generateImage = async (opts: GeminiOptions, product: Product, brand: Brand): Promise<GeneratedImage> => {
  const resp = await callModel(opts, opts.imageModel, {
    contents: [{ parts: [{ text: productImagePrompt(product, brand) }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  const part = resp?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
  if (!part) throw new Error('A IA não retornou imagem.');
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType ?? 'image/png' };
};
