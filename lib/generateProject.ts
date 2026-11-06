/**
 * @file Handles the generation and downloading of project ZIP files.
 *
 * JSZip / FileSaver are now bundled from npm instead of global CDN <script> tags,
 * so exporting also works offline inside the Tauri desktop build.
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PROJECT_TEMPLATES } from './templates';
import { ProjectType } from '../types';
import { sanitizeRelativePath, type ProjectFiles } from './utils';

/**
 * Builds the ZIP archive. Pure (no download side effect) so it can be unit-tested.
 * Validates every path *before* writing anything (all-or-nothing): an unsafe path
 * aborts the whole export instead of producing a partial archive.
 */
export const buildProjectZip = async (files: ProjectFiles): Promise<JSZip> => {
  const entries: Array<[string, ProjectFiles[string]]> = [];
  for (const [rawPath, content] of Object.entries(files)) {
    if (rawPath.endsWith('.placeholder')) continue;
    const safePath = sanitizeRelativePath(rawPath);
    if (!safePath) throw new Error(`Caminho de arquivo inseguro no projeto: "${rawPath}"`);
    entries.push([safePath, content]);
  }

  const zip = new JSZip();
  for (const [path, content] of entries) {
    if (typeof content === 'string') zip.file(path, content);
    else if (content && typeof content.base64 === 'string') zip.file(path, content.base64, { base64: true });
  }
  return zip;
};

/**
 * Generates a ZIP file for the specified project type and initiates download.
 */
export const generateProjectZip = async (projectType: ProjectType, filesToZip: ProjectFiles): Promise<void> => {
  const project = PROJECT_TEMPLATES[projectType];
  if (!project) {
    throw new Error(`Project template for "${projectType}" not found.`);
  }
  const zip = await buildProjectZip(filesToZip);
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.slug}.zip`);
};
