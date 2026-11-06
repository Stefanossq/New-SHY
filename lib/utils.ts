/**
 * @file Contains utility functions for the application.
 */
import { FileNode } from '../types';

export type ProjectFileContent = string | { base64: string };
export type ProjectFiles = Record<string, ProjectFileContent>;

const byFoldersFirst = (a: FileNode, b: FileNode) =>
  a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1;

const sortTree = (nodes: FileNode[]): FileNode[] => {
  nodes.sort(byFoldersFirst);
  for (const node of nodes) {
    if (node.children) sortTree(node.children);
  }
  return nodes;
};

/**
 * Converts a flat map of file paths to a nested FileNode tree structure.
 * This is used by the UI to render the file explorer component.
 *
 * Previous implementation copied each folder's children into a throw-away lookup
 * object, so every file below the first level was silently dropped from the tree.
 *
 * @param files A record where keys are file paths (e.g., 'src/app/page.tsx').
 * @returns An array of FileNode objects representing the root of the file tree.
 */
export const buildFileTree = (files: Record<string, any> = {}): FileNode[] => {
  if (!files || typeof files !== 'object') return [];

  const root: FileNode[] = [];
  // Index folders by their full path so lookups are O(1) and children arrays are shared by reference.
  const folders = new Map<string, FileNode>();

  for (const path of Object.keys(files)) {
    if (path.endsWith('.placeholder')) continue;
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let siblings = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (isFile) {
        const content = files[path];
        const node: FileNode = { name: part, path: currentPath, type: 'file' };
        if (typeof content === 'string') node.content = content;
        else if (content && typeof content.base64 === 'string') node.base64Content = content.base64;
        siblings.push(node);
        return;
      }

      let folder = folders.get(currentPath);
      if (!folder) {
        folder = { name: part, path: currentPath, type: 'folder', children: [] };
        folders.set(currentPath, folder);
        siblings.push(folder);
      }
      siblings = folder.children!;
    });
  }

  return sortTree(root);
};

/** Counts files (not folders) in a tree. */
export const countFiles = (nodes: FileNode[]): number =>
  nodes.reduce((acc, n) => acc + (n.type === 'file' ? 1 : countFiles(n.children ?? [])), 0);

/**
 * Normalises a relative project path and rejects anything that could escape the
 * export root (path traversal: `../`, absolute paths, drive letters, NUL bytes).
 * Returns `null` for unsafe paths.
 */
export const sanitizeRelativePath = (path: string): string | null => {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) return null;
  const normalised = path.replace(/\\/g, '/');
  if (normalised.startsWith('/') || /^[a-zA-Z]:/.test(normalised)) return null;
  const segments = normalised.split('/').filter((s) => s !== '' && s !== '.');
  if (segments.length === 0 || segments.some((s) => s === '..')) return null;
  return segments.join('/');
};

/** Decodes a base64 string into raw bytes (browser + Node). */
export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};
