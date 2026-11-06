import React, { useState } from 'react';
import { ProjectType } from '../types';
import { 
  ShoppingBag, 
  Terminal, 
  MapPin, 
  ArrowRight, 
  Search, 
  Cpu, 
  Database, 
  Eye, 
  Zap, 
  HardDrive, 
  Layers, 
  FolderDown,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SelectionScreenProps {
  onSelect: (project: ProjectType) => void;
}

interface TemplateCardMeta {
  type: ProjectType;
  title: string;
  category: 'fullstack' | 'frontend' | 'api';
  categoryLabel: string;
  summary: string;
  stack: string[];
  capabilities: { icon: any; label: string }[];
  accentColor: {
    borderHover: string;
    iconBg: string;
    iconText: string;
    buttonHover: string;
  };
}

const TEMPLATES: TemplateCardMeta[] = [
  {
    type: 'store',
    title: 'E-Commerce SaaS',
    category: 'fullstack',
    categoryLabel: 'Full-Stack & DB',
    summary: 'Plataforma comercial completa com catálogo dinâmico de produtos, carrinho reativo, checkout simulado e schema relacional de vendas.',
    stack: ['Next.js 14', 'Convex DB', 'Prisma Schema', 'Tailwind CSS'],
    capabilities: [
      { icon: Eye, label: 'Live Preview Interativo' },
      { icon: Database, label: 'Esquemas SQL / Prisma' },
      { icon: Zap, label: 'Geração por IA de Catálogo' },
    ],
    accentColor: {
      borderHover: 'hover:border-cyan-500/80 hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      iconText: 'text-cyan-400',
      buttonHover: 'hover:bg-cyan-500 hover:text-black',
    },
  },
  {
    type: 'blog',
    title: 'Terminal CMS & Blog',
    category: 'frontend',
    categoryLabel: 'Frontend & Content',
    summary: 'Interface retrô inspirada em consoles de desenvolvimento com editor dinâmico, análise de sentimentos e comentários com personas.',
    stack: ['Vite SPA', 'TypeScript', 'Tailwind CSS', 'Highlight.js'],
    capabilities: [
      { icon: Eye, label: 'Visualizador Terminal' },
      { icon: Zap, label: 'Analisador de Sentimento' },
      { icon: Database, label: 'Armazenamento Local/State' },
    ],
    accentColor: {
      borderHover: 'hover:border-emerald-500/80 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      iconText: 'text-emerald-400',
      buttonHover: 'hover:bg-emerald-500 hover:text-black',
    },
  },
  {
    type: 'travel',
    title: 'Travel & Itinerary Hub',
    category: 'fullstack',
    categoryLabel: 'Full-Stack & APIs',
    summary: 'Orquestrador de itinerários com assistente de roteiros, gerenciamento de reservas, cronogramas dia a dia e exportação para viagens.',
    stack: ['React', 'Express Architecture', 'REST APIs', 'Lucide UI'],
    capabilities: [
      { icon: Eye, label: 'Simulador de Roteiros' },
      { icon: Zap, label: 'Assistente de Itinerários' },
      { icon: Database, label: 'Modelo de Destinos' },
    ],
    accentColor: {
      borderHover: 'hover:border-indigo-500/80 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      iconText: 'text-indigo-400',
      buttonHover: 'hover:bg-indigo-500 hover:text-white',
    },
  },
];

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect }) => {
  const [filter, setFilter] = useState<'all' | 'fullstack' | 'frontend'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesFilter = filter === 'all' || tpl.category === filter;
    const matchesSearch = 
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.stack.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col space-y-8 py-4 animate-fade-in">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 tracking-wide uppercase">
            <span>Orquestrador de Scaffolding</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">Templates Disponíveis</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Selecione a Arquitetura do Projeto
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Escolha o modelo de base. O gerador irá compor o código-fonte limpo, schemas de banco e topologia distribuída prontos para exportar.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por stack ou nome..."
              className="w-full sm:w-56 bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Segmented Category Filter */}
          <div className="flex items-center p-1 bg-gray-950 border border-gray-800 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Todos ({TEMPLATES.length})
            </button>
            <button
              onClick={() => setFilter('fullstack')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'fullstack'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Full-Stack
            </button>
            <button
              onClick={() => setFilter('frontend')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'frontend'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Frontend
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = 
            template.type === 'store' ? ShoppingBag :
            template.type === 'blog' ? Terminal : MapPin;

          return (
            <div
              key={template.type}
              onClick={() => onSelect(template.type)}
              className={`bg-gray-900/90 border border-gray-800 rounded-xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer group ${template.accentColor.borderHover} hover:shadow-xl`}
            >
              <div className="space-y-4">
                {/* Header row: Icon + Category tag */}
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg border ${template.accentColor.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {template.categoryLabel}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {template.summary}
                  </p>
                </div>

                {/* Stack Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {template.stack.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Architecture Capabilities */}
                <div className="pt-3 border-t border-gray-800/80 space-y-1.5">
                  {template.capabilities.map((cap, cIdx) => {
                    const CapIcon = cap.icon;
                    return (
                      <div key={cIdx} className="flex items-center gap-2 text-xs text-gray-400">
                        <CapIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="truncate">{cap.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-6 mt-4 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">
                  Iniciar Orquestração
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-800 group-hover:bg-cyan-500 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400 space-y-3">
          <Layers className="w-8 h-8 mx-auto text-gray-600" />
          <p className="text-sm">Nenhum template encontrado com os critérios de busca selecionados.</p>
          <button
            onClick={() => { setFilter('all'); setSearchQuery(''); }}
            className="text-xs text-cyan-400 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Desktop & System Architecture Info Bar */}
      <div className="bg-gray-950 border border-gray-850 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Saída: <strong className="text-gray-200">Gravação Direta em Disco (.exe) ou ZIP</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Distribuição: <strong className="text-gray-200">GitHub CDN Mesh</strong></span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Runtime: <strong className="text-gray-200">TypeScript 5.8 / Standalone</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Motor de Scaffolding Pronto</span>
        </div>
      </div>

    </div>
  );
};

export default SelectionScreen;
