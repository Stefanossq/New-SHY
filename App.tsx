import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { Layers, Plus, Sliders, Key, LayoutGrid, Wallet, ShoppingBag, Terminal, MapPin, Command as CommandIcon } from 'lucide-react';
import type { ProjectType } from './types';
import SelectionScreen from './components/SelectionScreen';
import GenerationScreen from './components/GenerationScreen';
import { ResultScreenErrorBoundary } from './components/ResultScreenErrorBoundary';
import ThemeScreen from './components/ThemeScreen';
import SettingsModal from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { BillingDialog } from './components/BillingDialog';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { AppSidebar, CreditsCard, type AppView } from './components/layout/AppSidebar';
import { WizardStepper } from './components/layout/WizardStepper';
import { TooltipProvider } from './components/ui/tooltip';
import { Button } from './components/ui/button';
import { AIService } from './lib/aiService';
import { PlatformAdapter } from './lib/platformAdapter';
import { creditLedger, InsufficientCreditsError } from './lib/creditLedger';
import { useProjectGeneration } from './hooks/useProjectGeneration';

// Heavy, rarely-first screens are code-split: the initial load only ships the wizard.
const ResultScreen = lazy(() => import('./components/ResultScreen'));
const TemplateRegistryDashboard = lazy(() =>
  import('./components/TemplateRegistryDashboard').then((m) => ({ default: m.TemplateRegistryDashboard }))
);

const ScreenFallback = () => (
  <div role="status" aria-label="Carregando" className="space-y-4">
    <div className="h-20 animate-pulse rounded-xl bg-gray-900/70" />
    <div className="h-10 w-2/3 animate-pulse rounded-xl bg-gray-900/70" />
    <div className="h-[420px] animate-pulse rounded-xl bg-gray-900/70" />
  </div>
);

