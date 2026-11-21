/**
 * Verifica de verdade os projetos que o gerador entrega.
 *
 * Para cada app e cada combinação de recursos: compõe o projeto, instala as
 * dependências, gera os tipos do Convex e roda o TypeScript (tsc --noEmit).
 * Com --build também roda `next build`.
 *
 * Uso: npm run verify:templates [-- --app store] [-- --build]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { APP_LIST, AppId, FeatureId } from '../shared/catalog';
import { compose } from '../shared/compose';
import { placeholderSvg, sampleBrand, sampleProducts } from '../shared/content';
import { loadTemplateSource, writeFileMap } from './templateSource';

const args = process.argv.slice(2);
const onlyApp = args.includes('--app') ? (args[args.indexOf('--app') + 1] as AppId) : undefined;
const runBuild = args.includes('--build');
const outRoot = path.resolve(import.meta.dirname, '..', '.verify');
const version = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'package.json'), 'utf8')).version;

const run = (cmd: string, cwd: string, env: NodeJS.ProcessEnv = {}) => {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
};

/** Chave pública do Clerk com formato válido, só para o build offline. */
const FAKE_CLERK_PK = 'pk_test_' + Buffer.from('example.clerk.accounts.dev$').toString('base64');

/** Valores fictícios só para o backend local aceitar a publicação. */
const VERIFY_CONVEX_ENV: Record<string, string> = {
  CLERK_JWT_ISSUER_DOMAIN: 'https://example.clerk.accounts.dev',
};

const source = loadTemplateSource();
const failures: string[] = [];

for (const app of APP_LIST) {
  if (onlyApp && app.id !== onlyApp) continue;
  const variants: FeatureId[][] = [[], ...app.features.map((f) => [f])];
  for (const features of variants) {
    const name = `${app.id}${features.length ? '-' + features.join('-') : ''}`;
    const dir = path.join(outRoot, name);
    console.log(`\n=== ${name}`);
    const request = { app: app.id, businessName: 'Loja Teste', purpose: 'Projeto de verificação automática do gerador.' };
    const brand = sampleBrand(request);
    const products = app.generatesProducts ? sampleProducts() : undefined;
    const files = compose(
      {
        app: app.id,
        features,
        slug: `verify-${name}`,
        brand,
        products,
        productImages: products?.map((p) => ({ ext: 'svg' as const, content: placeholderSvg(p.name, brand.accentColor) })),
        contentSource: 'sample',
        generatorVersion: version,
      },
      source,
    );
    // Mantém node_modules e o deployment local entre execuções; troca o resto.
    if (fs.existsSync(dir)) {
      const keep = new Set(['node_modules', '.env.local']);
      for (const entry of fs.readdirSync(dir)) if (!keep.has(entry)) fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    }
    writeFileMap(files, dir);
    try {
      run('npm install --no-audit --no-fund --loglevel=error', dir);
      // Sobe um backend Convex local anônimo (sem conta), publica as funções de verdade
      // (valida schema, módulos e tipos do backend) e gera convex/_generated.
      const convexEnv = { CONVEX_AGENT_MODE: 'anonymous' };
      try {
        run('npx convex dev --once --typecheck disable', dir, convexEnv);
      } catch {
        // Na primeira execução isso só configura o deployment local; as variáveis vêm a seguir.
      }
      for (const [name, value] of Object.entries(VERIFY_CONVEX_ENV)) {
        run(`npx convex env set ${name} ${value}`, dir, convexEnv);
      }
      run('npx convex dev --once --typecheck enable', dir, convexEnv);
      run('npx tsc --noEmit', dir);
      if (runBuild) {
        run('npx next build', dir, {
          NEXT_PUBLIC_CONVEX_URL: 'https://example.convex.cloud',
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: FAKE_CLERK_PK,
          CLERK_SECRET_KEY: 'sk_test_verify',
          NEXT_TELEMETRY_DISABLED: '1',
        });
      }
      console.log(`  OK ${name}`);
    } catch {
      failures.push(name);
      console.log(`  FALHOU ${name}`);
    }
  }
}

if (failures.length) {
  console.error(`\nFalharam: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nTodos os projetos gerados passaram.');
