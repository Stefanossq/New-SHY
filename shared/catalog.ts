/**
 * Catálogo do produto: quais apps existem, quais recursos cada um aceita
 * e quais variáveis de ambiente o projeto gerado precisa.
 * Fonte única usada pela interface, pelo servidor, pelo compositor e pelos testes.
 */

export type AppId = 'store' | 'blog' | 'travel';
export type FeatureId = 'payments';

export interface EnvVar {
  name: string;
  description: string;
  /** Onde a variável é configurada no projeto gerado. */
  where: 'next' | 'convex';
}

export interface FeatureDefinition {
  id: FeatureId;
  label: string;
  /** Texto específico de cada app, explicando o que o recurso faz nele. */
  perApp: Record<AppId, string>;
  dependencies: Record<string, string>;
  env: EnvVar[];
}

export interface AppDefinition {
  id: AppId;
  name: string;
  tagline: string;
  description: string;
  /** Pasta dentro de templates/. */
  template: AppId;
  /** Nome padrão do pacote gerado (vira o nome da pasta do projeto). */
  defaultSlug: string;
  stack: string[];
  /** Se o app recebe catálogo de produtos gerado pela IA. */
  generatesProducts: boolean;
  /** Se o app gerado chama a Gemini enquanto roda (precisa de GEMINI_API_KEY). */
  usesAiAtRuntime: boolean;
  /** Exemplo exibido no campo "para quê". */
  purposePlaceholder: string;
  features: FeatureId[];
}

export const BASE_ENV: EnvVar[] = [
  { name: 'NEXT_PUBLIC_CONVEX_URL', description: 'URL do deployment Convex (criada por `npx convex dev`).', where: 'next' },
  { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', description: 'Chave pública do Clerk (dashboard.clerk.com → API Keys).', where: 'next' },
  { name: 'CLERK_SECRET_KEY', description: 'Chave secreta do Clerk.', where: 'next' },
  { name: 'CLERK_JWT_ISSUER_DOMAIN', description: 'Issuer do JWT template "convex" no Clerk.', where: 'convex' },
  { name: 'ADMIN_USER_IDS', description: 'IDs de usuário Clerk (separados por vírgula) com acesso ao painel admin.', where: 'convex' },
];

/** Só para apps que usam IA em tempo de execução (blog e planejador). */
export const AI_RUNTIME_ENV: EnvVar[] = [
  { name: 'GEMINI_API_KEY', description: 'Chave da API Gemini (aistudio.google.com) usada pelos recursos de IA do app.', where: 'convex' },
  { name: 'GEMINI_MODEL', description: 'Opcional. Modelo de texto da Gemini (padrão: gemini-3.8-flash).', where: 'convex' },
];

export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  payments: {
    id: 'payments',
    label: 'Pagamentos com Stripe',
    perApp: {
      store: 'Checkout real com Stripe (cartão, Pix e demais métodos ativos na sua conta). O pedido só é confirmado quando o Stripe aprova o pagamento (webhook); o estoque fica reservado por 30 min e volta se o pagamento expirar.',
      blog: 'Assinatura mensal "Apoiador" via Stripe para monetizar o blog. O webhook mantém o status do assinante sincronizado e o portal do Stripe permite cancelar.',
      travel: 'Plano Premium mensal via Stripe. No plano grátis o usuário salva até 3 roteiros; no Premium, ilimitado.',
    },
    dependencies: { stripe: '^18.5.0' },
    env: [
      { name: 'STRIPE_SECRET_KEY', description: 'Chave secreta do Stripe (use sk_test_ para testar).', where: 'convex' },
      { name: 'STRIPE_WEBHOOK_SECRET', description: 'Segredo do webhook apontando para https://<deployment>.convex.site/stripe/webhook.', where: 'convex' },
      { name: 'SITE_URL', description: 'URL pública do app (ex.: http://localhost:3000), usada nos retornos do checkout.', where: 'convex' },
    ],
  },
};

export const APPS: Record<AppId, AppDefinition> = {
  store: {
    id: 'store',
    name: 'Loja virtual',
    tagline: 'E-commerce com catálogo, carrinho, pedidos e painel admin',
    description: 'Catálogo de produtos gerado pela IA a partir do seu negócio, carrinho persistente, checkout, histórico de pedidos, avaliações e painel administrativo.',
    template: 'store',
    defaultSlug: 'minha-loja',
    stack: ['Next.js 15', 'Convex', 'Clerk', 'TypeScript'],
    generatesProducts: true,
    usesAiAtRuntime: false,
    purposePlaceholder: 'Ex.: loja de cafés especiais torrados em Santa Maria, com grãos, métodos de preparo e acessórios.',
    features: ['payments'],
  },
  blog: {
    id: 'blog',
    name: 'Blog de anime e games',
    tagline: 'Blog com posts gerados por IA a partir da API Jikan e FreeToGame',
    description: 'Posts sobre animes da temporada e jogos gratuitos, recomendações com IA, chatbot e painel admin para gerar e editar conteúdo.',
    template: 'blog',
    defaultSlug: 'meu-blog',
    stack: ['Next.js 15', 'Convex', 'Clerk', 'Gemini', 'TypeScript'],
    generatesProducts: false,
    usesAiAtRuntime: true,
    purposePlaceholder: 'Ex.: blog de reviews de animes da temporada com foco em ação e ficção científica.',
    features: ['payments'],
  },
  travel: {
    id: 'travel',
    name: 'Planejador de viagens',
    tagline: 'Roteiros de viagem gerados por IA, salvos por usuário',
    description: 'O usuário informa destino, dias, orçamento e estilo; a IA monta o roteiro dia a dia, que fica salvo na conta. Inclui chat de dúvidas.',
    template: 'travel',
    defaultSlug: 'meu-planejador',
    stack: ['Next.js 15', 'Convex', 'Clerk', 'Gemini', 'TypeScript'],
    generatesProducts: false,
    usesAiAtRuntime: true,
    purposePlaceholder: 'Ex.: agência de turismo de aventura na serra gaúcha para casais e pequenos grupos.',
    features: ['payments'],
  },
};

export const APP_LIST: AppDefinition[] = [APPS.store, APPS.blog, APPS.travel];

export const envFor = (app: AppId, features: FeatureId[]): EnvVar[] => [
  ...BASE_ENV,
  ...(APPS[app].usesAiAtRuntime ? AI_RUNTIME_ENV : []),
  ...features.filter((f) => APPS[app].features.includes(f)).flatMap((f) => FEATURES[f].env),
];
