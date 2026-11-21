/** Converte o mapa plano de arquivos em árvore para o explorador. */
export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

export const buildTree = (paths: string[]): TreeNode[] => {
  const root: TreeNode = { name: '', path: '', children: [] };
  for (const path of paths) {
    const parts = path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const childPath = parts.slice(0, i + 1).join('/');
      let child = node.children!.find((c) => c.name === part && Boolean(c.children) === !isFile);
      if (!child) {
        child = isFile ? { name: part, path: childPath } : { name: part, path: childPath, children: [] };
        node.children!.push(child);
      }
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .sort((a, b) => (Boolean(a.children) === Boolean(b.children) ? a.name.localeCompare(b.name) : a.children ? -1 : 1))
      .map((n) => (n.children ? { ...n, children: sort(n.children) } : n));
  return sort(root.children!);
};

const LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  json: 'json',
  css: 'css',
  md: 'markdown',
  svg: 'xml',
  html: 'xml',
};

export const languageOf = (path: string) => LANG[path.split('.').pop() ?? ''] ?? 'plaintext';
