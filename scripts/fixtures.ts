/**
 * Conteúdo fixo que imita uma resposta da IA (paleta própria, textos e campos extras),
 * passando pela mesma validação zod. Usado pela verificação do CI e pelos testes,
 * para que os caminhos personalizados pela IA também sejam compilados e testados.
 */
import type { AppId } from '../shared/catalog';
import { parseBrand, parseCatalog, sampleBrand, type Brand, type Catalog } from '../shared/content';

export const fixtureBrand = (app: AppId, businessName = 'Loja Teste'): Brand => {
  const base = sampleBrand({ app, businessName, purpose: 'Projeto de verificação automática do gerador.' });
  return parseBrand(
    {
      ...base,
      palette: { background: '#120d0a', surface: '#1f1712', text: '#f6ede4', muted: '#c2b2a3', accent: '#e58e26', accentText: '#140b02' },
      copy: {
        heroTitle: `${base.name}: verificação`,
        heroSubtitle: 'Texto de subtítulo gerado para a verificação do CI.',
        ctaLabel: 'Ver catálogo',
        aboutTitle: 'Sobre a loja',
        aboutText: 'Seção "sobre" preenchida para garantir que os textos da IA chegam ao site.',
      },
    },
    { app, businessName, purpose: 'Projeto de verificação automática do gerador.' },
  );
};

export const fixtureCatalog = (): Catalog =>
  parseCatalog({
    fields: [
      { key: 'torra', label: 'Torra', type: 'text' },
      { key: 'pesoGramas', label: 'Peso', type: 'number', unit: 'g' },
    ],
    products: [
      { name: 'Café Bourbon Amarelo', price: 42.9, description: 'Notas de mel.', category: 'Grãos', stock: 20, attributes: [{ key: 'torra', value: 'Média' }, { key: 'pesoGramas', value: '250' }] },
      { name: 'Café Catuaí Fermentado', price: 48.5, description: 'Notas de chocolate.', category: 'Grãos', stock: 12, attributes: [{ key: 'torra', value: 'Escura' }, { key: 'pesoGramas', value: '500' }] },
    ],
  });
