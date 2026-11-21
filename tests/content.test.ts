import { describe, expect, it } from 'vitest';
import {
  AiValidationError,
  DEFAULT_PALETTE,
  InputError,
  PaletteSchema,
  contrast,
  generateValidated,
  normalizeRequest,
  parseBrand,
  parseCatalog,
  parseModelJson,
  placeholderSvg,
  sampleBrand,
} from '../shared/content';
import { buildTree } from '../src/lib/fileTree';

const req = { app: 'store' as const, businessName: '', purpose: 'Loja de cafés especiais.' };

const goodBrand = () => ({
  name: 'Torra Sul',
  tagline: 'Café especial do Sul',
  description: 'Cafés especiais torrados na hora.',
  palette: { background: '#120d0a', surface: '#1f1712', text: '#f6ede4', muted: '#c2b2a3', accent: '#e58e26', accentText: '#140b02' },
  copy: { heroTitle: 'Café de verdade', heroSubtitle: 'Torrado na semana.', ctaLabel: 'Comprar', aboutTitle: 'Sobre', aboutText: 'Somos do Sul.' },
});

describe('normalizeRequest', () => {
  it('rejeita propósito curto e app desconhecido', () => {
    expect(() => normalizeRequest({ ...req, purpose: 'curto' })).toThrow(InputError);
    expect(() => normalizeRequest({ ...req, app: 'xyz' as never })).toThrow(InputError);
  });
  it('limita o tamanho da entrada', () => {
    const r = normalizeRequest({ ...req, purpose: 'a'.repeat(5000), businessName: 'b'.repeat(500) });
    expect(r.purpose.length).toBe(600);
    expect(r.businessName.length).toBe(60);
  });
});

describe('parseBrand', () => {
  it('aceita uma resposta completa e usa o nome informado pelo cliente', () => {
    const brand = parseBrand(goodBrand(), { ...req, businessName: 'Café do Sul' });
    expect(brand.name).toBe('Café do Sul');
    expect(brand.palette.accent).toBe('#e58e26');
    expect(brand.copy.ctaLabel).toBe('Comprar');
  });
  it('rejeita cor fora do formato, apontando o campo', () => {
    const bad = goodBrand();
    bad.palette.accent = 'laranja';
    const err = (() => { try { parseBrand(bad, req); } catch (e) { return e; } })() as AiValidationError;
    expect(err).toBeInstanceOf(AiValidationError);
    expect(err.issues.join()).toContain('palette.accent');
  });
  const issuesOf = (palette: Partial<ReturnType<typeof goodBrand>['palette']>) => {
    const brand = goodBrand();
    Object.assign(brand.palette, palette);
    try {
      parseBrand(brand, req);
      return '';
    } catch (e) {
      return (e as AiValidationError).issues.join('\n');
    }
  };
  it('rejeita paleta ilegível (texto escuro sobre fundo escuro)', () => {
    expect(issuesOf({ text: '#3a2f28' })).toMatch(/contraste de texto sobre o fundo é 1\.\d:1/);
  });
  it('rejeita fundo claro (os templates são de tema escuro)', () => {
    expect(issuesOf({ background: '#ffffff', text: '#111111' })).toContain('fundo precisa ser escuro');
  });
  it('rejeita textos faltando', () => {
    const bad = goodBrand() as any;
    delete bad.copy.heroTitle;
    expect(() => parseBrand(bad, req)).toThrow(AiValidationError);
  });
});

describe('paletas padrão', () => {
  it.each(Object.entries(DEFAULT_PALETTE))('%s passa nas regras de contraste', (_, palette) => {
    expect(PaletteSchema.safeParse(palette).success).toBe(true);
  });
  it('contraste segue a fórmula WCAG', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#777777')).toBe(1);
  });
  it('dados de exemplo também são válidos', () => {
    expect(() => parseBrand(sampleBrand(req), req)).not.toThrow();
  });
});

