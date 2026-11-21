import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react';
import type { Step } from '../lib/generate';
import { Button, Notice } from './ui';

export default function GeneratingStep({ steps, error, onBack }: { steps: Step[]; error: string | null; onBack: () => void }) {
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Gerando seu projeto</h1>
      <ul className="mt-6 space-y-3">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-3 rounded-lg border border-line bg-panel px-4 py-3">
            {s.status === 'running' && <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-cyan-300" />}
            {s.status === 'done' && <Check className="mt-0.5 h-5 w-5 text-emerald-400" />}
            {s.status === 'warning' && <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />}
            {(s.status === 'pending' || s.status === 'skipped') && <Circle className="mt-0.5 h-5 w-5 text-gray-600" />}
            <div>
              <p className={s.status === 'pending' ? 'text-gray-500' : 'text-gray-100'}>{s.label}</p>
              {s.detail && <p className="text-xs text-gray-400">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <div className="mt-6 space-y-3">
          <Notice tone="error">{error}</Notice>
          <Button variant="ghost" onClick={onBack}>Voltar e tentar de novo</Button>
        </div>
      )}
    </section>
  );
}
