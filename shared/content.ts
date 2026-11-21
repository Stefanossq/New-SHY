/**
 * Conteúdo gerado pela IA: identidade (nome, paleta, textos) e catálogo (produtos e campos próprios).
 * Aqui ficam os tipos, os schemas enviados à Gemini, os prompts, a validação com zod e os dados
 * de exemplo usados quando não há IA. Servidor web, app desktop e CLI usam exatamente este código.
 *
 * A validação é determinística: se a resposta da IA não passa, `generateValidated` devolve os erros
 * para a IA e tenta de novo; se continuar errada, quem chamou recebe o erro e usa dados de exemplo.
 */
import { z } from 'zod';
import { AppId, APPS } from './catalog';
import { LIMITS } from './config';

/* ————————————————————————— tipos ————————————————————————— */

export interface Palette {
  /** Fundo da página (escuro). */
  background: string;
  /** Fundo de cartões, campos e cabeçalho. */
  surface: string;
  /** Texto principal. */
  text: string;
  /** Texto secundário. */
  muted: string;
  /** Cor de destaque (botões, links). */
  accent: string;
  /** Texto sobre a cor de destaque. */
  accentText: string;
}

export interface SiteCopy {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  aboutTitle: string;
  aboutText: string;
}

export interface Brand {
  name: string;
  tagline: string;
  description: string;
  palette: Palette;
  copy: SiteCopy;
}

/** Campo extra do produto, escolhido pela IA conforme o negócio (ex.: "Torra", "Peso"). */
export interface ProductField {
  key: string;
  label: string;
  type: 'text' | 'number';
  unit?: string;
}

export interface Product {
  name: string;
  /** Preço em reais. */
  price: number;
  description: string;
  category: string;
  stock: number;
  /** Valores dos campos extras, pela chave do campo. */
  attributes: Record<string, string | number>;
}

export interface Catalog {
  fields: ProductField[];
  products: Product[];
}

export interface GenerationRequest {
  app: AppId;
  businessName: string;
  purpose: string;
}

/** Erro causado pela entrada do usuário (vira HTTP 400 no servidor). */
export class InputError extends Error {}

