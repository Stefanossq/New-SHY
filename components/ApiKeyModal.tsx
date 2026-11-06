import React, { useState, useEffect } from 'react';
import { Key, Shield, Check, AlertCircle, Loader2, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { AIService } from '../lib/aiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isMandatory?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isMandatory = false,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      AIService.hasApiKey().then((exists) => {
        setHasExistingKey(exists);
        if (exists) {
          setStatusMessage({
            type: 'info',
            text: 'Uma chave já está configurada no cofre seguro do sistema.',
          });
        } else {
          setStatusMessage(null);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest = keyInput.trim();
    if (!keyToTest && !hasExistingKey) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, insira uma chave de API antes de testar.',
      });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    try {
      // Se informou nova chave no input, salva temporariamente ou testa
      if (keyToTest) {
        await AIService.saveApiKey(keyToTest);
        setHasExistingKey(true);
      }

      const res = await AIService.testApiKey();
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'Conexão com Gemini 3.8 Flash estabelecida com sucesso!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Erro ao validar a chave. Verifique se a cota está ativa.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Falha de rede ou chave recusada pela API do Gemini.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keyToSave = keyInput.trim();

    if (!keyToSave && !hasExistingKey) {
      setStatusMessage({
        type: 'error',
        text: 'Informe uma chave de API válida do Google AI Studio.',
      });
      return;
    }

    setSaving(true);
    try {
      if (keyToSave) {
        await AIService.saveApiKey(keyToSave);
      }
      setStatusMessage({
        type: 'success',
        text: 'Chave salva com sucesso no Windows Credential Manager!',
      });
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erro ao gravar chave no cofre seguro.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja realmente remover a chave de API do cofre seguro?')) return;
    try {
      await AIService.deleteApiKey();
      setHasExistingKey(false);
      setKeyInput('');
      setStatusMessage({
        type: 'info',
        text: 'Chave removida do cofre. A aplicação utilizará o modo de demonstração local.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erro ao remover chave.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0D131F] border border-gray-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative text-xs">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Configurar Chave Gemini (BYOK)</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Modelo Desktop Seguro · Windows Credential Manager
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-950 border border-gray-850 text-gray-300 text-[11px] leading-relaxed">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Cofre Local Isolado: </span>
              Sua chave é armazenada no serviço <code className="text-cyan-400 bg-gray-900 px-1 py-0.5 rounded">new-shy</code> do Windows e nunca é exposta ou enviada para servidores de terceiros.
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
              Chave de API do Google Gemini
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={hasExistingKey ? '••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 cursor-pointer"
                title={showKey ? 'Ocultar chave' : 'Exibir chave'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Obter chave gratuita no Google AI Studio &gt;
              </a>
              {hasExistingKey && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover Chave</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2 text-[11px] leading-relaxed animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              ) : (
                <Shield className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              )}
              <span className="whitespace-pre-wrap">{statusMessage.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={testing || saving}
                onClick={handleTestConnection}
                className="px-3.5 py-2 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-[11px]"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Check className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{testing ? 'Testando Conexão...' : 'Testar Conexão'}</span>
              </button>

              {hasExistingKey && (
                <button
                  type="button"
                  disabled={testing || saving}
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors cursor-pointer flex items-center gap-1.5 font-medium text-[11px]"
                  title="Remove a credencial armazenada no Windows Credential Manager"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Remover Chave Salva</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              )}
              <button
                type="button"
                disabled={saving || testing}
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[11px]"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Salvar no Cofre</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
