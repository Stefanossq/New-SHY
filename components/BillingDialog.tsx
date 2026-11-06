import React, { useEffect, useState } from 'react';
import { CreditCard, Check, FlaskConical, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '../lib/cn';
import { creditLedger, GENERATION_COST } from '../lib/creditLedger';
import { useCredits } from '../hooks/useCredits';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  cost: number;
  description: string;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter', name: 'Starter', credits: 15, cost: 15, description: 'Ideal para testar algumas ideias completas.' },
  { id: 'pro', name: 'Pro', credits: 50, cost: 49, description: 'Mais popular entre desenvolvedores freelancers.', popular: true },
  { id: 'expert', name: 'Expert', credits: 150, cost: 120, description: 'Para agências que orquestram dezenas de MVPs.' },
];

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Wallet top-up. This is a SANDBOX flow: no payment data is collected or processed
 * (the previous version asked for card numbers in a fake form, which trains users to
 * type real card data into untrusted UI). Credits are added through the transactional ledger.
 */
export function BillingDialog({ open, onOpenChange }: BillingDialogProps) {
  const { balance } = useCredits();
  const [packId, setPackId] = useState('pro');
  const [done, setDone] = useState<CreditPack | null>(null);

  useEffect(() => {
    if (open) setDone(null);
  }, [open]);

  const pack = CREDIT_PACKS.find((p) => p.id === packId) ?? CREDIT_PACKS[1];

  const handleConfirm = () => {
    try {
      creditLedger.credit(pack.credits, `Recarga demo: pacote ${pack.name}`);
      setDone(pack);
      toast.success(`${pack.credits} créditos adicionados`, { description: 'Recarga de demonstração concluída.' });
    } catch (err) {
      toast.error('Não foi possível adicionar créditos', { description: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-cyan-400" /> Carteira de créditos
          </DialogTitle>
          <DialogDescription>
            Saldo atual: <strong className="font-mono text-cyan-300">{balance.toFixed(1)} cr</strong> · cada geração consome{' '}
            {GENERATION_COST.toFixed(1)} cr (estornados automaticamente se falhar).
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-white">Créditos adicionados!</p>
            <p className="text-xs text-gray-400">
              {done.credits} créditos do pacote {done.name} já estão na sua carteira.
            </p>
            <Button variant="primary" size="md" className="mt-2" onClick={() => onOpenChange(false)}>
              Continuar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
                <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>Modo demonstração.</strong> Nenhum pagamento real é processado e nenhum dado de cartão é solicitado.
                </span>
              </div>

              <div role="radiogroup" aria-label="Pacotes de créditos" className="space-y-2">
                {CREDIT_PACKS.map((p) => {
                  const selected = p.id === packId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPackId(p.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer',
                        selected
                          ? 'border-cyan-400 bg-cyan-500/10 text-white'
                          : 'border-gray-800 bg-gray-950 text-gray-300 hover:border-gray-700'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-100">
                          {p.name} · {p.credits} créditos
                          {p.popular && (
                            <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-300">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">{p.description}</div>
                      </div>
                      <div className="shrink-0 font-mono text-sm font-bold text-cyan-400">{brl.format(p.cost)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                <Sparkles /> Adicionar {pack.credits} cr (demo)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
