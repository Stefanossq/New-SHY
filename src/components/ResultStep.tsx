import { useState } from 'react';
import { Download, FolderDown, RotateCcw } from 'lucide-react';
import { APPS, FEATURES, envFor, type AppId, type FeatureId } from '../../shared/catalog';
import type { GenerationResult } from '../lib/generate';
import { exportProject, isDesktop } from '../lib/platform';
import FileExplorer from './FileExplorer';
import { Button, Card, Notice } from './ui';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ResultStep({ app, features, result, onRestart }: {
  app: AppId;
  features: FeatureId[];
  result: GenerationResult;
  onRestart: () => void;
}) {
  const [status, setStatus] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const def = APPS[app];

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const r = await exportProject(result.files, result.slug);
      if (r.kind === 'zip') setStatus({ tone: 'info', text: `Baixado: ${r.name}` });
      if (r.kind === 'folder') setStatus({ tone: 'info', text: `Projeto salvo em ${r.path}` });
    } catch (err) {
      setStatus({ tone: 'error', text: `Não foi possível salvar: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{def.name}</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl" style={{ color: result.brand.accentColor }}>{result.brand.name}</h1>
          <p className="mt-1 text-gray-300">{result.brand.tagline}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onRestart}><RotateCcw className="h-4 w-4" /> Novo projeto</Button>
          <Button onClick={save} disabled={busy}>
            {isDesktop() ? <FolderDown className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isDesktop() ? 'Salvar em uma pasta' : 'Baixar .zip'}
          </Button>
        </div>
      </div>

      {status && <Notice tone={status.tone}>{status.text}</Notice>}
      {result.contentSource === 'sample' && (
        <Notice tone="warning">
          Parte do conteúdo usa dados de exemplo.
          {result.warnings.length > 0 && <ul className="mt-2 list-disc pl-5">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
        </Notice>
      )}

      {result.products.length > 0 && (
        <Card>
          <h2 className="font-semibold text-white">Catálogo inicial</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.products.map((p, i) => (
              <div key={p.name} className="overflow-hidden rounded-lg border border-line">
                <img src={result.images[i]?.url} alt={p.name} className="aspect-square w-full object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.category} · {brl(p.price)}</p>
                  {result.images[i]?.isPlaceholder && <p className="mt-1 text-[11px] text-amber-300">imagem provisória</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <FileExplorer files={result.files} />
        <Card className="space-y-4 text-sm">
          <div>
            <h2 className="font-semibold text-white">Incluído</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
              <li>{def.stack.join(', ')}</li>
              <li>Login, painel admin restrito (ADMIN_USER_IDS)</li>
              {features.map((f) => <li key={f}>{FEATURES[f].label}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-white">Próximos passos</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-gray-300">
              <li><code>npm install</code></li>
              <li><code>npx convex dev</code></li>
              <li>Preencher <code>.env.local</code> e as variáveis do Convex</li>
              {def.generatesProducts && <li><code>npx convex run products:seed</code></li>}
              <li><code>npm run dev</code></li>
            </ol>
            <p className="mt-2 text-gray-500">O README do projeto explica cada passo.</p>
          </div>
          <div>
            <h2 className="font-semibold text-white">Variáveis necessárias</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-gray-400">
              {envFor(app, features).map((v) => <li key={v.name}>{v.name}</li>)}
            </ul>
          </div>
        </Card>
      </div>
    </section>
  );
}
