import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Cpu, RotateCcw, ArrowLeft, Sliders } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from './ui/button';

interface GenerationScreenProps {
  projectName: string;
  lifecycleSteps: string[];
  /** Index of the step currently running; equals `lifecycleSteps.length` when all are done. */
  currentStepIndex: number;
  /** Live message from the engine for the running step. */
  activity?: string;
  errorDetail?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
}

export const computeProgress = (currentStepIndex: number, total: number): number =>
  total <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((currentStepIndex / total) * 100)));

const GenerationScreen: React.FC<GenerationScreenProps> = ({
  projectName,
  lifecycleSteps,
  currentStepIndex,
  activity,
  errorDetail,
  onRetry,
  onBack,
  onOpenSettings,
}) => {
  const total = lifecycleSteps.length;
  const progress = computeProgress(currentStepIndex, total);
  const finished = total > 0 && currentStepIndex >= total;

  return (
    <section
      aria-labelledby="generation-title"
      className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl shadow-black/30 md:p-8"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              errorDetail
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : finished
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
            )}
          >
            {errorDetail ? <AlertCircle className="h-5 w-5" /> : finished ? <CheckCircle2 className="h-5 w-5" /> : <Cpu className="h-5 w-5 animate-pulse" />}
          </div>
          <div className="min-w-0">
            <h2 id="generation-title" className="text-base font-bold text-white">
              {errorDetail ? 'A geração falhou' : finished ? 'Projeto pronto!' : 'Compondo seu projeto'}
            </h2>
            <p className="truncate text-xs text-gray-400">{projectName}</p>
          </div>
        </div>
        <div className="font-mono text-2xl font-bold tabular-nums text-cyan-300" aria-hidden>
          {progress}%
        </div>
      </header>

      <div
        role="progressbar"
        aria-label="Progresso da geração"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-950"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            errorDetail ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600'
          )}
          style={{ width: `${Math.max(progress, 3)}%` }}
        />
        {!errorDetail && !finished && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        )}
      </div>

      {/* Screen readers hear each new activity without having to re-scan the list. */}
      <p aria-live="polite" className="min-h-[1rem] truncate font-mono text-[11px] text-gray-500">
        {errorDetail ? '' : activity}
      </p>

      <ol className="space-y-1.5">
        {lifecycleSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex && !errorDetail;
          const isFailed = index === currentStepIndex && Boolean(errorDetail);
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors',
                isActive && 'border-cyan-800/50 bg-cyan-950/30 text-cyan-200',
                isFailed && 'border-red-800/50 bg-red-950/30 text-red-300',
                isCompleted && 'border-transparent text-gray-300',
                !isActive && !isFailed && !isCompleted && 'border-transparent text-gray-600'
              )}
            >
              <span className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                ) : isFailed ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-700 text-[9px]">{index + 1}</span>
                )}
              </span>
              <span className={cn('truncate', isActive && 'font-semibold')}>{step}</span>
            </li>
          );
        })}
      </ol>

      {errorDetail && (
        <div role="alert" className="space-y-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-200">
          <p className="break-words font-mono text-[11px] opacity-90">{errorDetail}</p>
          <p className="text-[11px] text-gray-400">
            Seus créditos desta tentativa foram <strong className="text-gray-200">estornados automaticamente</strong>. Sem chave de API? Use o
            modo offline (Mock) nas configurações.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {onRetry && (
              <Button variant="primary" onClick={onRetry}>
                <RotateCcw /> Tentar novamente
              </Button>
            )}
            {onOpenSettings && (
              <Button variant="secondary" onClick={onOpenSettings}>
                <Sliders /> Configurar provedor
              </Button>
            )}
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft /> Voltar ao início
              </Button>
            )}
          </div>
        </div>
      )}

      {!errorDetail && (
        <footer className="flex items-center justify-between border-t border-gray-800 pt-3 text-[11px] text-gray-500">
          <span>
            Etapa {Math.min(currentStepIndex + 1, Math.max(total, 1))} de {Math.max(total, 1)}
          </span>
          {onBack && !finished && (
            <button type="button" onClick={onBack} className="text-gray-400 underline-offset-2 hover:text-white hover:underline cursor-pointer">
              Cancelar e estornar créditos
            </button>
          )}
        </footer>
      )}
    </section>
  );
};

export default GenerationScreen;
