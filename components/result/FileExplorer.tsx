import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Copy, Check, FileCode2, FileText, FileImage, FileJson, Folder, FolderOpen, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { FileNode } from '../../types';
import { buildFileTree, countFiles } from '../../lib/utils';
import { getFileLanguage, highlightCode } from '../../lib/highlight';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';

const fileIcon = (name: string) => {
  if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(name)) return FileImage;
  if (/\.json$/i.test(name)) return FileJson;
  if (/\.(md|txt)$/i.test(name)) return FileText;
  return FileCode2;
};

/** Depth-first: prefer a page/component or README as the initial file. */
const findInitialFile = (nodes: FileNode[]): FileNode | null => {
  const all: FileNode[] = [];
  const walk = (list: FileNode[]) => list.forEach((n) => (n.type === 'file' ? all.push(n) : walk(n.children ?? [])));
  walk(nodes);
  return all.find((n) => n.name === 'README.md') ?? all.find((n) => n.name.endsWith('.tsx')) ?? all[0] ?? null;
};

/** Keeps files whose path matches the query, plus the folders leading to them. */
const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.flatMap((n) => {
    if (n.type === 'file') return (n.path ?? n.name).toLowerCase().includes(q) ? [n] : [];
    const children = filterTree(n.children ?? [], query);
    return children.length ? [{ ...n, children }] : [];
  });
};

interface TreeItemProps {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  forceOpen: boolean;
  onSelect: (node: FileNode) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedPath, forceOpen, onSelect }) => {
  const [open, setOpen] = useState(level < 1);
  const isFolder = node.type === 'folder';
  const expanded = isFolder && (open || forceOpen);
  const selected = !isFolder && node.path === selectedPath;
  const Icon = isFolder ? (expanded ? FolderOpen : Folder) : fileIcon(node.name);

  return (
    <li role="treeitem" aria-expanded={isFolder ? expanded : undefined} aria-selected={selected || undefined}>
      <button
        type="button"
        onClick={() => (isFolder ? setOpen((o) => !o) : onSelect(node))}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[12px] transition-colors cursor-pointer',
          selected ? 'bg-cyan-500/15 text-cyan-200' : 'text-gray-300 hover:bg-gray-800/60'
        )}
        style={{ paddingLeft: `${level * 0.85 + 0.35}rem` }}
        title={node.path}
      >
        {isFolder ? (
          <ChevronRight className={cn('h-3 w-3 shrink-0 text-gray-500 transition-transform', expanded && 'rotate-90')} />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isFolder ? 'text-cyan-400' : 'text-gray-500')} />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && node.children && (
        <ul role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.path ?? child.name}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              forceOpen={forceOpen}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const FileExplorer: React.FC<{ files: Record<string, any> }> = ({ files }) => {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const total = useMemo(() => countFiles(tree), [tree]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setSelected(findInitialFile(tree)), [tree]);

  const visible = useMemo(() => filterTree(tree, query.trim()), [tree, query]);
  const language = selected ? getFileLanguage(selected.name) : 'plaintext';
  const content = selected?.content ?? '';
  const html = useMemo(() => (selected?.content ? highlightCode(selected.content, language) : ''), [selected, language]);
  const lineCount = content ? content.split('\n').length : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar para a área de transferência.');
    }
  };

  return (
    <div className="flex h-[65vh] flex-col gap-3 md:h-[560px] md:flex-row">
      <aside className="flex h-1/3 flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950/60 md:h-full md:w-72">
        <div className="border-b border-gray-800 p-2">
          <label className="relative block">
            <span className="sr-only">Filtrar arquivos</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filtrar ${total} arquivos…`}
              className="h-8 w-full rounded-md border border-gray-800 bg-gray-900 pl-8 pr-2 text-xs text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
          </label>
        </div>
        <ul role="tree" aria-label="Arquivos do projeto" className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
          {visible.map((node) => (
            <TreeItem
              key={node.path ?? node.name}
              node={node}
              level={0}
              selectedPath={selected?.path ?? null}
              forceOpen={query.trim().length > 0}
              onSelect={setSelected}
            />
          ))}
          {visible.length === 0 && <li className="p-4 text-center text-xs text-gray-500">Nenhum arquivo corresponde ao filtro.</li>}
        </ul>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950/80">
        {selected ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/70 px-4 py-2">
              <span className="truncate font-mono text-[11px] text-gray-400" data-testid="selected-file-path">
                {selected.path ?? selected.name}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400">{language}</span>
                {lineCount > 0 && <span className="hidden text-[10px] text-gray-500 sm:inline">{lineCount} linhas</span>}
                {!selected.base64Content && (
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopy} aria-label="Copiar conteúdo do arquivo">
                    {copied ? <Check className="text-emerald-400" /> : <Copy />}
                  </Button>
                )}
              </div>
            </header>
            {selected.base64Content ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <img
                  src={`data:${selected.name.endsWith('.svg') ? 'image/svg+xml' : 'image/png'};base64,${selected.base64Content}`}
                  alt={selected.name}
                  className="max-h-full max-w-full rounded-lg border border-gray-800"
                />
              </div>
            ) : (
              <pre className="flex-1 overflow-auto p-4 custom-scrollbar">
                <code
                  className={`hljs language-${language} block !bg-transparent text-[12px] leading-relaxed`}
                  // highlight.js HTML-escapes the source before wrapping tokens, so this is safe.
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </pre>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-gray-500">Selecione um arquivo para visualizar.</div>
        )}
      </section>
    </div>
  );
};
