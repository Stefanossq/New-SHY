/**
 * @file Handles the generation and downloading of project ZIP files.
 */
import { PROJECT_TEMPLATES } from './templates';
import { ProjectType } from '../types';

// JSZip and saveAs are loaded globally from script tags in index.html.
// We declare them here to inform TypeScript about their existence.
declare const JSZip: any;
declare const saveAs: any;

/**
 * Adds files to a JSZip instance from a flat file map.
 * @param zip The JSZip instance.
 * @param files A record where keys are file paths and values are file contents.
 */
const addFilesToZip = (zip: any, files: Record<string, string | { base64: string }>) => {
  for (const [path, content] of Object.entries(files)) {
    // Skip placeholder files
    if (path.endsWith('.placeholder')) continue;

    if (typeof content === 'string') {
      zip.file(path, content);
    } else if (content.base64) {
      zip.file(path, content.base64, { base64: true });
    }
  }
};

/**
 * Generates a ZIP file for the specified project type and initiates download.
 * @param projectType The type of project to generate ('store' or 'blog').
 * @param filesToZip The file map to be included in the zip.
 */
export const generateProjectZip = async (projectType: ProjectType, filesToZip: Record<string, any>): Promise<void> => {
  const project = PROJECT_TEMPLATES[projectType];
  if (!project) {
    throw new Error(`Project template for "${projectType}" not found.`);
  }

  const zip = new JSZip();
  addFilesToZip(zip, filesToZip);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.slug}.zip`);
};
