import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parseCli, run } from '../cli/src/index';
import { InputError } from '../shared/content';
import { loadTemplateSource } from '../scripts/templateSource';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'create-gato-pingado-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
const templates = loadTemplateSource();

describe('create-gato-pingado', () => {
  it('lê as opções da linha de comando', () => {
    expect(parseCli(['loja', '--app', 'store', '--purpose', 'Loja de cafés', '--payments', '--no-ai', '-y'])).toMatchObject({
      dir: 'loja',
      app: 'store',
      purpose: 'Loja de cafés',
      payments: true,
      ai: false,
      yes: true,
    });
    expect(parseCli(['--help'])).toBe('help');
    expect(() => parseCli(['--app', 'xyz'])).toThrow(InputError);
  });

  it('gera o projeto em disco sem IA (sem chave no ambiente)', async () => {
    const dir = path.join(tmp, 'minha-loja');
    const result = await run({ dir, app: 'store', purpose: 'Loja de cafés especiais do sul de Minas.', payments: true, ai: true, images: false, yes: true }, {}, templates);
    expect(result.contentSource).toBe('sample');
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name).toBe('minha-loja');
    expect(fs.existsSync(path.join(dir, 'convex', 'stripe.ts'))).toBe(true);
    expect(fs.readFileSync(path.join(dir, 'src', 'lib', 'site.ts'), 'utf8')).toContain('palette');
    expect(fs.existsSync(path.join(dir, 'src', 'app', 'favicon.ico'))).toBe(true);
  });

  it('não escreve por cima de uma pasta com arquivos', async () => {
    const dir = path.join(tmp, 'ocupada');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'x.txt'), 'x');
    await expect(run({ dir, app: 'blog', purpose: 'Blog de reviews de animes.', ai: false, images: false, yes: true }, {}, templates)).rejects.toThrow('não está vazia');
  });
});
