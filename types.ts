
export type ProjectType = 'store' | 'blog' | 'travel';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  base64Content?: string;
  children?: FileNode[];
}