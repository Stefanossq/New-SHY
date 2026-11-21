import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import plaintext from 'highlight.js/lib/languages/plaintext';
import type { FileMap } from '../../shared/compose';
import { buildTree, languageOf, type TreeNode } from '../lib/fileTree';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('plaintext', plaintext);

const Node = ({ node, depth, open, toggle, selected, select }: {
  node: TreeNode;
  depth: number;
  open: Set<string>;
  toggle: (p: string) => void;
  selected: string;
  select: (p: string) => void;
}) => {
  const pad = { paddingLeft: `${depth * 14 + 8}px` };
  if (!node.children) {
    return (
      <button
        onClick={() => select(node.path)}
        style={pad}
        className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs ${selected === node.path ? 'bg-lav/20 text-lav-soft' : 'text-cream-2 hover:bg-panel-2'}`}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }
  const isOpen = open.has(node.path);
  return (
    <div>
      <button onClick={() => toggle(node.path)} style={pad} className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs text-cream hover:bg-panel-2">
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Folder className="h-3.5 w-3.5 shrink-0 text-lav-soft" />
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen && node.children.map((c) => <Node key={c.path} node={c} depth={depth + 1} open={open} toggle={toggle} selected={selected} select={select} />)}
    </div>
  );
};

export default function FileExplorer({ files }: { files: FileMap }) {
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);
  const [selected, setSelected] = useState('README.md');
  const [open, setOpen] = useState<Set<string>>(() => new Set(['convex', 'src', 'src/app']));
  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const content = files[selected];
  const html = useMemo(() => {
    if (typeof content !== 'string') return null;
    return hljs.highlight(content, { language: languageOf(selected) }).value;
  }, [content, selected]);

  return (
    <div className="grid h-[520px] grid-cols-1 overflow-hidden rounded-2xl border-2 border-line md:grid-cols-[240px_1fr]">
      <nav className="overflow-y-auto border-b border-line bg-panel py-2 md:border-b-0 md:border-r" aria-label="Arquivos do projeto">
        {tree.map((n) => <Node key={n.path} node={n} depth={0} open={open} toggle={toggle} selected={selected} select={setSelected} />)}
      </nav>
      <div className="flex min-w-0 flex-col bg-[#0d1117]">
        <div className="border-b border-line px-4 py-2 font-mono text-xs text-muted">{selected}</div>
        <div className="flex-1 overflow-auto p-4">
          {html !== null ? (
            <pre className="text-xs leading-relaxed"><code className="hljs" dangerouslySetInnerHTML={{ __html: html }} /></pre>
          ) : (
            <p className="text-sm text-muted">Arquivo binário (imagem).</p>
          )}
        </div>
      </div>
    </div>
  );
}
