import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templatesDir = path.join(rootDir, 'templates');

test('Validação de Diretórios Físicos de Templates', async (t) => {
  await t.test('Diretório raiz templates/ deve existir', () => {
    assert.ok(fs.existsSync(templatesDir), 'A pasta /templates deve existir');
    assert.ok(fs.existsSync(path.join(templatesDir, 'README.md')), 'Deve possuir README.md orientador');
  });

  const templates = ['store', 'blog', 'travel'];

  for (const tpl of templates) {
    await t.test(`Template "${tpl}" deve possuir estrutura autônoma`, () => {
      const tplDir = path.join(templatesDir, tpl);
      assert.ok(fs.existsSync(tplDir), `Diretório templates/${tpl} deve existir`);

      // Arquivos essenciais de um projeto Node/Next.js
      const pkgPath = path.join(tplDir, 'package.json');
      assert.ok(fs.existsSync(pkgPath), `${tpl} deve ter seu próprio package.json`);

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.ok(pkg.name, `${tpl} package.json deve ter a propriedade name`);
      assert.ok(pkg.scripts?.dev, `${tpl} deve possuir script dev`);
      assert.ok(pkg.scripts?.build, `${tpl} deve possuir script build`);

      const readmePath = path.join(tplDir, 'README.md');
      assert.ok(fs.existsSync(readmePath), `${tpl} deve possuir README.md com documentação`);

      const envExamplePath = path.join(tplDir, '.env.local.example');
      assert.ok(fs.existsSync(envExamplePath), `${tpl} deve possuir .env.local.example`);

      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      assert.match(envContent, /GEMINI_API_KEY/, `${tpl} .env.local.example deve declarar GEMINI_API_KEY`);

      // Verificar pasta de backend / código fonte
      assert.ok(
        fs.existsSync(path.join(tplDir, 'convex')) || fs.existsSync(path.join(tplDir, 'src')),
        `${tpl} deve possuir código de aplicação (convex ou src)`
      );
    });
  }
});
