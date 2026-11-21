/**
 * Conteúdo gerado pela IA (marca e produtos): tipos, schemas JSON enviados à Gemini,
 * prompts, validação da resposta e dados de exemplo usados quando não há IA disponível.
 * Usado igualmente pelo servidor web e pelo app desktop, para que o comportamento seja o mesmo.
 */
import { AppId, APPS } from './catalog';
import { LIMITS } from './config';

export interface Brand {
  name: string;
  tagline: string;
  description: string;
  /** Cor de destaque em hexadecimal (#RRGGBB). */
  accentColor: string;
}

export interface Product {
  name: string;
  /** Preço em reais. */
  price: number;
  description: string;
  category: string;
  stock: number;
}

export interface GenerationRequest {
  app: AppId;
  businessName: string;
  purpose: string;
}

/** Schema no formato da API Gemini (aceito tanto pelo SDK quanto pela API REST). */
export type GeminiSchema = Record<string, unknown>;

export const BRAND_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', description: 'Nome curto da marca (até 40 caracteres).' },
    tagline: { type: 'STRING', description: 'Slogan de uma frase (até 80 caracteres).' },
    description: { type: 'STRING', description: 'Descrição do site em 1 ou 2 frases, para SEO.' },
    accentColor: { type: 'STRING', description: 'Cor de destaque em hexadecimal #RRGGBB, legível sobre fundo escuro.' },
  },
  required: ['name', 'tagline', 'description', 'accentColor'],
};

export const PRODUCTS_SCHEMA: GeminiSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING', description: 'Nome do produto.' },
      price: { type: 'NUMBER', description: 'Preço em reais (BRL), maior que zero.' },
      description: { type: 'STRING', description: 'Descrição comercial de 1 a 2 frases.' },
      category: { type: 'STRING', description: 'Categoria do produto.' },
      stock: { type: 'INTEGER', description: 'Quantidade em estoque, entre 1 e 100.' },
    },
    required: ['name', 'price', 'description', 'category', 'stock'],
  },
};

/** Erro causado pela entrada do usuário (vira HTTP 400 no servidor). */
export class InputError extends Error {}

const clean = (value: string, max: number) => value.replace(/\s+/g, ' ').trim().slice(0, max);

/** Normaliza e limita o que o usuário digitou antes de ir para o prompt. */
export const normalizeRequest = (req: GenerationRequest): GenerationRequest => {
  if (!req || !APPS[req.app]) throw new InputError(`App desconhecido: ${req?.app}`);
  const purpose = clean(String(req.purpose ?? ''), LIMITS.purpose);
  if (purpose.length < 10) throw new InputError('Descreva o propósito do app com pelo menos 10 caracteres.');
  return { app: req.app, businessName: clean(String(req.businessName ?? ''), LIMITS.businessName), purpose };
};

export const brandPrompt = (req: GenerationRequest): string => {
  const app = APPS[req.app];
  return [
    `Crie a identidade de um site do tipo "${app.name}" (${app.tagline}).`,
    `Propósito informado pelo cliente: """${req.purpose}"""`,
    req.businessName ? `O nome do negócio é "${req.businessName}"; use exatamente esse nome.` : 'Sugira um nome original e curto.',
    'Escreva em português do Brasil. Não use emojis.',
  ].join('\n');
};

export const productsPrompt = (req: GenerationRequest, count = 4): string =>
  [
    `Gere ${count} produtos originais e realistas para a loja descrita abaixo.`,
    `Descrição da loja: """${req.purpose}"""`,
    'Preços realistas em reais, descrições curtas e persuasivas, categorias coerentes. Português do Brasil, sem emojis.',
  ].join('\n');

export const productImagePrompt = (product: Product, brand: Brand): string =>
  `Foto de estúdio de produto para e-commerce: "${product.name}" (${product.category}). ` +
  `Fundo limpo e neutro, iluminação suave, sem texto, sem logotipos, sem pessoas. Estilo coerente com a marca "${brand.name}".`;

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Valida a resposta da IA. Lança erro se o formato não for o esperado. */
export const parseBrand = (value: unknown, req: GenerationRequest): Brand => {
  const v = value as Partial<Brand> | null;
  if (!v || typeof v !== 'object') throw new Error('Resposta de marca inválida.');
  const name = req.businessName || clean(String(v.name ?? ''), 40);
  const tagline = clean(String(v.tagline ?? ''), 80);
  const description = clean(String(v.description ?? ''), 200);
  if (!name || !tagline || !description) throw new Error('Resposta de marca incompleta.');
  const accentColor = HEX.test(String(v.accentColor)) ? String(v.accentColor).toLowerCase() : DEFAULT_ACCENT[req.app];
  return { name, tagline, description, accentColor };
};

export const parseProducts = (value: unknown): Product[] => {
  if (!Array.isArray(value)) throw new Error('Resposta de produtos não é uma lista.');
  const products = value
    .map((p): Product | null => {
      if (!p || typeof p !== 'object') return null;
      const name = clean(String(p.name ?? ''), 80);
      const description = clean(String(p.description ?? ''), 300);
      const category = clean(String(p.category ?? ''), 40) || 'Geral';
      const price = Math.round(Number(p.price) * 100) / 100;
      const stock = Math.trunc(Number(p.stock));
      if (!name || !description || !Number.isFinite(price) || price <= 0) return null;
      return { name, description, category, price, stock: Number.isFinite(stock) && stock > 0 ? Math.min(stock, 100) : 10 };
    })
    .filter((p): p is Product => p !== null)
    .slice(0, LIMITS.products);
  if (products.length === 0) throw new Error('A IA não retornou nenhum produto válido.');
  return products;
};

const DEFAULT_ACCENT: Record<AppId, string> = { store: '#f5f5f5', blog: '#22c55e', travel: '#38bdf8' };

/** Marca de exemplo, usada quando a IA está desligada ou indisponível. */
export const sampleBrand = (req: GenerationRequest): Brand => {
  const app = APPS[req.app];
  const name = req.businessName || { store: 'Minha Loja', blog: 'Meu Blog', travel: 'Meu Roteiro' }[req.app];
  return {
    name,
    tagline: app.tagline,
    description: clean(req.purpose, 200),
    accentColor: DEFAULT_ACCENT[req.app],
  };
};

/** Produtos de exemplo, claramente genéricos, para quando não há IA. */
export const sampleProducts = (): Product[] => [
  { name: 'Produto de exemplo 1', price: 49.9, description: 'Edite este produto no painel admin.', category: 'Exemplo', stock: 10 },
  { name: 'Produto de exemplo 2', price: 89.9, description: 'Edite este produto no painel admin.', category: 'Exemplo', stock: 10 },
  { name: 'Produto de exemplo 3', price: 129.9, description: 'Edite este produto no painel admin.', category: 'Exemplo', stock: 10 },
  { name: 'Produto de exemplo 4', price: 199.9, description: 'Edite este produto no painel admin.', category: 'Exemplo', stock: 10 },
];

/** Imagem SVG de placeholder (honesta: diz que é um placeholder). */
export const placeholderSvg = (label: string, accent: string): string => {
  const safe = label.replace(/[<>&"']/g, '').slice(0, 40);
  const color = HEX.test(accent) ? accent : '#9ca3af';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#111827"/>
  <rect x="200" y="170" width="200" height="200" rx="24" fill="none" stroke="${color}" stroke-width="6"/>
  <text x="300" y="440" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#f3f4f6">${safe}</text>
  <text x="300" y="480" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#9ca3af">imagem provisória</text>
</svg>
`;
};
