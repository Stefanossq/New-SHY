/**
 * Empacota a CLI (cli/) num único arquivo, com os templates ao lado em templates.json.
 * O pacote publicado não tem dependências: zod e o resto do shared/ vão no bundle.
 *
 * Uso: npm run build:cli   →   cli/dist/bin.js + cli/dist/templates.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { loadTemplateSource } from './templateSource';

const root = path.resolve(import.meta.dirname, '..');
const cliDir = path.join(root, 'cli');
const dist = path.join(cliDir, 'dist');
const version = JSON.parse(fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8')).version;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(cliDir, 'src', 'bin.ts')],
  outfile: path.join(dist, 'bin.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  define: { __CLI_VERSION__: JSON.stringify(version) },
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
});

const templates = loadTemplateSource();
fs.writeFileSync(path.join(dist, 'templates.json'), JSON.stringify(templates));

const kb = (f: string) => `${Math.round(fs.statSync(path.join(dist, f)).size / 1024)} KB`;
console.log(`create-gato-pingado ${version}: dist/bin.js (${kb('bin.js')}), dist/templates.json (${Object.keys(templates).length} arquivos, ${kb('templates.json')})`);
