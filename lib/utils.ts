/**
 * @file Contains utility functions for the application.
 */
import { FileNode } from '../types';

/**
 * Converts a flat map of file paths to a nested FileNode tree structure.
 * This is used by the UI to render the file explorer component.
 * @param files A record where keys are file paths (e.g., 'src/app/page.tsx').
 * @returns An array of FileNode objects representing the root of the file tree.
 */
export const buildFileTree = (files: Record<string, any> = {}): FileNode[] => {
  if (!files || typeof files !== 'object') return [];
  const root: { [key: string]: FileNode } = {};

  const sortedPaths = Object.keys(files).sort((a, b) => a.localeCompare(b));

  for (const path of sortedPaths) {
     if (path.endsWith('.placeholder')) continue;

    let currentLevel = root;
    const parts = path.split('/');

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          type: isLastPart ? 'file' : 'folder',
          children: isLastPart ? undefined : [],
        };

        if (isLastPart) {
           const content = files[path];
            if (typeof content === 'string') {
                currentLevel[part].content = content;
            } else if (content.base64) {
                currentLevel[part].base64Content = content.base64;
            }
        }
      }

      if (!isLastPart) {
        const folderNode = currentLevel[part];
        if (folderNode.type === 'folder' && folderNode.children) {
            // Create a new object for the next level if it doesn't exist
            const nextLevel: { [key: string]: FileNode } = {};
            folderNode.children.forEach(child => nextLevel[child.name] = child);
            currentLevel = nextLevel;
        }
      }
    });
  }

  // Convert the root object back to a sorted array
  const fileNodes = Object.values(root);
  fileNodes.forEach(node => {
      if (node.type === 'folder' && node.children) {
          node.children = Object.values(node.children).sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'folder' ? -1 : 1;
          });
      }
  });

   return fileNodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });
};
