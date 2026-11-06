/**
 * @file Transactional credit ledger (single source of truth for the studio wallet).
 *
 * Why: credits used to be a bare float in localStorage written from two places
 * (App debited before generation, ResultScreen re-wrote it from its own state),
 * failed generations were never refunded and floating-point drift accumulated.
 *
 * ACID properties, within the limits of Web Storage:
 *  - Atomicity:   every operation runs through `transact()`, which builds the next
 *                 state on a copy and persists it with ONE `setItem`. If validation
 *                 or the write fails (e.g. QuotaExceededError) nothing changes.
 *                 Generation uses reserve → commit / rollback (two-phase debit).
 *  - Consistency: invariants are checked before every write (integer tenths,
 *                 balance ≥ 0, reservations reference positive amounts). Corrupt
 *                 or legacy payloads are migrated/recovered instead of crashing.
 *  - Isolation:   the latest persisted state is re-read synchronously inside the
 *                 transaction, so concurrent tabs never overwrite each other with
 *                 stale snapshots; a monotonically increasing `version` lets
 *                 subscribers ignore out-of-order events.
 *  - Durability:  state is persisted synchronously before the call returns and
 *                 reservations left behind by a crash/closed tab are refunded by
 *                 `recoverStaleReservations()` on the next start.
 */

export const LEDGER_STORAGE_KEY = 'scaffold_credit_ledger_v1';
export const LEGACY_STORAGE_KEY = 'user_generator_credits';
export const DEFAULT_BALANCE = 8.8;
export const GENERATION_COST = 1.2;
const MAX_HISTORY = 50;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LedgerEntryKind = 'reserve' | 'commit' | 'rollback' | 'credit' | 'recover';

export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  /** Signed delta in tenths of a credit (negative = debit). */
  deltaTenths: number;
  reason: string;
  at: number;
}

interface Reservation {
  amountTenths: number;
  reason: string;
  createdAt: number;
}

export interface LedgerState {
  version: number;
  /** Available balance in integer tenths of a credit — avoids float drift (0.1 + 0.2). */
  balanceTenths: number;
  reservations: Record<string, Reservation>;
  history: LedgerEntry[];
}

export interface LedgerSnapshot {
  version: number;
  balance: number;
  pending: number;
  history: readonly LedgerEntry[];
}

export class InsufficientCreditsError extends Error {
  constructor(public readonly required: number, public readonly available: number) {
    super(`Créditos insuficientes: necessário ${required.toFixed(1)} cr, disponível ${available.toFixed(1)} cr.`);
    this.name = 'InsufficientCreditsError';
  }
}

export class LedgerIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerIntegrityError';
  }
}

export const toTenths = (credits: number): number => Math.round(credits * 10);
export const fromTenths = (tenths: number): number => tenths / 10;

const isNonNegativeInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

export function validateState(state: LedgerState): void {
  if (!isNonNegativeInt(state.version)) throw new LedgerIntegrityError('Versão do ledger inválida.');
  if (!isNonNegativeInt(state.balanceTenths)) throw new LedgerIntegrityError('Saldo não pode ser negativo ou fracionado.');
  for (const [id, r] of Object.entries(state.reservations)) {
    if (!r || !Number.isInteger(r.amountTenths) || r.amountTenths <= 0) {
      throw new LedgerIntegrityError(`Reserva ${id} possui valor inválido.`);
    }
  }
}

const initialState = (balance = DEFAULT_BALANCE): LedgerState => ({
  version: 0,
  balanceTenths: toTenths(balance),
  reservations: {},
  history: [],
});

let idCounter = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

/** In-memory fallback for SSR, tests, private mode or when storage access throws. */
export const createMemoryStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

export interface CreditLedger {
  getSnapshot(): LedgerSnapshot;
  subscribe(listener: () => void): () => void;
  reserve(amount: number, reason: string): string;
  commit(reservationId: string): void;
  rollback(reservationId: string): void;
  credit(amount: number, reason: string): void;
  recoverStaleReservations(maxAgeMs?: number): number;
  /** Re-read storage (used by the cross-tab `storage` event). */
  refresh(): void;
}

