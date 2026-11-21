/**
 * Os templates são lidos direto da pasta templates/ no build (fonte única).
 * Não existe mais cópia dos templates dentro do código.
 */
import type { FileMap } from '../../shared/compose';

const textFiles = import.meta.glob(['/templates/**/*', '!/templates/**/*.{ico,png,jpg,jpeg,webp,gif}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const binaryFiles = import.meta.glob('/templates/**/*.{ico,png,jpg,jpeg,webp,gif}', {
  query: '?inline',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const strip = (path: string) => path.replace(/^\/templates\//, '');

export const TEMPLATE_SOURCE: FileMap = {
  ...Object.fromEntries(Object.entries(textFiles).map(([p, c]) => [strip(p), c])),
  ...Object.fromEntries(
    Object.entries(binaryFiles).map(([p, dataUrl]) => [strip(p), { base64: dataUrl.slice(dataUrl.indexOf(',') + 1) }]),
  ),
};
