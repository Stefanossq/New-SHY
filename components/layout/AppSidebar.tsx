import React from 'react';
import { Layers, Plus, LayoutGrid, Sliders, Key, Wallet, Command as CommandIcon, Wand2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';
import { Kbd } from '../ui/kbd';
import { useCredits } from '../../hooks/useCredits';
import { GENERATION_COST } from '../../lib/creditLedger';

export type AppView = 'studio' | 'registry';

interface AppSidebarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  onOpenApiKey?: () => void;
  onOpenBilling: () => void;
  onOpenCommand: () => void;
}

const NavItem = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors cursor-pointer',
      active ? 'bg-gray-800/80 text-white' : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-100'
    )}
  >
    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300')} />
    <span className="truncate">{label}</span>
  </button>
);

/** Credits widget: balance + how many generations it still covers (concrete > abstract). */
export function CreditsCard({ onOpenBilling, compact = false }: { onOpenBilling: () => void; compact?: boolean }) {
  const { balance, pending } = useCredits();
  const runs = Math.floor(balance / GENERATION_COST);
  const low = runs < 2;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onOpenBilling}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs font-bold tabular-nums cursor-pointer',
          low ? 'border-amber-500/40 text-amber-300' : 'border-gray-800 text-cyan-300'
        )}
        aria-label={`Saldo: ${balance.toFixed(1)} créditos. Abrir carteira`}
      >
        <Wallet className="h-3.5 w-3.5" /> {balance.toFixed(1)}
      </button>
    );
  }

  return (
    <div className={cn('rounded-xl border p-3', low ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-800 bg-gray-900/60')}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
        <span className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" /> Créditos
        </span>
        {pending > 0 && <span className="text-cyan-400">−{pending.toFixed(1)} reservado</span>}
      </div>
      <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white" data-testid="credit-balance">
        {balance.toFixed(1)} <span className="text-xs font-medium text-gray-500">cr</span>
      </div>
      <p className={cn('mt-0.5 text-[11px]', low ? 'text-amber-300' : 'text-gray-500')}>
        {runs === 0 ? 'Saldo insuficiente para gerar' : `≈ ${runs} ${runs === 1 ? 'geração restante' : 'gerações restantes'}`}
      </p>
      <Button variant={low ? 'primary' : 'secondary'} size="sm" className="mt-2.5 w-full" onClick={onOpenBilling}>
        Adicionar créditos
      </Button>
    </div>
  );
}

export function AppSidebar({
  view,
  onNavigate,
  onNewProject,
  onOpenSettings,
  onOpenApiKey,
  onOpenBilling,
  onOpenCommand,
}: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-800/80 bg-gray-950/80 backdrop-blur lg:flex">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Layers className="h-[18px] w-[18px] text-gray-950" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">ScaffoldEngine</div>
          <div className="text-[11px] text-gray-500">Desktop Studio · v2.5</div>
        </div>
      </div>

      <div className="px-3">
        <Button variant="primary" size="md" className="w-full justify-start" onClick={onNewProject}>
          <Plus /> Novo projeto
        </Button>
        <button
          type="button"
          onClick={onOpenCommand}
          className="mt-2 flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:border-gray-700 hover:text-gray-300 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <CommandIcon className="h-3.5 w-3.5" /> Buscar ações…
          </span>
          <span className="flex gap-0.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <nav aria-label="Navegação principal" className="mt-6 flex-1 space-y-6 overflow-y-auto px-3 custom-scrollbar">
        <div className="space-y-0.5">
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Workspace</p>
          <NavItem icon={Wand2} label="Gerador de projetos" active={view === 'studio'} onClick={() => onNavigate('studio')} />
          <NavItem icon={LayoutGrid} label="Templates Hub" active={view === 'registry'} onClick={() => onNavigate('registry')} />
        </div>
        <div className="space-y-0.5">
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Configuração</p>
          <NavItem icon={Sliders} label="Provedores de IA" onClick={onOpenSettings} />
          {onOpenApiKey && <NavItem icon={Key} label="Chave Gemini (BYOK)" onClick={onOpenApiKey} />}
        </div>
      </nav>

      <div className="p-3">
        <CreditsCard onOpenBilling={onOpenBilling} />
      </div>
    </aside>
  );
}
