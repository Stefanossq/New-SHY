import React, { useState } from 'react';
import { 
  Coffee, 
  Car, 
  Laptop, 
  Sparkles, 
  ArrowRight, 
  Check, 
  ShoppingBag, 
  Store, 
  Shirt, 
  Gamepad2, 
  Leaf,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface ThemeScreenProps {
  onGenerate: (theme: string) => Promise<void>;
  onBack?: () => void;
}

interface ThemePreset {
  id: string;
  themeValue: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const PRESETS: ThemePreset[] = [
  {
    id: 'coffee',
    themeValue: 'Cafeteria artesanal, grãos especiais e métodos de extração',
    title: 'Café & Torrefação',
    description: 'Grãos especiais, moedores manuais e cerâmicas artesanais',
    icon: Coffee,
    accent: 'hover:border-amber-500/60 text-amber-400',
  },
  {
    id: 'cars',
    themeValue: '__CARS__',
    title: 'Automóveis & Veículos',
    description: 'Catálogo de carros esportivos, sedans e utilitários',
    icon: Car,
    accent: 'hover:border-cyan-500/60 text-cyan-400',
  },
  {
    id: 'tech',
    themeValue: 'Hardware premium, teclados mecânicos e periféricos para programadores',
    title: 'Gadgets & Tech',
    description: 'Teclados mecânicos, monitores ultrawide e áudio de estúdio',
    icon: Laptop,
    accent: 'hover:border-blue-500/60 text-blue-400',
  },
  {
    id: 'apparel',
    themeValue: 'Streetwear minimalista, moletons oversize e camisetas pesadas de algodão',
    title: 'Moda Streetwear',
    description: 'Vestuário minimalista, tênis de coleção e acessórios',
    icon: Shirt,
    accent: 'hover:border-purple-500/60 text-purple-400',
  },
  {
    id: 'gaming',
    themeValue: 'Consoles clássicos, cartuchos originais e colecionáveis arcade dos anos 90',
    title: 'Games & Retrô',
    description: 'Consoles clássicos, fitas de videogame e memorabilia',
    icon: Gamepad2,
    accent: 'hover:border-rose-500/60 text-rose-400',
  },
  {
    id: 'plants',
    themeValue: 'Plantas ornamentais raras para apartamento, vasos de terracota e substratos',
    title: 'Botânica & Plantas',
    description: 'Espécies ornamentais, vasos cerâmicos e guias de rega',
    icon: Leaf,
    accent: 'hover:border-emerald-500/60 text-emerald-400',
  },
];

const ThemeScreen: React.FC<ThemeScreenProps> = ({ onGenerate, onBack }) => {
  const [customTheme, setCustomTheme] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async (themeToUse: string) => {
    if (!themeToUse.trim()) {
      setError('Por favor, selecione um preset ou digite um tema para os produtos.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await onGenerate(themeToUse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na inicialização do tema.');
    } finally {
      // If generation could not start (e.g. no credits) the screen stays mounted — unlock it.
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: ThemePreset) => {
    setSelectedPreset(preset.id);
    setCustomTheme('');
    handleLaunch(preset.themeValue);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTheme.trim()) return;
    setSelectedPreset(null);
    handleLaunch(customTheme);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8 py-4 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2 relative">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 top-0 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Templates
          </button>
        )}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold">
          <Store className="w-3.5 h-3.5" />
          <span>Configuração do E-Commerce</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Escolha o Tema do Catálogo
        </h2>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          Selecione um segmento visual icônico abaixo ou descreva seu nicho personalizado.
        </p>
      </div>

      {/* Preset Iconic Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isCurrentLoading = isLoading && selectedPreset === preset.id;

          return (
            <button
              type="button"
              key={preset.id}
              disabled={isLoading}
              aria-busy={isCurrentLoading}
              onClick={() => handlePresetSelect(preset)}
              className={`text-left bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer group ${preset.accent} hover:shadow-lg ${
                isLoading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  {isCurrentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-800"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Ou Digite seu Nicho Personalizado
        </span>
        <div className="flex-grow border-t border-gray-800"></div>
      </div>

      {/* Custom Theme Input */}
      <form onSubmit={handleSubmitCustom} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="custom-theme" className="sr-only">Nicho personalizado</label>
          <input
            id="custom-theme"
            type="text"
            maxLength={200}
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: relógios mecânicos suíços, sapatilhas de escalada, vinhos naturais..."
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !customTheme.trim()}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isLoading && !selectedPreset ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Gerar Catálogo</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div role="alert" className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs text-center">
          {error}
        </div>
      )}

    </div>
  );
};

export default ThemeScreen;
