import React, { useState } from 'react';
import { 
  GitBranch, Code2, Layers, Key, Server, PlusCircle, CheckCircle, AlertTriangle, 
  Trash, ArrowRight, Download, RefreshCw, FileText
} from 'lucide-react';

interface TemplateRegistry {
  id: string;
  name: string;
  repoUrl: string;
  version: string;
  blueprint: {
    templateId: string;
    description: string;
    injectionPoints: { filePath: string; strategy: string; marker: string }[];
  };
}

const INITIAL_REGISTRIES: TemplateRegistry[] = [
  {
    id: 'store-convex-v1',
    name: 'Loja Premium (Next.js + Convex)',
    repoUrl: 'github.com/saas-orchestration/template-ecommerce-convex',
    version: '1.2.4',
    blueprint: {
      templateId: 'convex-ecommerce-v1',
      description: 'E-commerce completo com banco Convex e Clerk Auth',
      injectionPoints: [
        { filePath: 'convex/products.ts', strategy: 'inject-database-schema', marker: '/* __AI_PRODUCTS_INJECTION_POINT__ */' },
        { filePath: 'src/theme.json', strategy: 'inject-palette', marker: '__AI_THEME_COLORS__' }
      ]
    }
  },
  {
    id: 'blog-nextjs-terminal-v2',
    name: 'Blog Técnico (Next.js 14 + Markdown)',
    repoUrl: 'github.com/saas-orchestration/template-nextjs-blog-cli',
    version: '2.0.1',
    blueprint: {
      templateId: 'nextjs-blog-cli',
      description: 'Blog pessoal estilizado como console para animes/tech',
      injectionPoints: [
        { filePath: 'src/posts.json', strategy: 'inject-ai-posts', marker: '"/* __AI_POSTS_INJECTION_POINT__ */"' }
      ]
    }
  },
  {
    id: 'travel-planner-ai-v1',
    name: 'Planejador de Viagens (Pure CSS + Gemini)',
    repoUrl: 'github.com/saas-orchestration/template-travel-planner-pure',
    version: '1.0.0',
    blueprint: {
      templateId: 'travel-planner-ai-pure',
      description: 'Roteiros de viagens inteligentes em layout Glassmorphism',
      injectionPoints: [
        { filePath: 'src/itineraries.ts', strategy: 'inject-itinerary-ai', marker: '/* __AI_ITINERARY_INJECTION_POINT__ */' }
      ]
    }
  }
];