/** Resposta da IA fora do formato. `issues` vai de volta para a IA na nova tentativa. */
export class AiValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Resposta da IA inválida: ${issues.slice(0, 4).join('; ')}`);
  }
}

/* ————————————————————————— cores ————————————————————————— */

const HEX = /^#[0-9a-fA-F]{6}$/;

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Razão de contraste WCAG entre duas cores #RRGGBB (1 a 21). */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Regras de legibilidade que toda paleta precisa cumprir (os templates são de tema escuro). */
export const PALETTE_RULES: { a: keyof Palette; b: keyof Palette; min: number; label: string }[] = [
  { a: 'text', b: 'background', min: 7, label: 'texto sobre o fundo' },
  { a: 'text', b: 'surface', min: 4.5, label: 'texto sobre os cartões' },
  { a: 'muted', b: 'background', min: 4.5, label: 'texto secundário sobre o fundo' },
  { a: 'accentText', b: 'accent', min: 4.5, label: 'texto do botão sobre o destaque' },
  { a: 'accent', b: 'background', min: 3, label: 'destaque sobre o fundo' },
];
const MAX_BACKGROUND_LUMINANCE = 0.06;

/* ————————————————————————— schemas zod ————————————————————————— */

const clean = (value: string, max: number) => value.replace(/\s+/g, ' ').trim().slice(0, max);

const text = (max: number) =>
  z
    .string({ error: 'precisa ser texto' })
    .transform((s) => clean(s, max))
    .pipe(z.string().min(1, 'não pode ficar vazio'));

const hex = z
  .string({ error: 'precisa ser uma cor' })
  .trim()
  .regex(HEX, 'use o formato #RRGGBB')
  .transform((s) => s.toLowerCase());

export const PaletteSchema = z
  .object({ background: hex, surface: hex, text: hex, muted: hex, accent: hex, accentText: hex })
  .superRefine((p, ctx) => {
    if (luminance(p.background) > MAX_BACKGROUND_LUMINANCE) {
      ctx.addIssue({ code: 'custom', path: ['background'], message: 'o fundo precisa ser escuro (os templates são de tema escuro)' });
    }
    for (const rule of PALETTE_RULES) {
      const ratio = contrast(p[rule.a], p[rule.b]);
      if (ratio < rule.min) {
        ctx.addIssue({
          code: 'custom',
          path: [rule.a],
          message: `contraste de ${rule.label} é ${ratio.toFixed(1)}:1, precisa de pelo menos ${rule.min}:1`,
        });
      }
    }
  });

export const CopySchema = z.object({
  heroTitle: text(60),
  heroSubtitle: text(160),
  ctaLabel: text(24),
  aboutTitle: text(50),
  aboutText: text(360),
});

export const BrandSchema = z.object({
  name: text(40),
  tagline: text(80),
  description: text(200),
  palette: PaletteSchema,
  copy: CopySchema,
});

export const ProductFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-zA-Z0-9]{1,23}$/, 'use camelCase sem acentos, ex.: "pesoGramas"'),
  label: text(30),
  type: z.enum(['text', 'number'], { error: 'use "text" ou "number"' }),
  unit: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? clean(s, 12) : undefined)),
});

const RawProductSchema = z.object({
  name: text(80),
  price: z.coerce.number({ error: 'precisa ser número' }).positive('precisa ser maior que zero').transform((n) => Math.round(n * 100) / 100),
  description: text(300),
  category: text(40),
  stock: z.coerce
    .number()
    .catch(10)
    .transform((n) => (Number.isFinite(n) && n >= 1 ? Math.min(Math.trunc(n), 100) : 10)),
  attributes: z.array(z.object({ key: z.string(), value: z.union([z.string(), z.number()]) })).default([]),
});

export const CatalogSchema = z
  .object({
    fields: z.array(ProductFieldSchema).max(3, 'no máximo 3 campos extras').default([]),
    products: z.array(RawProductSchema).min(1, 'gere pelo menos um produto'),
  })
  .superRefine((c, ctx) => {
    const keys = c.fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', path: ['fields'], message: 'chaves de campo repetidas' });
    c.products.forEach((p, i) => {
      const given = new Map(p.attributes.map((a) => [a.key, a.value]));
      for (const field of c.fields) {
        const value = given.get(field.key);
        const path = ['products', i, 'attributes', field.key];
        if (value === undefined || String(value).trim() === '') {
          ctx.addIssue({ code: 'custom', path, message: `falta o valor do campo "${field.key}"` });
        } else if (field.type === 'number' && !Number.isFinite(Number(String(value).replace(',', '.')))) {
          ctx.addIssue({ code: 'custom', path, message: `"${field.key}" precisa ser número` });
        }
      }
      for (const key of given.keys()) {
        if (!keys.includes(key)) ctx.addIssue({ code: 'custom', path: ['products', i, 'attributes'], message: `campo desconhecido "${key}"` });
      }
    });
  })
  .transform(
    (c): Catalog => ({
      fields: c.fields,
      products: c.products.slice(0, LIMITS.products).map(({ attributes, ...p }) => {
        const given = new Map(attributes.map((a) => [a.key, a.value]));
        return {
          ...p,
          attributes: Object.fromEntries(
            c.fields.map((f) => {
              const raw = String(given.get(f.key)).trim();
              return [f.key, f.type === 'number' ? Number(raw.replace(',', '.')) : clean(raw, 60)];
            }),
          ),
        };
      }),
    }),
  );

const toIssues = (error: z.ZodError): string[] =>
  error.issues.slice(0, 12).map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message));

/* ————————————————————————— validação das respostas ————————————————————————— */

export const parseBrand = (value: unknown, req: GenerationRequest): Brand => {
  const input = value && typeof value === 'object' && req.businessName ? { ...value, name: req.businessName } : value;
  const result = BrandSchema.safeParse(input);
  if (!result.success) throw new AiValidationError(toIssues(result.error));
  return result.data;
};

export const parseCatalog = (value: unknown): Catalog => {
  const result = CatalogSchema.safeParse(value);
  if (!result.success) throw new AiValidationError(toIssues(result.error));
  return result.data;
};

/* ————————————————————————— geração com nova tentativa ————————————————————————— */

/** Falhas passageiras do provedor (sobrecarga, limite, rede): vale tentar de novo. */
export const isTransientError = (err: unknown): boolean =>
  /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
    err instanceof Error ? err.message : String(err),
  );

export const retryPrompt = (prompt: string, issues: string[]): string =>
  `${prompt}\n\nSua resposta anterior foi rejeitada pela validação. Corrija estes pontos e responda de novo, completa:\n${issues
    .map((i) => `- ${i}`)
    .join('\n')}`;

export interface ValidatedCall<T> {
  prompt: string;
  /** Chama o modelo e devolve o JSON já convertido. */
  call: (prompt: string) => Promise<unknown>;
  parse: (raw: unknown) => T;
  attempts?: number;
  wait?: (ms: number) => Promise<void>;
  onRetry?: (attempt: number, reason: string) => void;
}

/** Chama a IA, valida com zod e tenta de novo (com os erros no prompt) até `attempts` vezes. */
export const generateValidated = async <T>({
  prompt,
  call,
  parse,
  attempts = 3,
  wait = (ms) => new Promise((r) => setTimeout(r, ms)),
  onRetry,
}: ValidatedCall<T>): Promise<T> => {
  let current = prompt;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return parse(await call(current));
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      if (err instanceof AiValidationError) {
        current = retryPrompt(prompt, err.issues);
        onRetry?.(attempt, err.message);
      } else if (isTransientError(err)) {
        onRetry?.(attempt, err instanceof Error ? err.message : String(err));
        await wait(1500 * attempt);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

/** Converte o texto da IA em JSON; texto inválido conta como resposta inválida (e gera nova tentativa). */
export const parseModelJson = (text: string | undefined | null): unknown => {
  const trimmed = text?.trim();
  if (!trimmed) throw new AiValidationError(['a resposta veio vazia']);
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new AiValidationError(['a resposta não é um JSON válido']);
  }
};

/* ————————————————————————— schemas da Gemini ————————————————————————— */

/** Schema no formato da API Gemini (aceito tanto pelo SDK quanto pela API REST). */
export type GeminiSchema = Record<string, unknown>;

const color = (description: string) => ({ type: 'STRING', description: `${description} Hexadecimal #RRGGBB.` });

