import { useState } from 'react';
import { Download, FolderDown, RotateCcw } from 'lucide-react';
import { APPS, FEATURES, envFor, type AppId, type FeatureId } from '../../shared/catalog';
import type { Palette } from '../../shared/content';
import type { GenerationResult } from '../lib/generate';
import { exportProject, isDesktop } from '../lib/platform';
import FileExplorer from './FileExplorer';
import { Button, Card, Notice } from './ui';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SWATCHES: { key: keyof Palette; label: string }[] = [
  { key: 'background', label: 'Fundo' },
  { key: 'surface', label: 'Cartões' },
  { key: 'text', label: 'Texto' },
  { key: 'muted', label: 'Secundário' },
  { key: 'accent', label: 'Destaque' },
  { key: 'accentText', label: 'Sobre destaque' },
];

/** Prévia do site com a paleta e os textos gerados (o que o cliente vai ver ao abrir o projeto). */
const SitePreview = ({ result }: { result: GenerationResult }) => {
  const { palette: p, copy } = result.brand;
  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-ink" style={{ background: p.background, color: p.text, fontFamily: 'system-ui, sans-serif' }}>
      <div className="flex items-center justify-between px-5 py-3 text-sm" style={{ background: p.surface }}>
        <b>{result.brand.name}</b>
        <span style={{ color: p.muted }}>Entrar</span>
      </div>
      <div className="px-6 py-8 text-center">
        <p className="text-2xl font-bold">{copy.heroTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: p.muted }}>{copy.heroSubtitle}</p>
        <span className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: p.accent, color: p.accentText }}>
          {copy.ctaLabel}
        </span>
      </div>
      <div className="mx-5 mb-5 rounded-xl p-4 text-sm" style={{ background: p.surface }}>
        <p className="font-semibold">{copy.aboutTitle}</p>
        <p className="mt-1" style={{ color: p.muted }}>{copy.aboutText}</p>
      </div>
    </div>
  );
};

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
    <section className="space-y-8">
      <div className="relative">
        <img src="/gato/cat-peek.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -top-2 right-6 hidden w-56 -translate-y-full md:block" />
        <div className="gp-frame">
          <div className="gp-card flex flex-wrap items-center justify-between gap-5 p-6">
            <div>
              <p className="text-lg text-[#5a5560]">{def.name} pronto</p>
              <h1 className="gp-title text-5xl">{result.brand.name}</h1>
              <p className="mt-1 text-xl">{result.brand.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-hand text-xl text-ink transition hover:-rotate-1">
                <RotateCcw className="h-4 w-4" /> Novo projeto
              </button>
              <Button onClick={save} disabled={busy} className="!shadow-[0_6px_0_0_#00000055]">
                {isDesktop() ? <FolderDown className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                {isDesktop() ? 'Salvar em uma pasta' : 'Baixar .zip'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {status && <Notice tone={status.tone}>{status.text}</Notice>}
      {result.contentSource === 'sample' && (
        <Notice tone="warning">
          Parte do conteúdo usa dados de exemplo.
          {result.warnings.length > 0 && <ul className="mt-2 list-disc pl-5">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="gp-title text-3xl">Cara do site</h2>
          <p className="mt-1 text-lg text-cream-2">Paleta e textos que vão no projeto (em <code>src/lib/site.ts</code>).</p>
          <div className="mt-4">
            <SitePreview result={result} />
          </div>
        </Card>
        <Card>
          <h2 className="gp-title text-3xl">Paleta</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SWATCHES.map((s) => (
              <li key={s.key} className="flex items-center gap-3">
                <span className="h-10 w-10 shrink-0 rounded-xl border-[3px] border-ink" style={{ background: result.brand.palette[s.key] }} />
                <span className="leading-tight">
                  {s.label}
                  <br />
                  <code className="text-sm text-muted">{result.brand.palette[s.key]}</code>
                </span>
              </li>
            ))}
          </ul>
          {result.fields.length > 0 && (
            <>
              <h2 className="gp-title mt-8 text-3xl">Campos dos produtos</h2>
              <p className="mt-1 text-lg text-cream-2">Escolhidos pela IA para o seu negócio; aparecem na página do produto e no painel admin.</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {result.fields.map((f) => (
                  <li key={f.key} className="rounded-full border-2 border-lav-soft/60 px-3 py-1 text-lg">
                    {f.label}
                    {f.unit && <span className="text-muted"> ({f.unit})</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {result.products.length > 0 && (
        <Card>
          <h2 className="gp-title text-3xl">Catálogo inicial</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {result.products.map((p, i) => (
              <div key={p.name} className="gp-frame">
                <div className="gp-card h-full overflow-hidden">
                  <img src={result.images[i]?.url} alt={p.name} className="aspect-square w-full border-b-[3px] border-ink object-cover" />
                  <div className="p-3">
                    <p className="gp-title text-xl">{p.name}</p>
                    <p className="text-base text-[#3b3740]">{p.category} · {brl(p.price)}</p>
                    {result.fields.map((f) => (
                      <p key={f.key} className="text-sm text-[#5a5560]">
                        {f.label}: {String(p.attributes[f.key] ?? '—')}{f.unit ? ` ${f.unit}` : ''}
                      </p>
                    ))}
                    {result.images[i]?.isPlaceholder && <p className="mt-1 text-sm text-[#a0611a]">imagem provisória</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <FileExplorer files={result.files} />
        <Card className="space-y-5 text-lg">
          <div>
            <h2 className="gp-title text-2xl">Incluído</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-cream-2">
              <li>{def.stack.join(', ')}</li>
              <li>Login, painel admin restrito (ADMIN_USER_IDS)</li>
              {features.map((f) => <li key={f}>{FEATURES[f].label}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="gp-title text-2xl">Próximos passos</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-cream-2">
              <li><code>npm install</code></li>
              <li><code>npx convex dev</code></li>
              <li>Preencher <code>.env.local</code> e as variáveis do Convex</li>
              {def.generatesProducts && <li><code>npx convex run products:seed</code></li>}
              <li><code>npm run dev</code></li>
            </ol>
            <p className="mt-2 text-muted">O README do projeto explica cada passo.</p>
          </div>
          <div>
            <h2 className="gp-title text-2xl">Variáveis necessárias</h2>
            <ul className="mt-2 space-y-1 font-mono text-sm text-muted">
              {envFor(app, features).map((v) => <li key={v.name}>{v.name}</li>)}
            </ul>
          </div>
        </Card>
      </div>
    </section>
  );
}
