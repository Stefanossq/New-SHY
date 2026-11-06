import { useSyncExternalStore } from 'react';
import { creditLedger, type CreditLedger, type LedgerSnapshot } from '../lib/creditLedger';

/** Subscribe a component to the transactional ledger (tear-free under React concurrent rendering). */
export function useCredits(ledger: CreditLedger = creditLedger): LedgerSnapshot {
  return useSyncExternalStore(ledger.subscribe, ledger.getSnapshot, ledger.getSnapshot);
}
