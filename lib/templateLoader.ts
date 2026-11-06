/**
 * @file templateLoader.ts
 * Carregador unificado de templates.
 * Lê a estrutura modular de arquivos pré-indexada para o empacotamento rápido
 * e verificação no navegador (Web SPA), sincronizada 1:1 com os diretórios físicos em /templates/.
 */

import { storeFiles } from './templates-store';
import { blogFiles } from './templates-blog';
import { travelFiles } from './templates-travel';
import { commonFiles } from './templates-common';
import { ProjectType } from '../types';

export interface TemplateMetadata {
  id: ProjectType;
  name: string;
  slug: string;
  directory: string;
  description: string;
  lifecycle: string[];
  files: Record<string, any>;
}

/**
 * Retorna os arquivos consolidados para cada template específico
 */
export const loadTemplateFiles = (type: ProjectType): Record<string, any> => {
  switch (type) {
    case 'store':
      return { ...storeFiles, ...commonFiles };
    case 'blog':
      return { ...blogFiles, ...commonFiles };
    case 'travel':
      return { ...travelFiles, ...commonFiles };
    default:
      return { ...commonFiles };
  }
};

/**
 * Registro de metadados dos templates do ScaffoldEngine
 */
export const TEMPLATE_REGISTRY: Record<ProjectType, TemplateMetadata> = {
  store: {
    id: 'store',
    name: 'Loja Simples',
    slug: 'loja-simples-com-convex',
    directory: 'templates/store',
    description: 'E-commerce full-stack minimalista com Convex DB, Clerk Auth e catálogo dinâmico gerado por IA.',
    lifecycle: [
      'Definindo Schema de Dados no Convex',
      'Configurando Autenticação com Clerk',
      'Criando Queries e Mutations do Backend',
      'Protegendo Rotas e Endpoints da API',
      'Conectando Componentes React ao Backend',
      'Implementando Funcionalidades Reativas',
      'Empacotando projeto Full-Stack com Next.js e Convex',
    ],
    files: loadTemplateFiles('store'),
  },
  blog: {
    id: 'blog',
    name: 'Blog Pessoal',
    slug: 'blog-pessoal-com-nextjs',
    directory: 'templates/blog',
    description: 'Blog moderno com geração de páginas estáticas (SSG), Markdown, Jikan Anime API e suporte a temas.',
    lifecycle: [
      'Configurando Roteamento Dinâmico',
      'Criando Layouts com Next.js',
      'Implementando Geração de Páginas Estáticas (SSG)',
      'Processando Markdown para HTML',
      'Estilizando Componentes com CSS Modules',
      'Finalizando Estrutura de Arquivos',
      'Empacotando projeto com Next.js',
    ],
    files: loadTemplateFiles('blog'),
  },
  travel: {
    id: 'travel',
    name: 'Planejador de Viagens IA',
    slug: 'travel-planner-ai',
    directory: 'templates/travel',
    description: 'Assistente minimalista de viagens com mapas, roteiros automatizados e microserviços integrados.',
    lifecycle: [
      'Configurando integração com Gemini AI',
      'Criando Schema de Roteiros no Convex',
      'Implementando Chatbot de Treinamento',
      'Estilizando Interface de Mapa e Cards',
      'Configurando Autenticação Clerk',
      'Gerando Componentes de UI',
      'Empacotando Aplicação Next.js',
    ],
    files: loadTemplateFiles('travel'),
  },
};
