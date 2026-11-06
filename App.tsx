import React, { useState, useCallback } from 'react';
import { ProjectType } from './types';
import SelectionScreen from './components/SelectionScreen';
import GenerationScreen from './components/GenerationScreen';
import ResultScreen from './components/ResultScreen';
import { ResultScreenErrorBoundary } from './components/ResultScreenErrorBoundary';
import ThemeScreen from './components/ThemeScreen';
import SettingsModal from './components/SettingsModal';
import { TemplateRegistryDashboard } from './components/TemplateRegistryDashboard';
import { orchestrateGeneration } from './lib/generatorEngine';
import { PROJECT_TEMPLATES } from './lib/templates';
import { Layers, HelpCircle, LayoutGrid, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [step, setStep] = useState<'selection' | 'theme' | 'generating' | 'result'>('selection');
  
  // Custom states for the new de-mocked generator engine
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [lifecycleSteps, setLifecycleSteps] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [viewingRegistry, setViewingRegistry] = useState<boolean>(false);

  const [project, setProject] = useState<{
    type: ProjectType;
    name: string;
    files: Record<string, any>;
  } | null>(null);

  /**
   * Helper to execute the core generation flow
   */
  const triggerGenerationFlow = useCallback(async (type: ProjectType, theme: string = '') => {
    setStep('generating');
    setCurrentStepIndex(0);
    setErrorDetail(null);
    setViewingRegistry(false); // Reset to see progress

    // Debit cost on generation start
    const stored = localStorage.getItem('user_generator_credits');
    const activeCredits = stored ? parseFloat(stored) : 8.8;
    // Decrement a simulated 1.2 credits
    const remaining = Math.max(0, activeCredits - 1.2);
    localStorage.setItem('user_generator_credits', remaining.toFixed(1));

    const template = PROJECT_TEMPLATES[type];
    // Define initial pending steps
    const initialSteps = type === 'store' 
      ? [
          "Carregando configurações e checando conexão com Provedor de IA",
          "Buscando informações do segmento e gerando catálogo de produtos",
          "Gerando fotos de estúdio profissionais para cada produto via IA",
          "Estruturando Schema de dados do catálogo dinâmico",
          ...template.lifecycle
        ]
      : [...template.lifecycle];
    
    setLifecycleSteps(initialSteps);

    try {
      const result = await orchestrateGeneration(type, theme, (progress) => {
        // Callback tracking actual event telemetry from generatorEngine
        setCurrentStepIndex(progress.stepIndex);
        if (progress.status === 'error') {
          setErrorDetail(progress.message);
        }
      });

      setProject({
        type: result.type,
        name: result.name,
        files: result.files,
      });
      // Small pause on final step for great UX
      setTimeout(() => {
        setStep('result');
      }, 800);
    } catch (err: any) {
      console.error("Generator execution error:", err);
      setErrorDetail(err.message || 'Ocorreu um erro inesperado durante a geração.');
    }
  }, []);

  const handleSelectProject = useCallback((projectType: ProjectType) => {
    if (projectType === 'store') {
      setStep('theme');
    } else {
      triggerGenerationFlow(projectType);
    }
  }, [triggerGenerationFlow]);

  const handleGenerateProducts = useCallback(async (theme: string) => {
    triggerGenerationFlow('store', theme);
  }, [triggerGenerationFlow]);

  const handleReset = useCallback(() => {
    setProject(null);
    setCurrentStepIndex(0);
    setErrorDetail(null);
    setStep('selection');
    setViewingRegistry(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col justify-between font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header - Top Bar Contract */}
      <header className="w-full bg-[#0D131F]/90 backdrop-blur-md border-b border-gray-800/80 px-6 py-3.5 flex flex-row justify-between items-center z-40 sticky top-0">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <div 
            onClick={handleReset}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-md shadow-cyan-500/10">
              <Layers className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                ScaffoldEngine
              </span>
              <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                Desktop Studio · v2.4
              </span>
            </div>
          </div>
        </div>
        
        {/* Zone 2 & 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setViewingRegistry(!viewingRegistry)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              viewingRegistry 
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                : 'bg-gray-900 hover:bg-gray-850 text-gray-300 border-gray-800 hover:border-gray-700'
            }`}
          >
            {viewingRegistry ? (
              <><LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Projetos</span> Base</>
            ) : (
              <><Layers className="w-3.5 h-3.5 text-cyan-400" /> <span className="hidden sm:inline">Templates</span> Hub</>
            )}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white px-3 py-1.5 border border-gray-800 hover:border-gray-700 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
            title="Configure Provedores (Gemini, OpenAI, Mock)"
          >
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Configurar</span> APIs
          </button>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {viewingRegistry ? (
              <motion.div
                key="registry"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <TemplateRegistryDashboard />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full"
              >
                {step === 'selection' && <SelectionScreen onSelect={handleSelectProject} />}
                {step === 'theme' && <ThemeScreen onGenerate={handleGenerateProducts} />}
                {step === 'generating' && (
                  <div className="w-full">
                    <GenerationScreen
                      projectName={project ? project.name : (step === 'theme' ? 'Loja Modelo' : 'Carregando...')}
                      lifecycleSteps={lifecycleSteps}
                      currentStepIndex={currentStepIndex}
                      errorDetail={errorDetail}
                    />
                    {errorDetail && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleReset}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm cursor-pointer"
                        >
                          Voltar ao Início
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {step === 'result' && project && (
                  <ResultScreenErrorBoundary
                    onReset={handleReset}
                    projectFiles={project.files}
                    projectName={project.name}
                  >
                    <ResultScreen projectType={project.type} projectFiles={project.files} onReset={handleReset} />
                  </ResultScreenErrorBoundary>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer detailing project nature */}
      <footer className="w-full p-4 border-t border-gray-800 bg-gray-900/60 text-center text-xs text-gray-500">
        <p>Projeto de Orquestração Estruturada — Projetado para portabilidade direta fora deste workspace.</p>
      </footer>

      {/* Global settings configuration modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