export const BRAND_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', description: 'Nome curto da marca (até 40 caracteres).' },
    tagline: { type: 'STRING', description: 'Slogan de uma frase (até 80 caracteres).' },
    description: { type: 'STRING', description: 'Descrição do site em 1 ou 2 frases, para SEO.' },
    palette: {
      type: 'OBJECT',
      properties: {
        background: color('Fundo da página, bem escuro.'),
        surface: color('Fundo de cartões e campos, um pouco mais claro que o fundo.'),
        text: color('Texto principal, claro.'),
        muted: color('Texto secundário.'),
        accent: color('Cor de destaque da marca (botões e links).'),
        accentText: color('Texto sobre a cor de destaque.'),
      },
      required: ['background', 'surface', 'text', 'muted', 'accent', 'accentText'],
    },
    copy: {
      type: 'OBJECT',
      properties: {
        heroTitle: { type: 'STRING', description: 'Título principal da página inicial (até 60 caracteres).' },
        heroSubtitle: { type: 'STRING', description: 'Subtítulo da página inicial, 1 frase (até 160 caracteres).' },
        ctaLabel: { type: 'STRING', description: 'Texto do botão principal (até 24 caracteres).' },
        aboutTitle: { type: 'STRING', description: 'Título da seção "sobre" (até 50 caracteres).' },
        aboutText: { type: 'STRING', description: 'Texto da seção "sobre", 2 ou 3 frases (até 360 caracteres).' },
      },
      required: ['heroTitle', 'heroSubtitle', 'ctaLabel', 'aboutTitle', 'aboutText'],
    },
  },
  required: ['name', 'tagline', 'description', 'palette', 'copy'],
};

export const CATALOG_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    fields: {
      type: 'ARRAY',
      description: 'De 0 a 3 campos extras do produto que fazem sentido para este negócio.',
      items: {
        type: 'OBJECT',
        properties: {
          key: { type: 'STRING', description: 'Chave em camelCase sem acentos, ex.: pesoGramas.' },
          label: { type: 'STRING', description: 'Rótulo mostrado no site, em português com acentos, ex.: Ano de publicação.' },
          type: { type: 'STRING', enum: ['text', 'number'] },
          unit: { type: 'STRING', description: 'Unidade opcional para campos numéricos, ex.: g.' },
        },
        required: ['key', 'label', 'type'],
      },
    },
    products: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: 'Nome do produto.' },
          price: { type: 'NUMBER', description: 'Preço em reais (BRL), maior que zero.' },
          description: { type: 'STRING', description: 'Descrição comercial de 1 a 2 frases.' },
          category: { type: 'STRING', description: 'Categoria do produto.' },
          stock: { type: 'INTEGER', description: 'Quantidade em estoque, entre 1 e 100.' },
          attributes: {
            type: 'ARRAY',
            description: 'Um item para cada campo extra definido em "fields".',
            items: {
              type: 'OBJECT',
              properties: { key: { type: 'STRING' }, value: { type: 'STRING' } },
              required: ['key', 'value'],
            },
          },
        },
        required: ['name', 'price', 'description', 'category', 'stock', 'attributes'],
      },
    },
  },
  required: ['fields', 'products'],
};

