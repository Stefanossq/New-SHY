import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProjectGeneration } from '../hooks/useProjectGeneration';
import { createCreditLedger, createMemoryStorage, InsufficientCreditsError } from '../lib/creditLedger';
import * as engine from '../lib/generatorEngine';

const setup = (balance?: number) => {
  const storage = createMemoryStorage();
  const ledger = createCreditLedger(storage);
  if (balance !== undefined) {
    // drain to the requested balance
    const diff = ledger.getSnapshot().balance - balance;
    if (diff > 0) ledger.commit(ledger.reserve(diff, 'setup'));
  }
  const hook = renderHook(() => useProjectGeneration({ ledger, stepDelayMs: 0, settleDelayMs: 0 }));
  return { ledger, hook };
};

describe('useProjectGeneration (wizard + transação de créditos)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sucesso: avança até o resultado e confirma (commit) o débito', async () => {
    const { ledger, hook } = setup();
    await act(() => hook.result.current.generate('blog'));
    await waitFor(() => expect(hook.result.current.step).toBe('result'));
    expect(hook.result.current.project?.type).toBe('blog');
    expect(hook.result.current.currentStepIndex).toBe(hook.result.current.steps.length);
    expect(ledger.getSnapshot()).toMatchObject({ balance: 7.6, pending: 0 });
  });

  it('falha: mostra o erro e estorna (rollback) os créditos', async () => {
    vi.spyOn(engine, 'orchestrateGeneration').mockRejectedValueOnce(new Error('API fora do ar'));
    const { ledger, hook } = setup();
    await act(() => hook.result.current.generate('travel'));
    expect(hook.result.current.step).toBe('generating');
    expect(hook.result.current.error).toBe('API fora do ar');
    expect(ledger.getSnapshot()).toMatchObject({ balance: 8.8, pending: 0 });
    expect(ledger.getSnapshot().history[0].kind).toBe('rollback');
  });

  it('retry reaproveita o último pedido', async () => {
    const spy = vi.spyOn(engine, 'orchestrateGeneration').mockRejectedValueOnce(new Error('timeout'));
    const { hook } = setup();
    await act(() => hook.result.current.generate('blog'));
    spy.mockRestore();
    await act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.step).toBe('result'));
  });

  it('saldo insuficiente: rejeita antes de mudar de tela e não debita nada', async () => {
    const { ledger, hook } = setup(0.5);
    await expect(hook.result.current.generate('blog')).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(hook.result.current.step).toBe('selection');
    expect(ledger.getSnapshot().balance).toBe(0.5);
  });

  it('reset durante a geração cancela a execução e estorna', async () => {
    let release!: () => void;
    vi.spyOn(engine, 'orchestrateGeneration').mockImplementationOnce(
      () => new Promise((resolve) => (release = () => resolve({ type: 'blog', name: 'x', files: {}, lifecycle: [] })))
    );
    const { ledger, hook } = setup();
    let pending!: Promise<void>;
    act(() => {
      pending = hook.result.current.generate('blog');
    });
    await waitFor(() => expect(ledger.getSnapshot().pending).toBe(1.2));
    act(() => hook.result.current.reset());
    expect(ledger.getSnapshot()).toMatchObject({ balance: 8.8, pending: 0 });
    await act(async () => {
      release();
      await pending;
    });
    // The late result of the abandoned run is ignored and nothing is charged.
    expect(hook.result.current.step).toBe('selection');
    expect(ledger.getSnapshot().balance).toBe(8.8);
  });
});
