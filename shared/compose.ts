/**
 * Compositor de projetos: monta o projeto final a partir de templates/
 * (arquivos compartilhados + app escolhido + recursos escolhidos) e injeta
 * o conteúdo gerado (marca, produtos e imagens).
 *
 * É uma função pura: recebe o mapa de arquivos dos templates e devolve o mapa
 * de arquivos do projeto. Roda igual no navegador, no app desktop e nos testes.
 */
import { APPS, AppId, FEATURES, FeatureId, envFor } from './catalog';
import { Brand, Product } from './content';

export type FileContent = string | { base64: string };
export type FileMap = Record<string, FileContent>;

export interface ProductImage {
  /** Extensão do arquivo: png/jpg/webp quando gerada pela IA, svg quando é placeholder. */
  ext: 'png' | 'jpg' | 'webp' | 'svg';
  content: FileContent;
}

export interface ComposeInput {
  app: AppId;
  features: FeatureId[];
  slug: string;
  brand: Brand;
  products?: Product[];
  productImages?: ProductImage[];
  /** De onde veio o conteúdo: IA de verdade ou dados de exemplo. */
  contentSource: 'ai' | 'sample';
  generatorVersion: string;
}

/** Arquivos que ficam no repositório sem ponto no nome e ganham o ponto no projeto gerado. */
const RENAMES: Record<string, string> = { gitignore: '.gitignore' };

const layer = (source: FileMap, prefix: string, into: FileMap) => {
  const base = `${prefix}/`;
  for (const [path, content] of Object.entries(source)) {
    if (!path.startsWith(base)) continue;
    const rel = path.slice(base.length);
    into[RENAMES[rel] ?? rel] = content;
  }
};

export const slugify = (value: string, fallback: string): string => {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return slug || fallback;
};

/** Camadas de recursos aplicadas para cada app, em ordem. */
const featureLayers = (app: AppId, feature: FeatureId): string[] => {
  if (feature === 'payments') {
    return ['_features/payments/common', app === 'store' ? '_features/payments/store' : '_features/payments/subscription', `_features/payments/${app}`];
  }
  return [];
};

const ts = (value: unknown) => JSON.stringify(value, null, 2);

export const siteFile = (input: ComposeInput): string =>
  `// Gerado pelo New SHY. Pode editar à vontade.
export const SITE = {
  name: ${JSON.stringify(input.brand.name)},
  tagline: ${JSON.stringify(input.brand.tagline)},
  description: ${JSON.stringify(input.brand.description)},
  accentColor: ${JSON.stringify(input.brand.accentColor)},
  features: {
    payments: ${input.features.includes('payments')},
  },
} as const;
`;

const seedFile = (products: Product[], imageUrls: string[]): string => {
  const rows = products.map((p, i) => ({ ...p, imageUrl: imageUrls[i] ?? '' }));
  return `// Produtos iniciais da loja. Gerado pelo New SHY.
// São inseridos uma única vez com: npx convex run products:seed
export const SEED_PRODUCTS = ${ts(rows)};
`;
};

const envExample = (app: AppId, features: FeatureId[]): string => {
  const vars = envFor(app, features).filter((v) => v.where === 'next');
  return vars.map((v) => `# ${v.description}\n${v.name}=`).join('\n\n') + '\n';
};

