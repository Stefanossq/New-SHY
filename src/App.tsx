import { useCallback, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { APPS, type AppId, type FeatureId } from '../shared/catalog';
import { getAiStatus, type AiStatus } from './lib/ai';
import { GENERATOR_VERSION, planSteps, runGeneration, type GenerationResult, type Step, type WizardInput } from './lib/generate';
import { isDesktop } from './lib/platform';
import Stepper from './components/Stepper';
import AppStep from './components/AppStep';
import PurposeStep from './components/PurposeStep';
import FeaturesStep from './components/FeaturesStep';
import GeneratingStep from './components/GeneratingStep';
import ResultStep from './components/ResultStep';
import ApiKeyModal from './components/ApiKeyModal';

type Screen = 'app' | 'purpose' | 'features' | 'generating' | 'result';
const STEP_INDEX: Record<Screen, number> = { app: 0, purpose: 1, features: 2, generating: 3, result: 3 };

export default function App() {
  const [screen, setScreen] = useState<Screen>('app');
  const [input, setInput] = useState<WizardInput>({ app: 'store', businessName: '', purpose: '', features: ['payments'], useAI: true });
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [keyModal, setKeyModal] = useState(false);

  const refreshAi = useCallback(() => {
    getAiStatus().then(setAi);
  }, []);
  useEffect(refreshAi, [refreshAi]);

  const selectApp = (app: AppId) => {
    setInput((prev) => ({ ...prev, app, features: prev.features.filter((f) => APPS[app].features.includes(f)) }));
    setScreen('purpose');
  };

  const toggleFeature = (id: FeatureId) =>
    setInput((prev) => ({ ...prev, features: prev.features.includes(id) ? prev.features.filter((f) => f !== id) : [...prev.features, id] }));

  const generate = async () => {
    if (!ai) return;
    setScreen('generating');
    setError(null);
    setSteps(planSteps(input, ai));
    try {
      const r = await runGeneration(input, ai, (id, patch) => setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))));
      setResult(r);
      setScreen('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const restart = () => {
    setResult(null);
    setScreen('app');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#1a181d] from-60% to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={restart} className="flex items-center gap-3" aria-label="Gato Pingado — recomeçar">
            <img src="/gato/logo.webp" alt="" className="h-14 w-auto" />
            <span className="hidden text-base text-muted sm:inline">v{GENERATOR_VERSION}</span>
          </button>
          <div className="flex items-center gap-3 text-base">
            {ai && (
              <span className={`rounded-full border-2 px-3 py-1 ${ai.available ? 'border-ok/50 text-ok' : 'border-warn/50 text-warn'}`}>
                {ai.available ? `IA ativa · ${ai.textModel}` : 'IA desligada · dados de exemplo'}
              </span>
            )}
            {isDesktop() && (
              <button onClick={() => setKeyModal(true)} className="btn-ghost !px-4 !py-2 !text-lg">
                <KeyRound className="h-4 w-4" /> Chave Gemini
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Stepper current={STEP_INDEX[screen]} />
        {screen === 'app' && <AppStep selected={input.app} onSelect={selectApp} />}
        {screen === 'purpose' && (
          <PurposeStep
            app={input.app}
            businessName={input.businessName}
            purpose={input.purpose}
            onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
            onBack={() => setScreen('app')}
            onNext={() => setScreen('features')}
          />
        )}
        {screen === 'features' && (
          <FeaturesStep
            app={input.app}
            features={input.features}
            useAI={input.useAI}
            ai={ai}
            onToggleFeature={toggleFeature}
            onToggleAI={(useAI) => setInput((prev) => ({ ...prev, useAI }))}
            onBack={() => setScreen('purpose')}
            onGenerate={generate}
          />
        )}
        {screen === 'generating' && <GeneratingStep steps={steps} error={error} onBack={() => setScreen('features')} />}
        {screen === 'result' && result && <ResultStep app={input.app} features={input.features} result={result} onRestart={restart} />}
      </main>

      <footer className="py-6 text-center text-base text-muted">
        Gato Pingado · projetos Next.js + Convex + Clerk + Stripe prontos para rodar
      </footer>

      {isDesktop() && <ApiKeyModal open={keyModal} onClose={() => setKeyModal(false)} onChanged={refreshAi} />}
    </div>
  );
}