export const TemplateRegistryDashboard: React.FC = () => {
  const [registries, setRegistries] = useState<TemplateRegistry[]>(INITIAL_REGISTRIES);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  
  // Security Verification for the Creator
  const [passphrase, setPassphrase] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [description, setDescription] = useState('');
  const [filePath, setFilePath] = useState('');
  const [marker, setMarker] = useState('');

  const handleRegisterTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !repo || !description) return;

    // Simulate S3/GitHub download streams pipeline
    setLoadingStep('Buscando repositório na API de Releases do GitHub...');
    setTimeout(() => {
      setLoadingStep('Extraindo pacote ZIP na memória RAM temporária...');
      setTimeout(() => {
        setLoadingStep('Lendo arquivo de manifesto blueprint.json...');
        setTimeout(() => {
          setLoadingStep('Escrevendo injeção de marcadores AST de segurança...');
          setTimeout(() => {
            const newItem: TemplateRegistry = {
              id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`,
              name,
              repoUrl: repo.replace(/^(http:\/\/|https:\/\/)/, ''),
              version: '1.0.0',
              blueprint: {
                templateId: `${name.toLowerCase().replace(/\s+/g, '-')}-id`,
                description,
                injectionPoints: [
                  { 
                    filePath: filePath || 'src/data.ts', 
                    strategy: 'inject-custom-model', 
                    marker: marker || '/* __AI_CUSTOM_INJECTION_POINT__ */' 
                  }
                ]
              }
            };
            setRegistries(prev => [newItem, ...prev]);
            setLoadingStep(null);
            setIsAdding(false);
            setIsAuthenticated(false); // Relock on success for safety
            setPassphrase('');
            // Reset fields
            setName('');
            setRepo('');
            setDescription('');
            setFilePath('');
            setMarker('');
          }, 600);
        }, 600);
      }, 505);
    }, 505);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.trim().toLowerCase() === 'criador' || passphrase.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Chave do Criador inválida ou não autorizada. Contate o administrador.');
    }
  };

  const handleRemove = (id: string) => {
    // Only creator can remove templates as well. Show alert if not authorized.
    const confirmCode = prompt("Esta é uma ação restrita. Digite a Chave do Criador ('criador') para confirmar a exclusão deste template:");
    if (confirmCode?.toLowerCase() === 'criador' || confirmCode?.toLowerCase() === 'admin') {
      setRegistries(prev => prev.filter(r => r.id !== id));
    } else if (confirmCode !== null) {
      alert("Chave inválida. Exclusão de template cancelada.");
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-750/50 rounded-lg p-5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-700/50 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" /> Registro de Templates Desacoplados
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-normal max-w-xl text-left">
            Padrão de engenharia <strong>Template Decoupled Registry</strong>. Reduza o bundle final isolando layouts em repositórios independentes mapeados por <code className="text-cyan-400">blueprint.json</code>.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setIsAuthenticated(false);
            setPassphrase('');
            setAuthError(null);
          }}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-3 py-1.5 text-xs rounded transition duration-200 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Registrar Novo Template (Criador)
        </button>
      </div>

      {/* Notice regarding restricted generation privilege */}
      <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl text-left text-amber-300 text-xs flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-gray-100 font-bold">Privilégio de Modulação do Criador:</strong>
          <p className="mt-1 leading-relaxed text-gray-400">
            Apenas o criador legítimo do sistema pode inserir, orquestrar ou remover bases de templates desacoplados a fim de mitigar o risco de injeção de código inseguro ou schemas inválidos por usuários comuns.
          </p>
        </div>
      </div>

      {/* Adding Loading step or Overlay */}
      {loadingStep && (
        <div className="bg-gray-950/80 border border-cyan-500/20 p-5 rounded-lg flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-sm font-bold text-gray-100">Fazendo Pull Stream do Repositório</div>
          <div className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded font-mono">{loadingStep}</div>
        </div>
      )}

      {/* Verification Gate */}
      {isAdding && !isAuthenticated && !loadingStep && (
        <div className="bg-gray-900 border border-gray-700/55 rounded-xl p-6 max-w-md mx-auto space-y-4 animate-fade-in text-xs text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
            <Key className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-500 uppercase tracking-wider">Acesso Restrito</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Os templates só podem ser gerados e catalogados pelo **Criador**. Por favor, insira as credenciais administrativas para liberar a área de criação.
          </p>
          <form onSubmit={handleAuthenticate} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 font-bold block">Chave do Criador de Sistemas (Skins)</label>
              <input
                type="password"
                placeholder="Insira a chave do criador (Ex: 'criador' ou 'admin')"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-yellow-500"
              />
              <span className="text-[10px] text-gray-500 italic mt-1 block">Dica para testes: digite <span className="text-cyan-400 font-bold">criador</span> ou <span className="text-cyan-400 font-bold">admin</span></span>
            </div>

            {authError && (
              <div className="p-2 border border-red-500/20 bg-red-950/20 text-red-400 rounded text-[10px] font-semibold">
                {authError}
              </div>
            )}

            <div className="flex gap-2.5 pt-1.5">
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-4 py-1.5 rounded text-xs transition duration-200 cursor-pointer"
              >
                Liberar Acesso
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold px-4 py-1.5 rounded text-xs transition border border-gray-750"
              >
                Voltar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adding Template Form */}
      {isAdding && isAuthenticated && !loadingStep && (
        <form onSubmit={handleRegisterTemplate} className="bg-gray-900 border border-emerald-500/30 rounded-lg p-5 space-y-4 animate-fade-in text-xs text-left">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <span className="font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" /> Configuração Registrada - Modo Criador Ativo
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-black font-mono">
              Sessão Autorizada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-400 font-bold block">Nome do Modelo (Template)</label>
              <input 
                type="text" 
                placeholder="Ex: SaaS CRM Dashboard" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-400 font-bold block">Slug do Repositório GitHub</label>
              <input 
                type="text" 
                placeholder="Ex: github.com/minha-marca/template-saas-crm" 
                required
                value={repo}
                onChange={e => setRepo(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold block font-semibold">Descrição do Caso de Uso</label>
            <input 
              type="text" 
              placeholder="Ex: Painel administrativo com controle de vendas financeiras e geração de relatórios de IA" 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none"
            />
          </div>

          {/* Mapeamentos do blueprint.json */}
          <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-lg space-y-3.5">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Marcadores do blueprint.json (Injeção de IA)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 block">Caminho do Arquivo Alvo</label>
                <input 
                  type="text" 
                  placeholder="Ex: src/data/leads.ts" 
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 block">Marcador de Injeção de Inteligência</label>
                <input 
                  type="text" 
                  placeholder="Ex: /* __AI_LEADS_INJECTION_POINT__ */" 
                  value={marker}
                  onChange={e => setMarker(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded transition-colors cursor-pointer"
            >
              Publicar Novo Template no Hub
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsAdding(false);
                setIsAuthenticated(false);
              }}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold px-4 py-2 rounded transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Registries List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {registries.map((reg, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-750 p-4 rounded-lg flex flex-col justify-between hover:border-cyan-500/20 transition">
            <div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/15 px-2 py-0.5 rounded uppercase">
                  v{reg.version}
                </span>
                <button 
                  onClick={() => handleRemove(reg.id)}
                  title="remover template"
                  className="text-red-400 hover:text-red-300 p-1 bg-gray-850 hover:bg-gray-850/80 rounded cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="font-extrabold text-sm text-gray-100 mt-2.5 leading-snug">{reg.name}</h4>
              <p className="text-[11px] text-gray-400 leading-normal mt-1 mb-2.5 font-medium">{reg.blueprint.description}</p>
              
              <div className="border-t border-gray-850 pt-2.5 space-y-2 text-[10px]/normal font-mono">
                <div className="flex items-center gap-1.5 text-gray-500 truncate">
                  <GitBranch className="w-3.5 h-3.5 text-gray-600" />
                  <span>{reg.repoUrl}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-850 pt-3 mt-3 space-y-2">
              <span className="text-[9px] text-cyan-400 uppercase font-bold block flex items-center gap-1">
                <Code2 className="w-3 h-3" /> Mapeamento Blueprint:
              </span>
              {reg.blueprint.injectionPoints.map((point, pIdx) => (
                <div key={pIdx} className="bg-gray-950 p-2 rounded border border-gray-850 text-[10px]/relaxed space-y-1 select-text">
                  <div className="text-gray-500">
                    Arquivo: <span className="text-gray-300 font-bold">{point.filePath}</span>
                  </div>
                  <div className="text-gray-500">
                    Marcador: <code className="text-amber-400 font-bold">{point.marker}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Global Edge Distribution Nodes (Mesh) */}
      <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl space-y-3 text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-xs text-gray-200">Rede Global de Distribuição de Templates (Edge CDN Mesh)</h4>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync Ativo em 4 Regiões
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
          <div className="bg-gray-950 p-2 rounded border border-gray-850">
            <span className="text-gray-400 block">🇧🇷 GRU (São Paulo)</span>
            <span className="text-emerald-400 font-bold">● 14ms (Primary Sync)</span>
          </div>
          <div className="bg-gray-950 p-2 rounded border border-gray-850">
            <span className="text-gray-400 block">🇺🇸 IAD (N. Virginia)</span>
            <span className="text-emerald-400 font-bold">● 62ms (Replica 1)</span>
          </div>
          <div className="bg-gray-950 p-2 rounded border border-gray-850">
            <span className="text-gray-400 block">🇩🇪 FRA (Frankfurt)</span>
            <span className="text-emerald-400 font-bold">● 118ms (Replica 2)</span>
          </div>
          <div className="bg-gray-950 p-2 rounded border border-gray-850">
            <span className="text-gray-400 block">🇯🇵 NRT (Tóquio)</span>
            <span className="text-emerald-400 font-bold">● 180ms (Replica 3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
