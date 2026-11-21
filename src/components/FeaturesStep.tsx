import { CreditCard, Sparkles } from 'lucide-react';
import { APPS, FEATURES, type AppId, type FeatureId } from '../../shared/catalog';
import type { AiStatus } from '../lib/ai';
import { Button, Notice } from './ui';

interface Props {
  app: AppId;
  features: FeatureId[];
  useAI: boolean;
  ai: AiStatus | null;
  onToggleFeature: (id: FeatureId) => void;
  onToggleAI: (value: boolean) => void;
  onBack: () => void;
  onGenerate: () => void;
}

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${checked ? 'bg-cyan-400' : 'bg-gray-700'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-5' : 'left-0.5'}`} />
  </button>
);

export default function FeaturesStep({ app, features, useAI, ai, onToggleFeature, onToggleAI, onBack, onGenerate }: Props) {
  const def = APPS[app];
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Com o quê?</h1>
      <p className="mt-2 text-gray-400">Já incluso: {def.stack.join(', ')}, painel admin e login.</p>

      <div className="mt-6 space-y-3">
        {def.features.map((id) => {
          const f = FEATURES[id];
          return (
            <div key={id} className="flex gap-4 rounded-xl border border-line bg-panel p-4">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <div className="flex-1">
                <h2 className="font-semibold text-white">{f.label}</h2>
                <p className="mt-1 text-sm text-gray-400">{f.perApp[app]}</p>
              </div>
              <Toggle checked={features.includes(id)} onChange={() => onToggleFeature(id)} />
            </div>
          );
        })}

        <div className="flex gap-4 rounded-xl border border-line bg-panel p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <div className="flex-1">
            <h2 className="font-semibold text-white">Conteúdo inicial com IA</h2>
            <p className="mt-1 text-sm text-gray-400">
              {def.generatesProducts
                ? 'Nome, slogan, cor, catálogo de produtos e fotos gerados a partir da sua descrição.'
                : 'Nome, slogan e cor gerados a partir da sua descrição.'}{' '}
              Desligado, o projeto sai com dados de exemplo.
            </p>
          </div>
          <Toggle checked={useAI && Boolean(ai?.available)} onChange={onToggleAI} disabled={!ai?.available} />
        </div>
      </div>

      {ai && !ai.available && (
        <div className="mt-4">
          <Notice tone="warning">IA indisponível: {ai.reason} O projeto será gerado com dados de exemplo.</Notice>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onGenerate} disabled={!ai}>Gerar projeto</Button>
      </div>
    </section>
  );
}
