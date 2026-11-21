/**
 * Modelos de IA usados pelo gerador. Um único lugar para trocar de modelo.
 * O servidor aceita sobrescrever via variáveis GEMINI_MODEL e GEMINI_IMAGE_MODEL.
 * Referência: https://ai.google.dev/gemini-api/docs/models
 */
export const DEFAULT_TEXT_MODEL = 'gemini-3.8-flash';
export const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';

/** Limites de entrada aceitos pelo gerador (protegem custo e prompt). */
export const LIMITS = {
  businessName: 60,
  purpose: 600,
  products: 6,
} as const;