/* ————————————————————————— prompts ————————————————————————— */

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
    'Paleta: tema escuro (fundo quase preto, levemente tingido pela cor da marca), texto claro, destaque com a personalidade do negócio.',
    `Contrastes mínimos: ${PALETTE_RULES.map((r) => `${r.label} ${r.min}:1`).join(', ')}.`,
    'Textos do site: título e subtítulo da página inicial, botão principal e uma seção "sobre", todos específicos para este negócio.',
    'Escreva em português do Brasil. Não use emojis.',
  ].join('\n');
};

export const catalogPrompt = (req: GenerationRequest, count = 4): string =>
  [
    `Gere ${count} produtos originais e realistas para a loja descrita abaixo.`,
    `Descrição da loja: """${req.purpose}"""`,
    'Defina também de 0 a 3 campos extras que um cliente dessa loja quer ver em cada produto',
    '(ex.: café → "Torra" e "Peso" em g; roupas → "Tecido"; vinhos → "Uva" e "Safra"). Não repita nome, preço, categoria ou estoque.',
    'A chave (key) é camelCase sem acentos; o rótulo (label) é português normal, com acentos.',
    'Em cada produto, preencha "attributes" com um item {key, value} para cada campo extra.',
    'Preços realistas em reais, descrições curtas e persuasivas, categorias coerentes. Português do Brasil, sem emojis.',
  ].join('\n');

export const productImagePrompt = (product: Product, brand: Brand): string =>
  `Foto de estúdio de produto para e-commerce: "${product.name}" (${product.category}). ` +
  `Fundo limpo e neutro, iluminação suave, sem texto, sem logotipos, sem pessoas. Estilo coerente com a marca "${brand.name}".`;

/* ————————————————————————— dados de exemplo ————————————————————————— */

export const DEFAULT_PALETTE: Record<AppId, Palette> = {
  store: { background: '#0b0b0c', surface: '#17171a', text: '#f5f5f5', muted: '#a3a3a3', accent: '#f5f5f5', accentText: '#0b0b0c' },
  blog: { background: '#080d09', surface: '#111a13', text: '#e8f5e9', muted: '#9bb59f', accent: '#22c55e', accentText: '#04130a' },
  travel: { background: '#07111a', surface: '#0f1c28', text: '#e6f1fb', muted: '#93a9bd', accent: '#38bdf8', accentText: '#04121c' },
};

/** Marca de exemplo, usada quando a IA está desligada ou indisponível. */
export const sampleBrand = (req: GenerationRequest): Brand => {
  const app = APPS[req.app];
  const name = req.businessName || { store: 'Minha Loja', blog: 'Meu Blog', travel: 'Meu Roteiro' }[req.app];
  return {
    name,
    tagline: app.tagline,
    description: clean(req.purpose, 200),
    palette: DEFAULT_PALETTE[req.app],
    copy: {
      heroTitle: name,
      heroSubtitle: app.tagline,
      ctaLabel: { store: 'Ver produtos', blog: 'Ler posts', travel: 'Planejar viagem' }[req.app],
      aboutTitle: 'Sobre',
      aboutText: clean(req.purpose, 360),
    },
  };
};

/** Catálogo de exemplo, claramente genérico, para quando não há IA. */
export const sampleCatalog = (): Catalog => ({
  fields: [],
  products: [49.9, 89.9, 129.9, 199.9].map((price, i) => ({
    name: `Produto de exemplo ${i + 1}`,
    price,
    description: 'Edite este produto no painel admin.',
    category: 'Exemplo',
    stock: 10,
    attributes: {},
  })),
});

/** Imagem SVG de placeholder (honesta: diz que é um placeholder). */
export const placeholderSvg = (label: string, accent: string, background = '#111827'): string => {
  const safe = label.replace(/[<>&"']/g, '').slice(0, 40);
  const color = HEX.test(accent) ? accent : '#9ca3af';
  const bg = HEX.test(background) ? background : '#111827';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${bg}"/>
  <rect x="200" y="170" width="200" height="200" rx="24" fill="none" stroke="${color}" stroke-width="6"/>
  <text x="300" y="440" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#f3f4f6">${safe}</text>
  <text x="300" y="480" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#9ca3af">imagem provisória</text>
</svg>
`;
};
