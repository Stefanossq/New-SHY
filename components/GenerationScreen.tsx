import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Cpu, HardDrive } from 'lucide-react';

interface GenerationScreenProps {
  projectName: string;
  lifecycleSteps: string[];
  currentStepIndex: number;
  errorDetail?: string | null;
}

const GenerationScreen: React.FC<GenerationScreenProps> = ({
  projectName,
  lifecycleSteps,
  currentStepIndex,
  errorDetail,
}) => {
  const total = lifecycleSteps.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentStepIndex) / total) * 100));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 w-full max-w-xl mx-auto shadow-2xl animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Compondo Projeto
            </h3>
            <p className="text-xs text-gray-400">
              {projectName}
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-cyan-400 font-bold">
          {progressPercent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden border border-gray-800">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-2.5">
        {lifecycleSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex && !errorDetail;
          const isFailed = index === currentStepIndex && errorDetail;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-cyan-950/30 border border-cyan-800/40 text-cyan-300'
                  : isFailed
                  ? 'bg-red-950/30 border border-red-800/40 text-red-300'
                  : isCompleted
                  ? 'text-gray-300'
                  : 'text-gray-600'
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : isFailed ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center text-[10px] text-gray-600">
                    {index + 1}
                  </div>
                )}
              </div>

              <span className={`font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error View */}
      {errorDetail && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Falha na orquestração</span>
          </div>
          <p className="font-mono text-[11px] opacity-90 break-words">
            {errorDetail}
          </p>
          <p className="text-[11px] text-gray-400 pt-1">
            Dica: Ative o <strong>Modo Demo Offline (Mock)</strong> no menu de configurações do topo para testar sem chave de API.
          </p>
        </div>
      )}

      {/* Output indicator */}
      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-gray-400" />
          <span>Pipeline de Scaffolding em Execução</span>
        </div>
        <span>Etapa {Math.min(currentStepIndex + 1, total)} / {total}</span>
      </div>

    </div>
  );
};

export default GenerationScreen;
