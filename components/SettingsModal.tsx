import React, { useState, useEffect } from "react";
import { getAIConfig, saveAIConfig, AIServiceConfig, AIProviderType } from "../lib/aiService";
import { SlidersHorizontal, X, Check, Key, Globe, Cpu, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIServiceConfig>(getAIConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getAIConfig());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAIConfig(config);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Configurações do Motor de IA
              </h3>
              <p className="text-xs text-gray-400">
                Provedores para geração de catálogos e assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Provedor Ativo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["gemini", "openai", "mock"] as AIProviderType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setConfig({ ...config, provider: p })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all duration-200 capitalize cursor-pointer ${
                    config.provider === p
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-sm"
                      : "bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300"
                  }`}
                >
                  {p === "mock" ? "Offline (Mock)" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3">
            {config.provider === "gemini" && (
              <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Google Gemini (Server-Side Proxy)</span>
                </div>
                <p className="text-gray-400">
                  Integração oficial de alta velocidade utilizando o modelo <code className="text-cyan-300 bg-gray-900 px-1 py-0.5 rounded">gemini-3.8-flash</code> via proxy seguro no servidor.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ambiente pronto com autorização integrada</span>
                </div>
              </div>
            )}

            {config.provider === "openai" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Compatível com qualquer API compatível com o protocolo OpenAI.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={config.openaiKey || ""}
                    onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Endpoint Base
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    value={config.openaiEndpoint || ""}
                    onChange={(e) => setConfig({ ...config, openaiEndpoint: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="gpt-4o-mini"
                    value={config.openaiModel || ""}
                    onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {config.provider === "mock" && (
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Modo Offline Standalone Ativo</span>
                </div>
                <p className="text-gray-400">
                  Gera projetos com dados estruturados locais sem chamadas externas de rede ou consumo de quotas.
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors cursor-pointer"
            >
              Salvar Configuração
            </button>
          </div>
        </form>

        {/* Success overlay */}
        {saveSuccess && (
          <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center text-center animate-fade-in p-6 space-y-2">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-white font-bold text-sm">Configuração Atualizada</p>
            <p className="text-xs text-gray-400">O provedor foi salvo no armazenamento local.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
