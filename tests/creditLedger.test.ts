import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCreditLedger,
  createMemoryStorage,
  InsufficientCreditsError,
  LedgerIntegrityError,
  LEDGER_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  DEFAULT_BALANCE,
  type StorageLike,
} from '../lib/creditLedger';

describe('creditLedger (ACID)', () => {
  let storage: StorageLike;
  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it('starts with the default balance and migrates the legacy float key', () => {
    expect(createCreditLedger(storage).getSnapshot().balance).toBe(DEFAULT_BALANCE);

    const legacy = createMemoryStorage();
    legacy.setItem(LEGACY_STORAGE_KEY, '3.7');
    expect(createCreditLedger(legacy).getSnapshot().balance).toBe(3.7);
  });

  it('Atomicity: reserve → commit debits exactly once; rollback refunds in full', () => {
    const ledger = createCreditLedger(storage);
    const r1 = ledger.reserve(1.2, 'gen 1');
    expect(ledger.getSnapshot().balance).toBe(7.6);
    expect(ledger.getSnapshot().pending).toBe(1.2);
    ledger.commit(r1);
    ledger.commit(r1); // idempotent
    expect(ledger.getSnapshot()).toMatchObject({ balance: 7.6, pending: 0 });

    const r2 = ledger.reserve(1.2, 'gen 2');
    ledger.rollback(r2);
    ledger.rollback(r2); // idempotent — no double refund
    expect(ledger.getSnapshot()).toMatchObject({ balance: 7.6, pending: 0 });
  });

  it('Atomicity: a failed write leaves state untouched', () => {
    const ledger = createCreditLedger(storage);
    const failing: StorageLike = {
      getItem: storage.getItem,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const broken = createCreditLedger(failing);
    expect(() => broken.reserve(1, 'x')).toThrow('QuotaExceededError');
    expect(broken.getSnapshot().balance).toBe(DEFAULT_BALANCE);
    expect(ledger.getSnapshot().balance).toBe(DEFAULT_BALANCE);
  });

  it('Consistency: never goes negative and has no float drift', () => {
    const ledger = createCreditLedger(storage);
    for (let i = 0; i < 7; i++) ledger.commit(ledger.reserve(1.2, `run ${i}`));
    expect(ledger.getSnapshot().balance).toBe(0.4); // 8.8 − 7×1.2, exact (no 0.40000000000000036)
    expect(() => ledger.reserve(1.2, 'too much')).toThrow(InsufficientCreditsError);
    expect(ledger.getSnapshot().balance).toBe(0.4);
    expect(() => ledger.credit(-5, 'hack')).toThrow(LedgerIntegrityError);
    expect(() => ledger.credit(Number.NaN, 'nan')).toThrow(LedgerIntegrityError);
  });

  it('Consistency: recovers from a corrupt persisted payload instead of crashing', () => {
    storage.setItem(LEDGER_STORAGE_KEY, '{not json');
    expect(createCreditLedger(storage).getSnapshot().balance).toBe(DEFAULT_BALANCE);

    storage.setItem(LEDGER_STORAGE_KEY, JSON.stringify({ version: 1, balanceTenths: -50, reservations: {}, history: [] }));
    expect(createCreditLedger(storage).getSnapshot().balance).toBeGreaterThanOrEqual(0);
  });

  it('Isolation: two instances (tabs) sharing storage never lose an update', () => {
    const tabA = createCreditLedger(storage);
    const tabB = createCreditLedger(storage); // both loaded the same initial snapshot
    tabA.credit(10, 'A');
    tabB.credit(5, 'B'); // must build on A's write, not on its stale in-memory copy
    tabA.refresh();
    expect(tabA.getSnapshot().balance).toBe(DEFAULT_BALANCE + 15);
    expect(tabB.getSnapshot().balance).toBe(DEFAULT_BALANCE + 15);
    expect(tabB.getSnapshot().version).toBe(2);
  });

  it('Durability: state survives a "restart" and orphaned reservations are refunded', () => {
    let clock = 1_000;
    const ledger = createCreditLedger(storage, () => clock);
    ledger.reserve(1.2, 'tab closed mid-generation');
    expect(ledger.getSnapshot().balance).toBe(7.6);

    clock += 11 * 60 * 1000; // app restarted much later
    const restarted = createCreditLedger(storage, () => clock);
    expect(restarted.getSnapshot().pending).toBe(1.2);
    expect(restarted.recoverStaleReservations()).toBe(1);
    expect(restarted.getSnapshot()).toMatchObject({ balance: DEFAULT_BALANCE, pending: 0 });
    expect(restarted.recoverStaleReservations()).toBe(0);
  });

  it('notifies subscribers and keeps a bounded audit history', () => {
    const ledger = createCreditLedger(storage);
    let calls = 0;
    const unsubscribe = ledger.subscribe(() => calls++);
    for (let i = 0; i < 60; i++) ledger.credit(0.1, `c${i}`);
    unsubscribe();
    ledger.credit(1, 'after unsubscribe');
    expect(calls).toBe(60);
    expect(ledger.getSnapshot().history.length).toBe(50);
    expect(ledger.getSnapshot().history[0].reason).toBe('after unsubscribe');
  });
});