export function createCreditLedger(storage: StorageLike, now: () => number = Date.now): CreditLedger {
  const listeners = new Set<() => void>();

  const load = (): LedgerState => {
    let raw: string | null = null;
    try {
      raw = storage.getItem(LEDGER_STORAGE_KEY);
    } catch {
      raw = null;
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LedgerState;
        const state: LedgerState = {
          version: parsed.version,
          balanceTenths: parsed.balanceTenths,
          reservations: parsed.reservations ?? {},
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
        validateState(state);
        return state;
      } catch {
        // Corrupt payload: fall through to migration/default instead of crashing the UI.
      }
    }

    // Migrate the legacy float balance once.
    try {
      const legacy = storage.getItem(LEGACY_STORAGE_KEY);
      const legacyValue = legacy !== null ? Number.parseFloat(legacy) : Number.NaN;
      if (Number.isFinite(legacyValue) && legacyValue >= 0) return initialState(legacyValue);
    } catch {
      /* ignore */
    }
    return initialState();
  };

  let current = load();
  let snapshot = toSnapshot(current);

  function toSnapshot(state: LedgerState): LedgerSnapshot {
    const pending = Object.values(state.reservations).reduce((acc, r) => acc + r.amountTenths, 0);
    return {
      version: state.version,
      balance: fromTenths(state.balanceTenths),
      pending: fromTenths(pending),
      history: state.history,
    };
  }

  const emit = () => listeners.forEach((l) => l());

  /** The only write path. Builds next state from the *latest persisted* state, validates, persists once. */
  const transact = (mutate: (draft: LedgerState) => LedgerEntry | null): void => {
    const base = load(); // isolation: never mutate a stale in-memory snapshot
    const draft: LedgerState = {
      version: base.version,
      balanceTenths: base.balanceTenths,
      reservations: { ...base.reservations },
      history: [...base.history],
    };

    const entry = mutate(draft); // may throw → nothing persisted
    if (!entry) return;

    draft.version = base.version + 1;
    draft.history = [entry, ...draft.history].slice(0, MAX_HISTORY);
    validateState(draft);

    storage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(draft)); // single atomic write
    try {
      // Keep the legacy key readable for older builds (best effort, not part of the transaction).
      storage.setItem(LEGACY_STORAGE_KEY, fromTenths(draft.balanceTenths).toFixed(1));
    } catch {
      /* ignore */
    }

    current = draft;
    snapshot = toSnapshot(current);
    emit();
  };

  const assertAmount = (amount: number) => {
    if (!Number.isFinite(amount) || toTenths(amount) <= 0) {
      throw new LedgerIntegrityError('O valor da operação deve ser positivo.');
    }
  };

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reserve(amount, reason) {
      assertAmount(amount);
      const id = newId('rsv');
      transact((draft) => {
        const tenths = toTenths(amount);
        if (draft.balanceTenths < tenths) {
          throw new InsufficientCreditsError(amount, fromTenths(draft.balanceTenths));
        }
        draft.balanceTenths -= tenths;
        draft.reservations[id] = { amountTenths: tenths, reason, createdAt: now() };
        return { id, kind: 'reserve', deltaTenths: -tenths, reason, at: now() };
      });
      return id;
    },

    commit(reservationId) {
      transact((draft) => {
        const r = draft.reservations[reservationId];
        if (!r) return null; // idempotent: already committed/rolled back
        delete draft.reservations[reservationId];
        return { id: reservationId, kind: 'commit', deltaTenths: 0, reason: r.reason, at: now() };
      });
    },

    rollback(reservationId) {
      transact((draft) => {
        const r = draft.reservations[reservationId];
        if (!r) return null; // idempotent
        delete draft.reservations[reservationId];
        draft.balanceTenths += r.amountTenths;
        return { id: reservationId, kind: 'rollback', deltaTenths: r.amountTenths, reason: `Estorno: ${r.reason}`, at: now() };
      });
    },

    credit(amount, reason) {
      assertAmount(amount);
      transact((draft) => {
        const tenths = toTenths(amount);
        draft.balanceTenths += tenths;
        return { id: newId('crd'), kind: 'credit', deltaTenths: tenths, reason, at: now() };
      });
    },

    recoverStaleReservations(maxAgeMs = 10 * 60 * 1000) {
      let recovered = 0;
      transact((draft) => {
        let refunded = 0;
        for (const [id, r] of Object.entries(draft.reservations)) {
          if (now() - r.createdAt >= maxAgeMs) {
            refunded += r.amountTenths;
            delete draft.reservations[id];
            recovered++;
          }
        }
        if (recovered === 0) return null;
        draft.balanceTenths += refunded;
        return { id: newId('rec'), kind: 'recover', deltaTenths: refunded, reason: 'Reservas órfãs estornadas', at: now() };
      });
      return recovered;
    },

    refresh() {
      const latest = load();
      if (latest.version !== current.version) {
        current = latest;
        snapshot = toSnapshot(current);
        emit();
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Default app-wide instance                                           */
/* ------------------------------------------------------------------ */

const resolveStorage = (): StorageLike => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__ledger_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    /* storage blocked (private mode / sandbox) */
  }
  return createMemoryStorage();
};

export const creditLedger: CreditLedger = createCreditLedger(resolveStorage());

if (typeof window !== 'undefined') {
  // Cross-tab consistency: another tab committed a transaction.
  window.addEventListener('storage', (e) => {
    if (e.key === LEDGER_STORAGE_KEY) creditLedger.refresh();
  });
}
