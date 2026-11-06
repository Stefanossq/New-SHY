import { useCallback, useRef, useState } from 'react';
import type { ProjectType } from '../types';
import { orchestrateGeneration, getLifecycleSteps, type GenerationResult } from '../lib/generatorEngine';
import { creditLedger, GENERATION_COST, type CreditLedger } from '../lib/creditLedger';

export type WizardStep = 'selection' | 'theme' | 'generating' | 'result';

export interface GeneratedProject {
  type: ProjectType;
  name: string;
  files: GenerationResult['files'];
}

interface GenerationState {
  step: WizardStep;
  steps: string[];
  currentStepIndex: number;
  /** Message of the step currently running (live feedback for screen readers too). */
  activity: string;
  error: string | null;
  project: GeneratedProject | null;
  lastRequest: { type: ProjectType; theme: string } | null;
}

const INITIAL: GenerationState = {
  step: 'selection',
  steps: [],
  currentStepIndex: 0,
  activity: '',
  error: null,
  project: null,
  lastRequest: null,
};

interface Options {
  ledger?: CreditLedger;
  stepDelayMs?: number;
  /** Pause on the finished pipeline before showing results (ms). */
  settleDelayMs?: number;
}

/**
 * Owns the wizard state machine (selection → theme → generating → result) and
 * wraps each generation in a credit transaction: reserve → commit on success,
 * rollback (refund) on failure or when the user abandons the run.
 */
export function useProjectGeneration({ ledger = creditLedger, stepDelayMs, settleDelayMs = 600 }: Options = {}) {
  const [state, setState] = useState<GenerationState>(INITIAL);
  // Each run gets an id; results from a superseded run (user pressed "Início") are ignored.
  const runIdRef = useRef(0);
  const reservationRef = useRef<string | null>(null);

  const releaseReservation = useCallback(
    (outcome: 'commit' | 'rollback') => {
      const id = reservationRef.current;
      if (!id) return;
      reservationRef.current = null;
      if (outcome === 'commit') ledger.commit(id);
      else ledger.rollback(id);
    },
    [ledger]
  );

  const generate = useCallback(
    async (type: ProjectType, theme = ''): Promise<void> => {
      // Throws InsufficientCreditsError *before* any UI transition — caller shows a toast.
      const reservationId = ledger.reserve(GENERATION_COST, `Geração: ${type}${theme ? ` (${theme})` : ''}`);
      releaseReservation('rollback'); // never leak a previous reservation
      reservationRef.current = reservationId;

      const runId = ++runIdRef.current;
      setState((s) => ({
        ...s,
        step: 'generating',
        steps: getLifecycleSteps(type),
        currentStepIndex: 0,
        activity: '',
        error: null,
        project: null,
        lastRequest: { type, theme },
      }));

      try {
        const result = await orchestrateGeneration(
          type,
          theme,
          (progress) => {
            if (runId !== runIdRef.current) return;
            setState((s) => ({
              ...s,
              // A "success" event means that step is done → advance the cursor past it.
              currentStepIndex: progress.status === 'success' ? progress.stepIndex + 1 : progress.stepIndex,
              activity: progress.message,
              error: progress.status === 'error' ? progress.message : s.error,
            }));
          },
          { stepDelayMs }
        );

        if (runId !== runIdRef.current) return; // abandoned → reset() already refunded
        if (reservationRef.current === reservationId) releaseReservation('commit');

        setState((s) => ({ ...s, project: { type: result.type, name: result.name, files: result.files } }));
        await new Promise((r) => setTimeout(r, settleDelayMs));
        if (runId === runIdRef.current) setState((s) => ({ ...s, step: 'result' }));
      } catch (err: unknown) {
        if (runId !== runIdRef.current) return;
        if (reservationRef.current === reservationId) releaseReservation('rollback');
        const message = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, error: message || 'Ocorreu um erro inesperado durante a geração.' }));
      }
    },
    [ledger, releaseReservation, stepDelayMs, settleDelayMs]
  );

  const goToTheme = useCallback(() => setState((s) => ({ ...s, step: 'theme', error: null })), []);

  const reset = useCallback(() => {
    runIdRef.current++; // invalidate in-flight run
    releaseReservation('rollback');
    setState(INITIAL);
  }, [releaseReservation]);

  const retry = useCallback(async () => {
    const last = state.lastRequest;
    if (last) await generate(last.type, last.theme);
  }, [generate, state.lastRequest]);

  return { ...state, generate, goToTheme, reset, retry };
}
