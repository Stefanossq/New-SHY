import { CreditCard, Sparkles } from 'lucide-react';
import { APPS, FEATURES, type AppId, type FeatureId } from '../../shared/catalog';
import type { AiStatus } from '../lib/ai';
import { Button, Notice, ScreenTitle } from './ui';

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

const Toggle = ({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-8 w-14 shrink-0 rounded-full border-[3px] border-ink transition disabled:opacity-40 ${checked ? 'bg-lav' : 'bg-frame'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${checked ? 'left-7' : 'left-0.5'}`} />
  </button>
);

const Row = ({ icon, title, children, toggle }: { icon: React.ReactNode; title: string; children: React.ReactNode; toggle: React.ReactNode }) => (
  <div className="gp-panel flex items-start gap-4 p-5">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[3px] border-ink bg-cream text-ink">{icon}</span>
    <div className="flex-1">
      <h2 className="gp-title text-2xl">{title}</h2>
      <p className="mt-1 text-lg leading-snug text-cream-2">{children}</p>
    </div>
    {toggle}
  </div>
);

export default function FeaturesStep({ app, features, useAI, ai, onToggleFeature, onToggleAI, onBack, onGenerate }: Props) {
  const def = APPS[app];
  return (
    <section className="max-w-2xl">
      <ScreenTitle sub={`Já incluso: ${def.stack.join(', ')}, painel admin e login.`}>Com o quê?</ScreenTitle>

      <div className="mt-8 space-y-4">
        {def.features.map((id) => {
          const f = FEATURES[id];
          return (
            <Row
              key={id}
              icon={<CreditCard className="h-5 w-5" />}
              title={f.label}
              toggle={<Toggle label={f.label} checked={features.includes(id)} onChange={() => onToggleFeature(id)} />}
            >
              {f.perApp[app]}
            </Row>
          );
        })}

        <Row
          icon={<Sparkles className="h-5 w-5" />}
          title="Personalizar com IA"
          toggle={<Toggle label="Personalizar com IA" checked={useAI && Boolean(ai?.available)} onChange={onToggleAI} disabled={!ai?.available} />}
        >
          {def.generatesProducts
            ? 'Nome, paleta de cores, textos do site, catálogo com campos próprios do seu negócio e fotos.'
            : 'Nome, paleta de cores e textos do site gerados a partir da sua descrição.'}{' '}
          Desligado, o projeto sai com dados de exemplo.
        </Row>
      </div>

      {ai && !ai.available && (
        <div className="mt-5">
          <Notice tone="warning">IA indisponível: {ai.reason} O projeto será gerado com dados de exemplo.</Notice>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onGenerate} disabled={!ai}>Gerar projeto</Button>
      </div>
    </section>
  );
}
