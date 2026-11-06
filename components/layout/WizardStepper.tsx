import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { WizardStep } from '../../hooks/useProjectGeneration';

interface WizardStepperProps {
  step: WizardStep;
  /** The store flow has an extra "theme" step. */
  includesTheme: boolean;
  hasError?: boolean;
}

/**
 * Shows where the user is in the generation flow (Nielsen #1 — visibility of system status).
 */
export function WizardStepper({ step, includesTheme, hasError = false }: WizardStepperProps) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'selection', label: 'Template' },
    ...(includesTheme ? [{ id: 'theme' as const, label: 'Tema' }] : []),
    { id: 'generating', label: 'Geração' },
    { id: 'result', label: 'Resultado' },
  ];
  const current = Math.max(0, steps.findIndex((s) => s.id === step));

  return (
    <nav aria-label="Progresso do assistente">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const failed = active && hasError;
          return (
            <li key={s.id} className="flex items-center gap-1.5 sm:gap-2">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors',
                  done && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                  active && !failed && 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
                  failed && 'border-red-500/40 bg-red-500/10 text-red-300',
                  !done && !active && 'border-gray-800 text-gray-500'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-[9px]',
                    done ? 'bg-emerald-500 text-gray-950' : active ? (failed ? 'bg-red-500 text-white' : 'bg-cyan-400 text-gray-950') : 'bg-gray-800 text-gray-400'
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn(!active && 'hidden sm:inline')}>{s.label}</span>
              </span>
              {i < steps.length - 1 && <span aria-hidden className={cn('h-px w-3 sm:w-6', done ? 'bg-emerald-500/40' : 'bg-gray-800')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