const App: React.FC = () => {
  const gen = useProjectGeneration();
  const reduceMotion = useReducedMotion();
  const isDesktop = PlatformAdapter.isTauriApp();

  const [view, setView] = useState<AppView>('studio');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; mandatory: boolean }>({ open: false, mandatory: false });

  // Durability: refund reservations orphaned by a crash / closed tab during a previous run.
  useEffect(() => {
    const recovered = creditLedger.recoverStaleReservations();
    if (recovered > 0) toast.info('Créditos estornados', { description: 'Uma geração interrompida anteriormente foi estornada.' });
  }, []);

  // First run: ask for the API key on desktop (non-blocking toast instead of window.alert).
  useEffect(() => {
    AIService.checkApiKeyStatus().then((status) => {
      if (status.error) {
        toast.warning('Cofre de credenciais indisponível', { description: status.error });
        setApiKeyModal({ open: true, mandatory: false });
      } else if (!status.exists) {
        setApiKeyModal({ open: true, mandatory: true });
      }
    });
  }, []);

  // Global shortcut: Ctrl/⌘ + K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openBilling = useCallback(() => setIsBillingOpen(true), []);

  const startGeneration = useCallback(
    async (type: ProjectType, theme = '') => {
      setView('studio');
      try {
        await gen.generate(type, theme);
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          toast.error('Créditos insuficientes', {
            description: err.message,
            action: { label: 'Adicionar', onClick: openBilling },
          });
          return;
        }
        toast.error('Não foi possível iniciar a geração', { description: err instanceof Error ? err.message : String(err) });
      }
    },
    [gen.generate, openBilling]
  );

  const handleSelectProject = useCallback(
    (type: ProjectType) => (type === 'store' ? gen.goToTheme() : void startGeneration(type)),
    [gen.goToTheme, startGeneration]
  );

  const handleNewProject = useCallback(() => {
    gen.reset();
    setView('studio');
  }, [gen.reset]);

  const paletteActions = useMemo<PaletteAction[]>(
    () => [
      { id: 'new', group: 'Projeto', label: 'Novo projeto', icon: Plus, keywords: ['inicio', 'reset'], run: handleNewProject },
      { id: 'gen-store', group: 'Projeto', label: 'Gerar E-Commerce (escolher tema)', icon: ShoppingBag, keywords: ['loja', 'store'], run: () => { setView('studio'); gen.goToTheme(); } },
      { id: 'gen-blog', group: 'Projeto', label: 'Gerar Blog / CMS', icon: Terminal, keywords: ['blog'], run: () => void startGeneration('blog') },
      { id: 'gen-travel', group: 'Projeto', label: 'Gerar Planejador de Viagens', icon: MapPin, keywords: ['viagem', 'travel'], run: () => void startGeneration('travel') },
      { id: 'registry', group: 'Navegar', label: 'Abrir Templates Hub', icon: LayoutGrid, keywords: ['registry', 'templates'], run: () => setView('registry') },
      { id: 'settings', group: 'Configuração', label: 'Provedores de IA', icon: Sliders, keywords: ['gemini', 'openai', 'mock', 'offline'], run: () => setIsSettingsOpen(true) },
      ...(isDesktop
        ? [{ id: 'apikey', group: 'Configuração', label: 'Gerenciar chave Gemini', icon: Key, run: () => setApiKeyModal({ open: true, mandatory: false }) }]
        : []),
      { id: 'billing', group: 'Configuração', label: 'Carteira de créditos', icon: Wallet, keywords: ['creditos', 'saldo'], run: openBilling },
    ],
    [handleNewProject, gen.goToTheme, startGeneration, isDesktop, openBilling]
  );

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' as const };
  const showStepper = view === 'studio';
  const includesTheme = gen.step === 'theme' || gen.lastRequest?.type === 'store';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen bg-background text-gray-100 selection:bg-cyan-500/25 selection:text-cyan-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-cyan-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-950"
        >
          Pular para o conteúdo
        </a>

        <AppSidebar
          view={view}
          onNavigate={setView}
          onNewProject={handleNewProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenApiKey={isDesktop ? () => setApiKeyModal({ open: true, mandatory: false }) : undefined}
          onOpenBilling={openBilling}
          onOpenCommand={() => setIsCommandOpen(true)}
        />

        <div className="app-backdrop flex min-w-0 flex-1 flex-col">
          {/* Top bar: brand + compact actions on small screens, wizard progress on all sizes */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-gray-800/80 bg-background/80 px-4 backdrop-blur-md md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={handleNewProject} className="flex items-center gap-2 lg:hidden" aria-label="ScaffoldEngine — início">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
                  <Layers className="h-4 w-4 text-gray-950" />
                </span>
              </button>
              {showStepper ? (
                <WizardStepper step={gen.step} includesTheme={includesTheme} hasError={Boolean(gen.error)} />
              ) : (
                <h1 className="text-sm font-semibold text-white">Templates Hub</h1>
              )}
            </div>
            <div className="flex items-center gap-1.5 lg:hidden">
              <CreditsCard compact onOpenBilling={openBilling} />
              <Button variant="ghost" size="icon" onClick={() => setView(view === 'registry' ? 'studio' : 'registry')} aria-label="Alternar Templates Hub">
                <LayoutGrid />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Provedores de IA">
                <Sliders />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsCommandOpen(true)} aria-label="Abrir paleta de comandos">
                <CommandIcon />
              </Button>
            </div>
          </header>

          <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-7xl">
              {/* Enter-only transition: no exit/"wait" phase, so the next screen mounts immediately
                  even when rAF is throttled (hidden/minimized window). */}
                <motion.div
                  key={view === 'registry' ? 'registry' : gen.step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition}
                >
                  <Suspense fallback={<ScreenFallback />}>
                  {view === 'registry' ? (
                    <TemplateRegistryDashboard />
                  ) : (
                    <>
                      {gen.step === 'selection' && <SelectionScreen onSelect={handleSelectProject} />}
                      {gen.step === 'theme' && (
                        <ThemeScreen onGenerate={(theme) => startGeneration('store', theme)} onBack={handleNewProject} />
                      )}
                      {gen.step === 'generating' && (
                        <GenerationScreen
                          projectName={gen.project?.name ?? gen.lastRequest?.theme ?? 'Novo projeto'}
                          lifecycleSteps={gen.steps}
                          currentStepIndex={gen.currentStepIndex}
                          activity={gen.activity}
                          errorDetail={gen.error}
                          onRetry={() => void gen.retry().catch((e) => toast.error(e instanceof Error ? e.message : String(e)))}
                          onBack={handleNewProject}
                          onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                      )}
                      {gen.step === 'result' && gen.project && (
                        <ResultScreenErrorBoundary onReset={handleNewProject} projectFiles={gen.project.files} projectName={gen.project.name}>
                          <ResultScreen projectType={gen.project.type} projectFiles={gen.project.files} onReset={handleNewProject} />
                        </ResultScreenErrorBoundary>
                      )}
                    </>
                  )}
                  </Suspense>
                </motion.div>
            </div>
          </main>
        </div>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <ApiKeyModal
          isOpen={apiKeyModal.open}
          isMandatory={apiKeyModal.mandatory}
          onClose={() => setApiKeyModal({ open: false, mandatory: false })}
        />
        <BillingDialog open={isBillingOpen} onOpenChange={setIsBillingOpen} />
        <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} actions={paletteActions} />
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </div>
    </TooltipProvider>
  );
};

export default App;