describe('parseCatalog', () => {
  const product = (attributes: { key: string; value: string }[]) => ({ name: 'Café', price: '39,9'.replace(',', '.'), description: 'Bom', category: 'Grãos', stock: -3, attributes });
  it('converte os campos extras e corrige estoque', () => {
    const c = parseCatalog({
      fields: [{ key: 'pesoGramas', label: 'Peso', type: 'number', unit: 'g' }, { key: 'torra', label: 'Torra', type: 'text', unit: '' }],
      products: [product([{ key: 'pesoGramas', value: '250' }, { key: 'torra', value: 'Média' }])],
    });
    expect(c.fields[1].unit).toBeUndefined();
    expect(c.products[0]).toMatchObject({ price: 39.9, stock: 10, attributes: { pesoGramas: 250, torra: 'Média' } });
  });
  it('rejeita valor faltando, número inválido e campo desconhecido', () => {
    const run = (attributes: { key: string; value: string }[]) => {
      try {
        parseCatalog({ fields: [{ key: 'pesoGramas', label: 'Peso', type: 'number' }], products: [product(attributes)] });
        return '';
      } catch (e) {
        return (e as AiValidationError).issues.join();
      }
    };
    expect(run([])).toContain('falta o valor do campo "pesoGramas"');
    expect(run([{ key: 'pesoGramas', value: 'muito' }])).toContain('precisa ser número');
    expect(run([{ key: 'pesoGramas', value: '1' }, { key: 'cor', value: 'azul' }])).toContain('campo desconhecido "cor"');
  });
  it('rejeita chave fora do padrão e lista vazia', () => {
    expect(() => parseCatalog({ fields: [{ key: 'Peso (g)', label: 'Peso', type: 'number' }], products: [product([])] })).toThrow(AiValidationError);
    expect(() => parseCatalog({ fields: [], products: [] })).toThrow(AiValidationError);
  });
});

describe('generateValidated', () => {
  const noWait = () => Promise.resolve();
  it('devolve os erros para a IA e aceita a resposta corrigida', async () => {
    const prompts: string[] = [];
    const answers = [{ ...goodBrand(), palette: { ...goodBrand().palette, accent: 'laranja' } }, goodBrand()];
    const brand = await generateValidated({
      prompt: 'P',
      call: async (p) => { prompts.push(p); return answers.shift(); },
      parse: (raw) => parseBrand(raw, req),
      wait: noWait,
    });
    expect(brand.palette.accent).toBe('#e58e26');
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain('foi rejeitada');
    expect(prompts[1]).toContain('palette.accent');
  });
  it('tenta de novo em falha passageira (503) e desiste após o limite', async () => {
    let calls = 0;
    await expect(
      generateValidated({ prompt: 'P', call: async () => { calls++; throw new Error('Gemini HTTP 503: high demand'); }, parse: (r) => r, wait: noWait }),
    ).rejects.toThrow('503');
    expect(calls).toBe(3);
  });
  it('não insiste em erro permanente (chave inválida)', async () => {
    let calls = 0;
    await expect(
      generateValidated({ prompt: 'P', call: async () => { calls++; throw new Error('Gemini HTTP 400: API key not valid'); }, parse: (r) => r, wait: noWait }),
    ).rejects.toThrow('400');
    expect(calls).toBe(1);
  });
  it('JSON quebrado conta como resposta inválida', () => {
    expect(() => parseModelJson('{"a":')).toThrow(AiValidationError);
    expect(() => parseModelJson('')).toThrow(AiValidationError);
    expect(parseModelJson(' {"a":1} ')).toEqual({ a: 1 });
  });
});

describe('placeholderSvg', () => {
  it('não permite injetar marcação', () => {
    const svg = placeholderSvg('<script>alert(1)</script>', '#fff"/><script>');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('imagem provisória');
  });
});

describe('buildTree', () => {
  it('monta pastas aninhadas com pastas antes dos arquivos', () => {
    const tree = buildTree(['README.md', 'src/app/page.tsx', 'src/app/layout.tsx', 'src/lib/site.ts', 'convex/schema.ts']);
    expect(tree.map((n) => n.name)).toEqual(['convex', 'src', 'README.md']);
    const src = tree.find((n) => n.name === 'src')!;
    expect(src.children!.map((n) => n.name)).toEqual(['app', 'lib']);
    expect(src.children![0].children!.map((n) => n.name)).toEqual(['layout.tsx', 'page.tsx']);
  });
});
