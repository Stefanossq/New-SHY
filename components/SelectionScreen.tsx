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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SelectionScreenProps {
  onSelect: (project: ProjectType) => void;
}

type CategoryFilter = 'all' | 'fullstack' | 'frontend';

export interface TemplateCardMeta {
  type: ProjectType;
  title: string;
  category: 'fullstack' | 'frontend' | 'api';
  categoryLabel: string;
  summary: string;
  stack: string[];
  capabilities: { icon: React.ElementType; label: string }[];
  accentColor: {
    borderHover: string;
    iconBg: string;
    iconText: string;
    glow: string;
  };
}

export const TEMPLATES: TemplateCardMeta[] = [
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
      borderHover: 'hover:border-cyan-500/70 hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      iconText: 'text-cyan-400',
      glow: 'bg-cyan-500/15',
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
      borderHover: 'hover:border-emerald-500/70 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      iconText: 'text-emerald-400',
      glow: 'bg-emerald-500/15',
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
      borderHover: 'hover:border-indigo-500/70 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      iconText: 'text-indigo-400',
      glow: 'bg-indigo-500/15',
    },
  },
];

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'fullstack', label: 'Full-Stack' },
  { id: 'frontend', label: 'Frontend' },
];

const ICONS: Record<ProjectType, React.ElementType> = { store: ShoppingBag, blog: Terminal, travel: MapPin };

/** Pure filter (unit-tested): category + case-insensitive match on title, summary or stack. */
export const filterTemplates = (templates: TemplateCardMeta[], filter: CategoryFilter, query: string): TemplateCardMeta[] => {
  const q = query.trim().toLowerCase();
  return templates.filter(
    (tpl) =>
      (filter === 'all' || tpl.category === filter) &&
      (!q ||
        tpl.title.toLowerCase().includes(q) ||
        tpl.summary.toLowerCase().includes(q) ||
        tpl.stack.some((s) => s.toLowerCase().includes(q)))
  );
};

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect }) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTemplates = filterTemplates(TEMPLATES, filter, searchQuery);

  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
            <Sparkles className="h-3 w-3" /> Passo 1 · Escolha uma arquitetura
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Do zero ao protótipo <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">em minutos</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Selecione um template base. O motor compõe código-fonte limpo, schemas de banco e topologia distribuída prontos para exportar.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <label className="relative">
            <span className="sr-only">Buscar templates</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por stack ou nome…"
              className="h-9 w-full rounded-lg border border-gray-800 bg-gray-950 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none sm:w-60"
            />
          </label>
          <div role="radiogroup" aria-label="Filtrar por categoria" className="flex items-center rounded-lg border border-gray-800 bg-gray-950 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  filter === f.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.id === 'all' ? `${f.label} (${TEMPLATES.length})` : f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cards grid — each card is a real <button>: focusable, activated by Enter/Space */}
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => {
          const IconComponent = ICONS[template.type];
          return (
            <li key={template.type}>
              <button
                type="button"
                onClick={() => onSelect(template.type)}
                aria-label={`Gerar ${template.title}`}
                className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${template.accentColor.borderHover}`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100 ${template.accentColor.glow}`}
                />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl border p-3 transition-transform duration-200 group-hover:scale-105 ${template.accentColor.iconBg}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                      {template.categoryLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{template.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">{template.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {template.stack.map((item) => (
                      <span key={item} className="rounded-md border border-gray-800 bg-gray-950 px-2 py-0.5 font-mono text-[10px] text-gray-300">
                        {item}
                      </span>
                    ))}
                  </div>

                  <ul className="space-y-1.5 border-t border-gray-800/80 pt-3">
                    {template.capabilities.map((cap) => {
                      const CapIcon = cap.icon;
                      return (
                        <li key={cap.label} className="flex items-center gap-2 text-xs text-gray-400">
                          <CapIcon className={`h-3.5 w-3.5 shrink-0 ${template.accentColor.iconText}`} />
                          <span className="truncate">{cap.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-gray-800/80 pt-4">
                  <span className="text-xs font-semibold text-gray-300 transition-colors group-hover:text-white">
                    {template.type === 'store' ? 'Escolher tema' : 'Gerar agora'}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors group-hover:bg-cyan-500">
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-950" />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {filteredTemplates.length === 0 && (
        <div className="space-y-3 rounded-2xl border border-dashed border-gray-800 p-12 text-center text-gray-400">
          <Layers className="mx-auto h-8 w-8 text-gray-600" />
          <p className="text-sm">Nenhum template encontrado com esses critérios.</p>
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-cyan-400 hover:underline cursor-pointer">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Platform facts — only claims that have an implementation behind them */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs text-gray-400 md:flex-row">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-cyan-400" /> Saída: gravação em disco (.exe) ou ZIP
          </span>
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" /> Gemini, OpenAI ou modo offline
          </span>
        </div>
        <span className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Motor de scaffolding pronto
        </span>
      </div>
    </div>
  );
};

export default SelectionScreen;
