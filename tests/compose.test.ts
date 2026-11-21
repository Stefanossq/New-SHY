import { describe, expect, it } from 'vitest';
import { APP_LIST, envFor } from '../shared/catalog';
import { compose, slugify, type ComposeInput } from '../shared/compose';
import { placeholderSvg, sampleBrand, sampleProducts } from '../shared/content';
import { loadTemplateSource } from '../scripts/templateSource';
import { TEMPLATE_SOURCE } from '../src/lib/templates';

const source = loadTemplateSource();

const inputFor = (app: ComposeInput['app'], features: ComposeInput['features']): ComposeInput => {
  const brand = sampleBrand({ app, businessName: 'Café do Sul', purpose: 'Loja de cafés especiais do Rio Grande do Sul.' });
  const products = sampleProducts();
  return {
    app,
    features,
    slug: 'cafe-do-sul',
    brand,
    products,
    productImages: products.map((p) => ({ ext: 'svg', content: placeholderSvg(p.name, brand.accentColor) })),
    contentSource: 'sample',
    generatorVersion: 'test',
  };
};

describe('fonte dos templates', () => {
  it('o build (Vite) e o disco enxergam exatamente os mesmos arquivos', () => {
    expect(Object.keys(TEMPLATE_SOURCE).sort()).toEqual(Object.keys(source).sort());
    expect(TEMPLATE_SOURCE['_shared/src/app/favicon.ico']).toEqual(source['_shared/src/app/favicon.ico']);
  });
});

describe.each(APP_LIST.flatMap((app) => [[app.id, []], [app.id, ['payments']]] as const))('compose(%s, %j)', (app, features) => {
  const files = compose(inputFor(app, [...features]), source);
  const pkg = JSON.parse(files['package.json'] as string);
  const payments = (features as readonly string[]).includes('payments');

  it('não vaza pastas internas dos templates', () => {
    expect(Object.keys(files).some((p) => p.startsWith('_') || p.includes('_features') || p.includes('_shared'))).toBe(false);
  });

  it('gera os arquivos base do projeto', () => {
    for (const path of ['package.json', 'README.md', '.gitignore', '.env.local.example', 'tsconfig.json', 'src/lib/site.ts', 'convex/schema.ts', 'convex/authz.ts', 'src/middleware.ts']) {
      expect(files, path).toHaveProperty([path]);
    }
    expect(pkg.name).toBe('cafe-do-sul');
  });

  it('inclui o módulo de pagamentos somente quando escolhido', () => {
    expect(Boolean(pkg.dependencies.stripe)).toBe(payments);
    expect('convex/stripe.ts' in files).toBe(payments);
    expect('convex/http.ts' in files).toBe(payments);
    expect(files['src/lib/site.ts']).toContain(`payments: ${payments}`);
  });

  it('documenta todas as variáveis de ambiente necessárias', () => {
    const readme = files['README.md'] as string;
    for (const v of envFor(app, [...features])) expect(readme).toContain(v.name);
  });

  it('não contém mais o checkout falso com número de cartão', () => {
    const all = Object.values(files).filter((c): c is string => typeof c === 'string').join('\n');
    expect(all).not.toMatch(/luhn|cardNumber|cvc/i);
  });
});

describe('loja', () => {
  it('grava o catálogo e as imagens referenciadas', () => {
    const files = compose(inputFor('store', []), source);
    const seed = files['convex/seedData.ts'] as string;
    expect(seed).toContain('Produto de exemplo 1');
    for (let i = 1; i <= 4; i++) {
      expect(files).toHaveProperty([`public/images/product-${i}.svg`]);
      expect(seed).toContain(`/images/product-${i}.svg`);
    }
  });
});

describe('slugify', () => {
  it('normaliza acentos e símbolos', () => {
    expect(slugify('Café & Cia. São João!', 'x')).toBe('cafe-cia-sao-joao');
    expect(slugify('***', 'fallback')).toBe('fallback');
  });
});
