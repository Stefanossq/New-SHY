// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const templatesDir = path.resolve(__dirname, '..', 'templates');

describe('Diretórios físicos de templates', () => {
  it('templates/ existe e possui README.md orientador', () => {
    expect(fs.existsSync(templatesDir)).toBe(true);
    expect(fs.existsSync(path.join(templatesDir, 'README.md'))).toBe(true);
  });

  it.each(['store', 'blog', 'travel'])('template "%s" possui estrutura autônoma', (tpl) => {
    const tplDir = path.join(templatesDir, tpl);
    expect(fs.existsSync(tplDir)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(tplDir, 'package.json'), 'utf8'));
    expect(pkg.name).toBeTruthy();
    expect(pkg.scripts?.dev).toBeTruthy();
    expect(pkg.scripts?.build).toBeTruthy();

    expect(fs.existsSync(path.join(tplDir, 'README.md'))).toBe(true);
    const env = fs.readFileSync(path.join(tplDir, '.env.local.example'), 'utf8');
    expect(env).toMatch(/GEMINI_API_KEY/);
    expect(fs.existsSync(path.join(tplDir, 'convex')) || fs.existsSync(path.join(tplDir, 'src'))).toBe(true);
  });
});
