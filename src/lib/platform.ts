/**
 * Diferenças entre rodar no navegador e no app desktop (Tauri).
 * No navegador o projeto é baixado como .zip; no desktop é gravado direto numa pasta.
 */
import { invoke, isTauri } from '@tauri-apps/api/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { FileMap } from '../../shared/compose';

export const isDesktop = (): boolean => isTauri();

export const callDesktop = <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => invoke<T>(cmd, args);

export const buildZip = async (files: FileMap, rootFolder: string): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder(rootFolder)!;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content === 'string') folder.file(path, content);
    else folder.file(path, content.base64, { base64: true });
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
};

export type ExportResult = { kind: 'zip'; name: string } | { kind: 'folder'; path: string } | { kind: 'cancelled' };

export const exportProject = async (files: FileMap, slug: string): Promise<ExportResult> => {
  if (isDesktop()) {
    const payload = Object.entries(files).map(([path, content]) =>
      typeof content === 'string' ? { path, content, base64: false } : { path, content: content.base64, base64: true },
    );
    const written = await callDesktop<string | null>('save_project', { folderName: slug, files: payload });
    return written ? { kind: 'folder', path: written } : { kind: 'cancelled' };
  }
  const name = `${slug}.zip`;
  saveAs(await buildZip(files, slug), name);
  return { kind: 'zip', name };
};
