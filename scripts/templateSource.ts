/**
 * Lê a pasta templates/ do disco no mesmo formato que o navegador recebe via Vite.
 * Usado pelo script de verificação e pelos testes em Node.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { FileMap } from '../shared/compose';

const BINARY = new Set(['.ico', '.png', '.jpg', '.jpeg', '.webp', '.gif']);

export const loadTemplateSource = (root = path.resolve(import.meta.dirname, '..', 'templates')): FileMap => {
  const out: FileMap = {};
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '_generated') continue;
        walk(full);
        continue;
      }
      const rel = path.relative(root, full).split(path.sep).join('/');
      out[rel] = BINARY.has(path.extname(entry.name).toLowerCase())
        ? { base64: fs.readFileSync(full).toString('base64') }
        : fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
    }
  };
  walk(root);
  return out;
};

export const writeFileMap = (files: FileMap, targetDir: string) => {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(targetDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    if (typeof content === 'string') fs.writeFileSync(full, content);
    else fs.writeFileSync(full, Buffer.from(content.base64, 'base64'));
  }
};