export const readme = (input: ComposeInput): string => {
  const app = APPS[input.app];
  const features = input.features.filter((f) => app.features.includes(f));
  const convexVars = envFor(input.app, features).filter((v) => v.where === 'convex');
  const lines: string[] = [
    `# ${input.brand.name}`,
    '',
    input.brand.tagline,
    '',
    `Projeto gerado pelo New SHY: **${app.name}** (${app.stack.join(', ')}).`,
    '',
    '## Recursos incluídos',
    '',
    `- ${app.description}`,
    ...features.map((f) => `- **${FEATURES[f].label}:** ${FEATURES[f].perApp[input.app]}`),
    '',
  ];
  if (input.contentSource === 'sample') {
    lines.push('> O conteúdo inicial foi gerado com **dados de exemplo** (sem IA). Edite-o pelo painel admin ou em `convex/seedData.ts`.', '');
  }
  lines.push(
    '## Como rodar',
    '',
    '1. Instale as dependências: `npm install`',
    '2. Crie o backend Convex e gere os tipos: `npx convex dev` (deixe rodando em um terminal).',
    '3. No Clerk, crie uma aplicação e um JWT template chamado **convex** (dashboard.clerk.com → JWT Templates → Convex).',
    '4. Copie `.env.local.example` para `.env.local` e preencha:',
    '',
    ...envFor(input.app, features)
      .filter((v) => v.where === 'next')
      .map((v) => `   - \`${v.name}\`: ${v.description}`),
    '',
    '5. Configure as variáveis do backend Convex (uma por comando):',
    '',
    '```bash',
    ...convexVars.map((v) => `npx convex env set ${v.name} <valor>   # ${v.description}`),
    '```',
    '',
  );
  if (input.app === 'store') {
    lines.push('6. Insira os produtos iniciais: `npx convex run products:seed`', '7. Rode o site: `npm run dev` e abra http://localhost:3000', '');
  } else {
    lines.push('6. Rode o site: `npm run dev` e abra http://localhost:3000', '');
  }
  if (features.includes('payments')) {
    lines.push(
      '## Pagamentos (Stripe)',
      '',
      '- No Stripe, crie um webhook apontando para `https://<seu-deployment>.convex.site/stripe/webhook` com os eventos:',
      input.app === 'store'
        ? '  `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.'
        : '  `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.',
      '- Para testar localmente use as chaves `sk_test_...` e o cartão de teste 4242 4242 4242 4242.',
      '- Os preços são sempre calculados no servidor; o navegador nunca define o valor cobrado.',
      '',
    );
  }
  lines.push(
    '## Administração',
    '',
    'O painel admin só aceita os usuários listados em `ADMIN_USER_IDS` (IDs do Clerk, ex.: `user_2abc...`).',
    '',
    '## Deploy',
    '',
    '- Backend: `npx convex deploy`',
    '- Frontend: Vercel (ou outro host de Next.js) com as mesmas variáveis do `.env.local`.',
    '',
  );
  return lines.join('\n');
};

export const compose = (input: ComposeInput, source: FileMap): FileMap => {
  const app = APPS[input.app];
  if (!app) throw new Error(`App desconhecido: ${input.app}`);
  const features = [...new Set(input.features)].filter((f) => app.features.includes(f)).sort();

  const files: FileMap = {};
  layer(source, '_shared', files);
  layer(source, app.template, files);
  for (const feature of features) {
    for (const prefix of featureLayers(input.app, feature)) layer(source, prefix, files);
  }

  // package.json: nome do projeto + dependências dos recursos
  const pkgRaw = files['package.json'];
  if (typeof pkgRaw !== 'string') throw new Error(`Template ${app.template} sem package.json`);
  const pkg = JSON.parse(pkgRaw);
  pkg.name = input.slug;
  pkg.dependencies = { ...pkg.dependencies };
  for (const feature of features) Object.assign(pkg.dependencies, FEATURES[feature].dependencies);
  pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
  files['package.json'] = ts(pkg) + '\n';

  const normalized: ComposeInput = { ...input, features };
  files['src/lib/site.ts'] = siteFile(normalized);
  files['.env.local.example'] = envExample(input.app, features);
  files['README.md'] = readme(normalized);
  files['shy.json'] =
    ts({ generator: `new-shy@${input.generatorVersion}`, app: input.app, features, contentSource: input.contentSource }) + '\n';

  if (app.generatesProducts) {
    const products = input.products ?? [];
    const images = input.productImages ?? [];
    const urls: string[] = [];
    products.forEach((_, i) => {
      const image = images[i];
      if (!image) {
        urls.push('');
        return;
      }
      const path = `public/images/product-${i + 1}.${image.ext}`;
      files[path] = image.content;
      urls.push(`/images/product-${i + 1}.${image.ext}`);
    });
    files['convex/seedData.ts'] = seedFile(products, urls);
  }

  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
};
