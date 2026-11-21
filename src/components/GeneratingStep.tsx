import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react';
import type { Step } from '../lib/generate';
import { Button, Notice, ScreenTitle } from './ui';

export default function GeneratingStep({ steps, error, onBack }: { steps: Step[]; error: string | null; onBack: () => void }) {
  const done = !error && steps.length > 0 && steps.every((s) => s.status !== 'pending' && s.status !== 'running');
  return (
    <section className="max-w-2xl">
      <ScreenTitle sub={error ? 'Algo deu errado no caminho.' : done ? 'Quase lá…' : 'O gato está trabalhando. Pode levar um minutinho.'}>
        Gerando seu projeto
      </ScreenTitle>
      <ul className="mt-8 space-y-3">
        {steps.map((s) => (
          <li key={s.id} className="gp-panel flex items-start gap-3 px-5 py-4">
            {s.status === 'running' && <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-lav-soft" />}
            {s.status === 'done' && <Check className="mt-1 h-5 w-5 shrink-0 text-ok" strokeWidth={3} />}
            {s.status === 'warning' && <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-warn" />}
            {(s.status === 'pending' || s.status === 'skipped') && <Circle className="mt-1 h-5 w-5 shrink-0 text-line" />}
            <div>
              <p className={`text-xl ${s.status === 'pending' ? 'text-muted' : 'text-cream'}`}>{s.label}</p>
              {s.detail && <p className="text-base text-cream-2">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
      <img src="/gato/cat-sleep.webp" alt="" aria-hidden="true" className="mt-8 w-full max-w-[420px] opacity-90" />
      {error && (
        <div className="mt-6 space-y-4">
          <Notice tone="error">{error}</Notice>
          <Button variant="ghost" onClick={onBack}>Voltar e tentar de novo</Button>
        </div>
      )}
    </section>
  );
}
