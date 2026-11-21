/**
 * O .zip que o cliente baixa. A interface e a verificação do CI usam esta mesma função,
 * então o CI testa exatamente o arquivo entregue (não uma cópia montada de outro jeito).
 */
import JSZip from 'jszip';
import type { FileMap } from './compose';

export const buildZipBytes = async (files: FileMap, rootFolder: string): Promise<Uint8Array> => {
  const zip = new JSZip();
  const folder = zip.folder(rootFolder)!;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content === 'string') folder.file(path, content);
    else folder.file(path, content.base64, { base64: true });
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
};

/** Lê um .zip gerado e devolve os arquivos sem a pasta raiz (caminho → bytes). */
export const readZip = async (bytes: Uint8Array): Promise<{ root: string; files: Map<string, Uint8Array> }> => {
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files).filter((f) => !f.dir);
  const roots = new Set(entries.map((f) => f.name.split('/')[0]));
  if (roots.size !== 1) throw new Error(`O zip deveria ter uma única pasta raiz, tem: ${[...roots].join(', ')}`);
  const [root] = roots;
  const files = new Map<string, Uint8Array>();
  for (const entry of entries) {
    const rel = entry.name.slice(root.length + 1);
    if (!rel || rel.split('/').some((part) => part === '..' || part === '')) throw new Error(`Caminho inválido no zip: ${entry.name}`);
    files.set(rel, await entry.async('uint8array'));
  }
  return { root, files };
};
