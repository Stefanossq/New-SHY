/**
 * Verifica de verdade os projetos que o gerador entrega.
 *
 * Para cada app e cada combinação de recursos: compõe o projeto, gera o .zip com a mesma
 * função da interface, descompacta numa pasta limpa, instala as dependências, publica o
 * backend num Convex local e roda o TypeScript (tsc --noEmit). Com --build também roda `next build`.
 *
 * Uso: npm run verify:templates [-- --app store] [-- --build]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { APP_LIST, AppId, FeatureId } from '../shared/catalog';
import { compose } from '../shared/compose';
import { placeholderSvg } from '../shared/content';
import { buildZipBytes, readZip } from '../shared/zip';
import { fixtureBrand, fixtureCatalog } from './fixtures';
import { loadTemplateSource } from './templateSource';

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

/** Arquivos mantidos entre execuções (cache de dependências e deployment Convex local). */
const KEEP = new Set(['node_modules', '.env.local']);

const source = loadTemplateSource();
const failures: string[] = [];

for (const app of APP_LIST) {
  if (onlyApp && app.id !== onlyApp) continue;
  const variants: FeatureId[][] = [[], ...app.features.map((f) => [f])];
  for (const features of variants) {
    const name = `${app.id}${features.length ? '-' + features.join('-') : ''}`;
    const dir = path.join(outRoot, name);
    console.log(`\n=== ${name}`);
    try {
      const brand = fixtureBrand(app.id);
      const catalog = app.generatesProducts ? fixtureCatalog() : undefined;
      const files = compose(
        {
          app: app.id,
          features,
          slug: `verify-${name}`,
          brand,
          products: catalog?.products,
          productFields: catalog?.fields,
          productImages: catalog?.products.map((p) => ({ ext: 'svg' as const, content: placeholderSvg(p.name, brand.palette.accent) })),
          contentSource: 'sample',
          generatorVersion: version,
        },
        source,
      );

      // 1. O zip entregue ao cliente, gerado pela mesma função da interface.
      const zipBytes = await buildZipBytes(files, `verify-${name}`);
      fs.mkdirSync(outRoot, { recursive: true });
      const zipPath = path.join(outRoot, `${name}.zip`);
      fs.writeFileSync(zipPath, zipBytes);
      console.log(`  zip: ${path.relative(process.cwd(), zipPath)} (${Math.round(zipBytes.length / 1024)} KB)`);

      // 2. Descompacta numa pasta limpa (mantém só o cache de dependências e o Convex local).
      if (fs.existsSync(dir)) {
        for (const entry of fs.readdirSync(dir)) if (!KEEP.has(entry)) fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
      }
      const { files: unzipped } = await readZip(fs.readFileSync(zipPath));
      if (unzipped.size !== Object.keys(files).length) throw new Error(`zip com ${unzipped.size} arquivos, esperado ${Object.keys(files).length}`);
      for (const [rel, bytes] of unzipped) {
        const full = path.join(dir, rel);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, bytes);
      }

      // 3. Instala, publica no Convex local e compila, como o cliente faria.
      run('npm install --no-audit --no-fund --loglevel=error', dir);
      const convexEnv = { CONVEX_AGENT_MODE: 'anonymous' };
      try {
        run('npx convex dev --once --typecheck disable', dir, convexEnv);
      } catch {
        // Na primeira execução isso só configura o deployment local; as variáveis vêm a seguir.
      }
      for (const [key, value] of Object.entries(VERIFY_CONVEX_ENV)) {
        run(`npx convex env set ${key} ${value}`, dir, convexEnv);
      }
      run('npx convex dev --once --typecheck enable', dir, convexEnv);
      if (app.generatesProducts) run('npx convex run products:seed', dir, convexEnv);
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
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
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
