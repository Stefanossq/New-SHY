import { describe, expect, it } from 'vitest';
import { InputError, normalizeRequest, parseBrand, parseProducts, placeholderSvg } from '../shared/content';
import { buildTree } from '../src/lib/fileTree';

const req = { app: 'store' as const, businessName: '', purpose: 'Loja de cafés especiais.' };

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
  it('usa o nome informado pelo cliente e corrige cor inválida', () => {
    const brand = parseBrand({ name: 'Outro', tagline: 'Slogan', description: 'Desc', accentColor: 'vermelho' }, { ...req, businessName: 'Café do Sul' });
    expect(brand.name).toBe('Café do Sul');
    expect(brand.accentColor).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('falha em resposta incompleta', () => {
    expect(() => parseBrand({ name: 'X' }, req)).toThrow();
  });
});

describe('parseProducts', () => {
  it('descarta itens inválidos e corrige estoque', () => {
    const products = parseProducts([
      { name: 'Café', price: 39.9, description: 'Bom', category: 'Grãos', stock: -3 },
      { name: '', price: 10, description: 'sem nome', category: 'x', stock: 1 },
      { name: 'Grátis', price: 0, description: 'preço zero', category: 'x', stock: 1 },
    ]);
    expect(products).toHaveLength(1);
    expect(products[0].stock).toBe(10);
  });
  it('falha quando nada é válido', () => {
    expect(() => parseProducts([])).toThrow();
    expect(() => parseProducts({})).toThrow();
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
