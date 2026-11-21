/**
 * create-gato-pingado — gera um projeto Gato Pingado pelo terminal.
 *
 *   npx create-gato-pingado minha-loja --app store --purpose "Loja de cafés especiais" --payments
 *
 * Usa os mesmos catálogo, validação (zod) e compositor da interface web.
 * Com GEMINI_API_KEY no ambiente, a IA cria nome, paleta, textos e catálogo; sem ela, sai com dados de exemplo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { APPS, APP_LIST, envFor, type AppId, type FeatureId } from '../../shared/catalog';
import { compose, slugify, type FileMap, type ProductImage } from '../../shared/compose';
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL } from '../../shared/config';
import { extFromMime } from '../../shared/api';
import { InputError, normalizeRequest, placeholderSvg, sampleBrand, sampleCatalog, type Brand, type Catalog } from '../../shared/content';
import * as gemini from '../../shared/gemini';

declare const __CLI_VERSION__: string;
const VERSION = typeof __CLI_VERSION__ === 'string' ? __CLI_VERSION__ : '0.0.0-dev';

const HELP = `
create-gato-pingado ${VERSION} — gera um app full-stack (Next.js + Convex + Clerk, Stripe opcional)

Uso:
  npx create-gato-pingado [pasta] [opções]

Opções:
  --app <store|blog|travel>   qual app gerar (loja, blog ou planejador de viagens)
  --name <nome>               nome do negócio (opcional; a IA sugere um)
  --purpose <texto>           para que serve o app, o negócio e o público
  --payments                  incluir pagamentos com Stripe
  --no-ai                     não usar IA (dados de exemplo)
  --images                    gerar fotos dos produtos com IA (custa mais cota)
  -y, --yes                   não perguntar nada; usa os padrões para o que faltar
  -h, --help                  mostra esta ajuda
  -v, --version               mostra a versão

IA: defina GEMINI_API_KEY (https://aistudio.google.com/apikey). Opcional: GEMINI_MODEL, GEMINI_IMAGE_MODEL.
`;

const out = (msg = '') => process.stdout.write(`${msg}\n`);
const step = (msg: string) => out(`  • ${msg}`);
const warn = (msg: string) => out(`  ! ${msg}`);

export interface CliOptions {
  dir?: string;
  app?: AppId;
  name?: string;
  purpose?: string;
  payments?: boolean;
  ai: boolean;
  images: boolean;
  yes: boolean;
}

export const parseCli = (argv: string[]): CliOptions | 'help' | 'version' => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      app: { type: 'string' },
      name: { type: 'string' },
      purpose: { type: 'string' },
      payments: { type: 'boolean' },
      'no-ai': { type: 'boolean' },
      images: { type: 'boolean' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
  if (values.help) return 'help';
  if (values.version) return 'version';
  if (values.app && !APPS[values.app as AppId]) throw new InputError(`App desconhecido: ${values.app}. Use store, blog ou travel.`);
  return {
    dir: positionals[0],
    app: values.app as AppId | undefined,
    name: values.name,
    purpose: values.purpose,
    payments: values.payments,
    ai: !values['no-ai'],
    images: Boolean(values.images),
    yes: Boolean(values.yes),
  };
};

/** Pergunta o que faltou (só em terminal interativo e sem --yes). */
const fillInteractively = async (opts: CliOptions): Promise<CliOptions> => {
  if (opts.yes || !process.stdin.isTTY) return opts;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const filled = { ...opts };
    if (!filled.app) {
      out('Qual app você quer?');
      APP_LIST.forEach((a, i) => out(`  ${i + 1}) ${a.name} — ${a.tagline}`));
      const answer = (await rl.question('Número [1]: ')).trim() || '1';
      filled.app = APP_LIST[Number(answer) - 1]?.id ?? (APPS[answer as AppId] ? (answer as AppId) : 'store');
    }
    const app = APPS[filled.app];
    if (!filled.purpose) filled.purpose = (await rl.question(`Para que serve? (${app.purposePlaceholder})\n> `)).trim();
    if (filled.name === undefined) filled.name = (await rl.question('Nome do negócio (Enter para a IA sugerir): ')).trim();
    if (filled.payments === undefined && app.features.includes('payments')) {
      filled.payments = /^s/i.test((await rl.question('Incluir pagamentos com Stripe? (s/N): ')).trim());
    }
    return filled;
  } finally {
    rl.close();
  }
};

/** templates.json fica ao lado do bundle (gerado por scripts/build-cli.ts). */
const templatesPath = () => path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates.json');

export const loadTemplates = (file = templatesPath()): FileMap => JSON.parse(fs.readFileSync(file, 'utf8'));

export const writeProject = (files: FileMap, target: string) => {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(target, rel);
    if (!full.startsWith(path.resolve(target) + path.sep)) throw new Error(`Caminho inválido: ${rel}`);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === 'string' ? content : Buffer.from(content.base64, 'base64'));
  }
};

export interface RunResult {
  target: string;
  brand: Brand;
  catalog?: Catalog;
  contentSource: 'ai' | 'sample';
  files: number;
}

