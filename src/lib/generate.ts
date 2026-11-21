/**
 * Fluxo de geração. Cada etapa reporta o que realmente está acontecendo;
 * quando a IA falha, a etapa vira aviso e o projeto usa dados de exemplo — nunca finge sucesso.
 */
import { APPS, type AppId, type FeatureId } from '../../shared/catalog';
import { compose, slugify, type FileMap, type ProductImage } from '../../shared/compose';
import { extFromMime } from '../../shared/api';
import {
  normalizeRequest,
  placeholderSvg,
  sampleBrand,
  sampleCatalog,
  type Brand,
  type Product,
  type ProductField,
} from '../../shared/content';
import { aiBrand, aiCatalog, aiImage, type AiStatus } from './ai';
import { TEMPLATE_SOURCE } from './templates';

export const GENERATOR_VERSION: string = __APP_VERSION__;

export interface WizardInput {
  app: AppId;
  businessName: string;
  purpose: string;
  features: FeatureId[];
  useAI: boolean;
}

export type StepStatus = 'pending' | 'running' | 'done' | 'warning' | 'skipped';
export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

export interface GenerationResult {
  files: FileMap;
  slug: string;
  brand: Brand;
  products: Product[];
  fields: ProductField[];
  images: { url: string; isPlaceholder: boolean }[];
  contentSource: 'ai' | 'sample';
  warnings: string[];
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const planSteps = (input: WizardInput, ai: AiStatus): Step[] => {
  const app = APPS[input.app];
  const useAI = input.useAI && ai.available;
  const steps: Step[] = [{ id: 'brand', label: useAI ? 'Criando nome, paleta e textos com IA' : 'Preparando identidade (dados de exemplo)', status: 'pending' }];
  if (app.generatesProducts) {
    steps.push({ id: 'products', label: useAI ? 'Gerando catálogo e campos dos produtos com IA' : 'Preparando produtos de exemplo', status: 'pending' });
    steps.push({ id: 'images', label: useAI && ai.images ? 'Gerando fotos dos produtos com IA' : 'Criando imagens provisórias', status: 'pending' });
  }
  steps.push({ id: 'compose', label: 'Montando o projeto (templates + recursos escolhidos)', status: 'pending' });
  return steps;
};

export const runGeneration = async (
  input: WizardInput,
  ai: AiStatus,
  onStep: (id: string, patch: Partial<Step>) => void,
): Promise<GenerationResult> => {
  const app = APPS[input.app];
  const request = normalizeRequest({ app: input.app, businessName: input.businessName, purpose: input.purpose });
  const useAI = input.useAI && ai.available;
  const warnings: string[] = [];
  let usedSample = !useAI;

  // 1. Marca
  onStep('brand', { status: 'running' });
  let brand = sampleBrand(request);
  if (useAI) {
    try {
      brand = await aiBrand(request);
      onStep('brand', { status: 'done', detail: `${brand.name} — ${brand.tagline}` });
    } catch (err) {
      usedSample = true;
      warnings.push(`Identidade: a IA falhou (${errorText(err)}); usei dados de exemplo.`);
      onStep('brand', { status: 'warning', detail: 'IA indisponível, usei dados de exemplo' });
    }
  } else {
    onStep('brand', { status: 'done', detail: brand.name });
  }

  // 2. Produtos e imagens (só loja)
  let products: Product[] = [];
  let fields: ProductField[] = [];
  const images: ProductImage[] = [];
  const previews: GenerationResult['images'] = [];
  if (app.generatesProducts) {
    onStep('products', { status: 'running' });
    ({ products, fields } = sampleCatalog());
    if (useAI) {
      try {
        ({ products, fields } = await aiCatalog(request));
        const extra = fields.length ? ` · campos: ${fields.map((f) => f.label).join(', ')}` : '';
        onStep('products', { status: 'done', detail: `${products.length} produtos${extra}` });
      } catch (err) {
        usedSample = true;
        warnings.push(`Produtos: a IA falhou (${errorText(err)}); usei produtos de exemplo.`);
        onStep('products', { status: 'warning', detail: 'IA indisponível, usei produtos de exemplo' });
      }
    } else {
      onStep('products', { status: 'done', detail: `${products.length} produtos de exemplo` });
    }

    onStep('images', { status: 'running' });
    let failed = 0;
    for (const [i, product] of products.entries()) {
      onStep('images', { detail: `Imagem ${i + 1} de ${products.length}` });
      if (useAI && ai.images) {
        try {
          const img = await aiImage(product, brand);
          images.push({ ext: extFromMime(img.mimeType), content: { base64: img.base64 } });
          previews.push({ url: `data:${img.mimeType};base64,${img.base64}`, isPlaceholder: false });
          continue;
        } catch (err) {
          failed++;
          if (failed === 1) warnings.push(`Imagens: a IA falhou (${errorText(err)}); usei imagens provisórias.`);
        }
      }
      const svg = placeholderSvg(product.name, brand.palette.accent, brand.palette.surface);
      images.push({ ext: 'svg', content: svg });
      previews.push({ url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, isPlaceholder: true });
    }
    const real = previews.filter((p) => !p.isPlaceholder).length;
    onStep('images', {
      status: useAI && ai.images && failed > 0 ? 'warning' : 'done',
      detail: real > 0 ? `${real} fotos geradas, ${previews.length - real} provisórias` : `${previews.length} imagens provisórias (substitua pelo painel admin)`,
    });
  }

  // 3. Composição
  onStep('compose', { status: 'running' });
  const slug = slugify(brand.name, app.defaultSlug);
  const files = compose(
    {
      app: input.app,
      features: input.features,
      slug,
      brand,
      products: app.generatesProducts ? products : undefined,
      productFields: app.generatesProducts ? fields : undefined,
      productImages: app.generatesProducts ? images : undefined,
      contentSource: usedSample ? 'sample' : 'ai',
      generatorVersion: GENERATOR_VERSION,
    },
    TEMPLATE_SOURCE,
  );
  onStep('compose', { status: 'done', detail: `${Object.keys(files).length} arquivos` });

  return { files, slug, brand, products, fields, images: previews, contentSource: usedSample ? 'sample' : 'ai', warnings };
};