export const run = async (opts: CliOptions, env = process.env, templates?: FileMap): Promise<RunResult> => {
  const appId = opts.app ?? 'store';
  const app = APPS[appId];
  const request = normalizeRequest({ app: appId, businessName: opts.name ?? '', purpose: opts.purpose ?? '' });
  const features: FeatureId[] = opts.payments && app.features.includes('payments') ? ['payments'] : [];

  const assertFree = (dir: string) => {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) throw new InputError(`A pasta ${dir} já existe e não está vazia. Escolha outra.`);
  };
  // Com pasta informada, confere antes de gastar chamadas de IA.
  if (opts.dir) assertFree(path.resolve(opts.dir));

  const apiKey = env.GEMINI_API_KEY;
  const useAI = opts.ai && Boolean(apiKey);
  if (opts.ai && !apiKey) warn('GEMINI_API_KEY não definida: usando dados de exemplo.');
  const ai: gemini.GeminiOptions | null = useAI
    ? {
        apiKey: apiKey!,
        textModel: env.GEMINI_MODEL || DEFAULT_TEXT_MODEL,
        imageModel: env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
        onRetry: (attempt, reason) => warn(`tentativa ${attempt} falhou, tentando de novo (${reason.slice(0, 120)})`),
      }
    : null;

  let usedSample = !ai;
  let brand = sampleBrand(request);
  if (ai) {
    step(`Criando nome, paleta e textos com IA (${ai.textModel})…`);
    try {
      brand = await gemini.generateBrand(ai, request);
    } catch (err) {
      usedSample = true;
      warn(`a IA falhou na identidade (${(err as Error).message}); usando dados de exemplo.`);
    }
  }
  step(`Marca: ${brand.name} — ${brand.tagline}`);

  let catalog: Catalog | undefined;
  const images: ProductImage[] = [];
  if (app.generatesProducts) {
    catalog = sampleCatalog();
    if (ai) {
      step('Gerando catálogo e campos dos produtos com IA…');
      try {
        catalog = await gemini.generateCatalog(ai, request);
      } catch (err) {
        usedSample = true;
        warn(`a IA falhou no catálogo (${(err as Error).message}); usando produtos de exemplo.`);
      }
    }
    const extra = catalog.fields.length ? ` · campos: ${catalog.fields.map((f) => f.label).join(', ')}` : '';
    step(`${catalog.products.length} produtos${extra}`);
    for (const product of catalog.products) {
      if (ai && opts.images) {
        try {
          const img = await gemini.generateImage(ai, product, brand);
          images.push({ ext: extFromMime(img.mimeType), content: { base64: img.base64 } });
          continue;
        } catch (err) {
          warn(`foto de "${product.name}" falhou (${(err as Error).message}); usando imagem provisória.`);
        }
      }
      images.push({ ext: 'svg', content: placeholderSvg(product.name, brand.palette.accent, brand.palette.surface) });
    }
  }

  const slug = slugify(opts.dir ? path.basename(opts.dir) : brand.name, app.defaultSlug);
  const target = path.resolve(opts.dir ?? slug);
  assertFree(target);

  const files = compose(
    {
      app: appId,
      features,
      slug,
      brand,
      products: catalog?.products,
      productFields: catalog?.fields,
      productImages: app.generatesProducts ? images : undefined,
      contentSource: usedSample ? 'sample' : 'ai',
      generatorVersion: VERSION,
    },
    templates ?? loadTemplates(),
  );
  writeProject(files, target);
  return { target, brand, catalog, contentSource: usedSample ? 'sample' : 'ai', files: Object.keys(files).length };
};

const nextSteps = (r: RunResult, app: AppId, features: FeatureId[]) => {
  const rel = path.relative(process.cwd(), r.target) || '.';
  out(`\nPronto! ${r.files} arquivos em ${rel}\n`);
  out('Próximos passos:');
  out(`  cd ${rel}`);
  out('  npm install');
  out('  npx convex dev            # deixe rodando');
  out('  cp .env.local.example .env.local   # e preencha');
  if (APPS[app].generatesProducts) out('  npx convex run products:seed');
  out('  npm run dev\n');
  out('Variáveis necessárias:');
  for (const v of envFor(app, features)) out(`  ${v.name.padEnd(36)} ${v.where === 'convex' ? '(npx convex env set)' : '(.env.local)'}`);
  out('\nO README do projeto explica cada passo.');
};

export const main = async (argv = process.argv.slice(2)): Promise<number> => {
  let parsed: ReturnType<typeof parseCli>;
  try {
    parsed = parseCli(argv);
  } catch (err) {
    out(`Erro: ${(err as Error).message}\n${HELP}`);
    return 1;
  }
  if (parsed === 'help') return out(HELP), 0;
  if (parsed === 'version') return out(VERSION), 0;

  out(`\nGato Pingado · create-gato-pingado ${VERSION}\n`);
  try {
    const opts = await fillInteractively(parsed);
    const result = await run(opts);
    const app = opts.app ?? 'store';
    nextSteps(result, app, opts.payments && APPS[app].features.includes('payments') ? ['payments'] : []);
    return 0;
  } catch (err) {
    out(`\nErro: ${(err as Error).message}`);
    if (err instanceof InputError) out('Use --help para ver as opções.');
    return 1;
  }
};
