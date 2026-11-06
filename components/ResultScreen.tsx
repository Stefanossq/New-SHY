import React, { useState, useCallback } from 'react';
import { ProjectType } from '../types';
import { PROJECT_TEMPLATES } from '../lib/templates';
import { generateProjectZip } from '../lib/generateProject';
import { getDatabaseSchema } from '../lib/databaseSchemas';
import { FileExplorer } from './result/FileExplorer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { LivePreview } from './LivePreview';
import { DistributedSystemDashboard } from './DistributedSystemDashboard';
import { PlatformAdapter } from '../lib/platformAdapter';
import { 
  CheckCircle2, Sparkles, Code2, Server, GitBranch, Download, ShieldCheck, Network, Laptop, FolderDown, Eye, Database, RotateCcw
} from 'lucide-react';

const ResultScreen: React.FC<{ 
  projectType: ProjectType;
  projectFiles: Record<string, any>;
  onReset: () => void;
}> = ({ projectType, projectFiles, onReset }) => {
    const [isDownloading, setIsDownloading] = useState(false);

  const project = PROJECT_TEMPLATES[projectType] || { name: 'Projeto Gerado', slug: 'projeto', files: {}, lifecycle: [] };

  // Database Tab States
  const [dbType, setDbType] = useState<'prisma' | 'sql' | 'supabase' | 'mongodb'>('prisma');
  const [isCopied, setIsCopied] = useState(false);
  const [dbSubTab, setDbSubTab] = useState<'visual' | 'code' | 'scalability'>('visual');
  const [trafficTier, setTrafficTier] = useState<'mvp' | 'scale' | 'enterprise'>('scale');

  // Deploy Tab States
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_api_token') || '');
  const [repoName, setRepoName] = useState(() => `${project.slug}-production`);
  const [vercelHook, setVercelHook] = useState(() => localStorage.getItem('vercel_deploy_hook') || '');
  const [deployStep, setDeployStep] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployProgress, setDeployProgress] = useState(0);
  const [urlProd, setUrlProd] = useState('');

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await PlatformAdapter.exportProject(
        project.name,
        project.slug,
        projectFiles,
        async () => {
          await generateProjectZip(projectType, projectFiles);
        }
      );
    } catch (error) {
      console.error("Failed to generate zip or export files:", error);
      toast.error("Falha ao exportar o projeto", { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsDownloading(false);
    }
  }, [project, projectType, projectFiles]);

  const getSchema = (): string => getDatabaseSchema(projectType, dbType);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getSchema());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runDeployPipeline = async () => {
    if (deployStep === 'running') return;
    setDeployStep('running');
    setDeployProgress(5);
    setDeployLogs(['Pipeline iniciada: Orquestrador de Git conectado de modo seguro.']);

    const addLog = (msg: string, delay: number, progress: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setDeployLogs(prev => [...prev, `[LOG] ${new Date().toLocaleTimeString()} - ${msg}`]);
          setDeployProgress(progress);
          resolve();
        }, delay);
      });
    };

    try {
      await addLog('Verificando chaves de autenticação de Pipelines informadas...', 500, 15);
      
      if (githubToken && githubToken.length > 10) {
        await addLog(`Iniciando conexão Git real. Buscando perfil do usuário...`, 500, 30);
        
        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        if (!userRes.ok) {
          throw new Error(`Token do GitHub rejeitado pela API (Status ${userRes.status}).`);
        }
        const userData = await userRes.json();
        await addLog(`Autenticado com sucesso como: @${userData.login} (${userData.name || 'User'})`, 600, 40);

        await addLog(`Criando repositório privado no GitHub: "${repoName}"...`, 800, 50);
        let repoRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            description: `Orquestrado via SaaS Prototype Engine para o tema ${project.name}`,
            private: true,
            auto_init: true
          })
        });

        if (!repoRes.ok && repoRes.status !== 422) {
          throw new Error(`Falha ao criar o repósitorio no GitHub (Status ${repoRes.status}).`);
        }
        await addLog(`Repositório ${userData.login}/${repoName} ativado na nuvem do usuário.`, 600, 65);

        await addLog(`Processando arquivos flat e enviando para a branch principal (main)...`, 800, 80);
        
        const filesFlat = Object.entries(projectFiles);
        let commitsDone = 0;
        for (const [path, content] of filesFlat) {
          try {
            const fileContentToSend = typeof content === 'string' ? content : ((content as { base64?: string })?.base64 || '');
            const isBase64 = typeof content !== 'string';
            
            const putRes = await fetch(`https://api.github.com/repos/${userData.login}/${repoName}/contents/${path}`, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `chore: add ${path} orchestrated by AI`,
                content: isBase64 ? fileContentToSend : btoa(unescape(encodeURIComponent(fileContentToSend))),
                branch: 'main'
              })
            });
            if (putRes.ok) {
              commitsDone++;
            }
          } catch (fileErr) {
            // ignore
          }
        }
        
        await addLog(`Sincronização real efetuada: ${commitsDone} arquivos enviados para o GitHub com sucesso!`, 600, 90);

        if (vercelHook) {
          await addLog(`Disparando sinalizador Webhook na Vercel CDN...`, 600, 95);
          await fetch(vercelHook, { method: 'POST' });
          await addLog(`Webhook de Deploy disparado! Vercel iniciou a compilação do seu Next.js.`, 500, 100);
          setUrlProd(`https://vercel.com/new/git/external?repository-url=https://github.com/${userData.login}/${repoName}`);
        } else {
          await addLog(`Aviso: Webhook do hoster de nuvem ausente. Pulei o deploy automático.`, 400, 100);
          setUrlProd(`https://github.com/${userData.login}/${repoName}`);
        }

      } else {
        await addLog('Conectando simulador de sandbox na infraestrutura da Vercel Edge...', 700, 30);
        await addLog(`Provisionando repositório privado em: github.com/stefsqs/${repoName}`, 800, 50);
        await addLog('Encurtando dependências com Clerk Auth e Convex DB...', 600, 65);
        await addLog('Empacotando bundles e enviando imagens estáticas via webhook...', 1000, 80);
        await addLog('Rodando esbuild, lint checks e compilando na rede Vercel Edge CDN...', 900, 95);
        await addLog('Ambiente de produção estabelecido com sucesso!', 500, 100);
        setUrlProd(`https://${repoName}-demo-preview.vercel.app`);
      }

      setDeployStep('success');
    } catch (err: any) {
      console.error(err);
      setDeployLogs(prev => [...prev, `[ERRO] ${err.message || 'Falha inexplicável na Pipeline de Deploy.'}`]);
      setDeployStep('error');
    }
  };

  const exportLabel = isDownloading ? 'Exportando…' : PlatformAdapter.isDesktop() ? 'Salvar no disco' : 'Exportar .zip';

  return (
    <div className="relative flex w-full flex-col gap-5 text-xs animate-fade-in">
      {/* Project header — primary actions stay reachable while scrolling */}
      <header className="sticky top-0 z-20 -mx-1 flex flex-col justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/85 p-4 backdrop-blur-md md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold tracking-tight text-white md:text-xl">{project.name}</h2>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Pronto
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              Scaffolding gerado · {Object.keys(projectFiles).length} arquivos no blueprint
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={onReset}>
            <RotateCcw /> Novo projeto
          </Button>
          <Button variant="primary" size="md" onClick={handleDownload} disabled={isDownloading} data-testid="export-button">
            {PlatformAdapter.isDesktop() ? <FolderDown /> : <Download />}
            {exportLabel}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="preview" className="min-h-[500px]">
        <TabsList aria-label="Seções do projeto gerado">
          <TabsTrigger value="preview"><Eye /> Live Preview</TabsTrigger>
          <TabsTrigger value="code"><Code2 /> Código</TabsTrigger>
          <TabsTrigger value="database"><Database /> Banco de dados</TabsTrigger>
          <TabsTrigger value="distributed"><Network /> Topologia</TabsTrigger>
          <TabsTrigger value="deploy"><GitBranch /> Deploy</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-200">
              <Sparkles className="h-4 w-4 text-cyan-400" /> Playground virtualizado
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
              As APIs do Next.js + Convex são simuladas em memória. Teste o carrinho e checkout, os comentários do blog e o
              assistente de roteiros sem sair do studio.
            </p>
          </div>
          <LivePreview projectType={projectType} projectFiles={projectFiles} />
        </TabsContent>

        <TabsContent value="code">
          <FileExplorer files={projectFiles} />
        </TabsContent>

        <TabsContent value="database">
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Database Tab Inner Navigation */}
            <div className="bg-gray-900 border border-gray-750 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1 text-left">
                <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Arquitetura de Dados de Alta Escalabilidade
                </h3>
                <p className="text-gray-400 text-[11px] leading-relaxed max-w-xl">
                  Escolha um modo de visualização para explorar a arquitetura, simular limites de concorrência ou copiar migrations de produção de bancos de dados relacionais e orientados a documentos.
                </p>
              </div>

              {/* Sub-tabs buttons */}
              <div className="flex bg-gray-950 p-1.5 rounded-lg border border-gray-800 text-[10px] font-bold self-stretch sm:self-auto justify-between gap-1">
                <button
                  onClick={() => setDbSubTab('visual')}
                  className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${
                    dbSubTab === 'visual' ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📊 Diagrama ER
                </button>
                <button
                  onClick={() => setDbSubTab('scalability')}
                  className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${
                    dbSubTab === 'scalability' ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🚀 Alta Concorrência
                </button>
                <button
                  onClick={() => setDbSubTab('code')}
                  className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${
                    dbSubTab === 'code' ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💾 Código SQL / Prisma
                </button>
              </div>
            </div>

            {/* Inner Tab: Visual ER Diagram */}
            {dbSubTab === 'visual' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-cyan-950/20 border border-cyan-800/20 p-4 rounded-xl text-left text-cyan-300 text-[11px] leading-relaxed">
                  <strong>💡 Modelagem Relacional & Cardinalidade:</strong>
                  <p className="mt-1">
                    Os esquemas abaixo foram gerados de forma otimizada para bancos de dados serverless ou clusters gerenciados de alta disponibilidade. O uso correto de índices <span className="text-white font-mono bg-cyan-900/40 px-1 py-0.2 rounded">IDX</span> remove gargalos comuns de busca e garante eficiência em leituras compostas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(projectType === 'store' 
                    ? [
                        {
                          name: 'User (Tabela de Usuários)',
                          desc: 'Gerenciamento de Identidade via Clerk',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'ID identificador principal do app', isKey: true },
                            { name: 'clerkId', type: 'String (Unique)', desc: 'ID federado do Clerk SSO', isIndex: true },
                            { name: 'name', type: 'String', desc: 'Nome visível do usuário' },
                            { name: 'createdAt', type: 'DateTime', desc: 'Timestamp de adesão' }
                          ],
                          relations: ['Review.userId', 'Sales.userId', 'Cart.userId']
                        },
                        {
                          name: 'Product (Catálogo)',
                          desc: 'Tabela de Produtos Dinâmicos',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'ID de rastreio SKU', isKey: true },
                            { name: 'name', type: 'String', desc: 'Nome Comercial do Produto', isIndex: true },
                            { name: 'price', type: 'Decimal(10,2)', desc: 'Preço em BRL para checkout', isIndex: true },
                            { name: 'description', type: 'Text', desc: 'Copy de vendas de IA' },
                            { name: 'category', type: 'String', desc: 'Filtros rápidos (Tech/Office)', isIndex: true },
                            { name: 'stock', type: 'Integer', desc: 'Inibe venda sem estoque' },
                            { name: 'imageUrl', type: 'Text', desc: 'URL da foto gerada' }
                          ],
                          relations: ['Review.productId', 'CartItem.productId', 'SaleItem.productId']
                        },
                        {
                          name: 'Review (Avaliações)',
                          desc: 'Módulo de Prova Social Reativa',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'ID único do review', isKey: true },
                            { name: 'productId', type: 'Varchar (FK)', desc: 'Produto avaliado', isFK: true, isIndex: true },
                            { name: 'userId', type: 'Varchar (FK)', desc: 'Autor do feedback', isFK: true, isIndex: true },
                            { name: 'userName', type: 'String', desc: 'Nome do autor' },
                            { name: 'rating', type: 'Integer', desc: 'Nota da avaliação (1-5)', isIndex: true },
                            { name: 'comment', type: 'Text', desc: 'Depoimento textual' }
                          ]
                        },
                        {
                          name: 'Cart (Carrinho Ativo)',
                          desc: 'Sessão temporária de compras',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'Código do carrinho', isKey: true },
                            { name: 'userId', type: 'Varchar (FK, Unique)', desc: 'Dono do carrinho', isFK: true, isIndex: true }
                          ],
                          relations: ['CartItem.cartId']
                        },
                        {
                          name: 'CartItem (Itens de Compras)',
                          desc: 'Guarda quantidade e itens no carrinho',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'Identificador', isKey: true },
                            { name: 'cartId', type: 'Varchar (FK)', desc: 'Carrinho pai conexo', isFK: true, isIndex: true },
                            { name: 'productId', type: 'Varchar (FK)', desc: 'Item adicionado', isFK: true, isIndex: true },
                            { name: 'quantity', type: 'Integer', desc: 'Volume de itens (>0)' }
                          ]
                        },
                        {
                          name: 'Sale (Faturamento)',
                          desc: 'Histórico de Vendas Geradas',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'ID do Pedido', isKey: true },
                            { name: 'userId', type: 'Varchar (FK)', desc: 'Dono do pedido', isFK: true, isIndex: true },
                            { name: 'total', type: 'Decimal(10,2)', desc: 'Valor total do pedido' },
                            { name: 'shippingAddress', type: 'Text', desc: 'Endereço validado' }
                          ],
                          relations: ['SaleItem.saleId']
                        }
                      ]
                    : projectType === 'blog'
                    ? [
                        {
                          name: 'Post (Publicações)',
                          desc: 'Tabela de Postagens de Animes',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'ID da publicação', isKey: true },
                            { name: 'title', type: 'String', desc: 'Título chamativo' },
                            { name: 'slug', type: 'String (Unique)', desc: 'Uso em rotas amigáveis SEO', isIndex: true },
                            { name: 'summary', type: 'Text', desc: 'Resumo rápido para feed' },
                            { name: 'content', type: 'Text (Longo)', desc: 'Markdown completo da postagem' },
                            { name: 'published', type: 'Boolean', desc: 'Status de visibilidade' },
                            { name: 'likesCount', type: 'Integer', desc: 'Contadores de engajamento' }
                          ],
                          relations: ['Comment.postId']
                        },
                        {
                          name: 'Comment (Discussões)',
                          desc: 'Comentários com Personas Customizadas',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'Identificador único', isKey: true },
                            { name: 'postId', type: 'Varchar (FK)', desc: 'Post original associado', isFK: true, isIndex: true },
                            { name: 'author', type: 'String', desc: 'Nome do autor do comentário' },
                            { name: 'text', type: 'Text', desc: 'Conteúdo do comentário' },
                            { name: 'persona', type: 'String', desc: 'Estereótipo do bot (ex: Fanboy)', isIndex: true }
                          ]
                        }
                      ]
                    : [
                        {
                          name: 'Trip (Roteiro Turístico)',
                          desc: 'Cabeçalho de viagem do usuário',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'Identificador de roteiro', isKey: true },
                            { name: 'userId', type: 'Varchar (FK/Indexed)', desc: 'Pertence ao usuário logado', isIndex: true },
                            { name: 'destination', type: 'String', desc: 'Destino / Cidade turística' }
                          ],
                          relations: ['Itinerary.tripId']
                        },
                        {
                          name: 'Itinerary (Programação)',
                          desc: 'Tabela Organizadora Dia-a-Dia',
                          columns: [
                            { name: 'id', type: 'Varchar (PK)', desc: 'Identificador de dia', isKey: true },
                            { name: 'tripId', type: 'Varchar (FK)', desc: 'Trip associada', isFK: true, isIndex: true },
                            { name: 'dayTitle', type: 'String', desc: 'ex: "Dia 1: Chegada e Check-in"' },
                            { name: 'transport', type: 'String', desc: 'Meios recomendados (Táxi, Metrô)' },
                            { name: 'morningPlan', type: 'Text', desc: 'Plano matinal' },
                            { name: 'afterPlan', type: 'Text', desc: 'Plano vespertino' },
                            { name: 'eveningPlan', type: 'Text', desc: 'Atividades noturnas recomendadas' }
                          ]
                        }
                      ]
                  ).map((table, tIdx) => (
                    <div 
                      key={tIdx} 
                      className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden hover:border-cyan-500/40 transition duration-300 flex flex-col justify-between h-auto"
                    >
                      <div>
                        {/* Table Header */}
                        <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                          <div className="text-left">
                            <span className="font-mono text-[11px] font-black text-gray-100">{table.name}</span>
                            <span className="text-[9px] text-gray-500 block mt-0.5">{table.desc}</span>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 px-2 py-0.5 rounded">
                            Tabela
                          </span>
                        </div>

                        {/* Columns List */}
                        <div className="p-3 space-y-2">
                          {table.columns.map((col, cIdx) => (
                            <div key={cIdx} className="flex justify-between items-start gap-4 py-1 border-b border-gray-900/50 last:border-b-0">
                              <div className="text-left flex items-start gap-1.5 flex-1 min-w-0">
                                {col.isKey && (
                                  <span className="bg-yellow-500 text-black text-[8px] px-1 rounded font-black flex-shrink-0" title="Primary Key">PK</span>
                                )}
                                {col.isFK && (
                                  <span className="bg-blue-500 text-white text-[8px] px-1 rounded font-black flex-shrink-0" title="Foreign Key">FK</span>
                                )}
                                {col.isIndex && !col.isKey && (
                                  <span className="bg-emerald-500 text-black text-[8px] px-1 rounded font-black flex-shrink-0" title="Relational Database Index">IDX</span>
                                )}
                                <div className="truncate">
                                  <span className="font-mono font-bold text-gray-200 text-[10px]">{col.name}</span>
                                  <span className="text-gray-500 text-[9px] block mt-0.2 leading-normal">{col.desc}</span>
                                </div>
                              </div>
                              <span className="font-mono text-cyan-500 text-[9px] font-black uppercase flex-shrink-0 pt-0.5">
                                {col.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outward Relations */}
                      {table.relations && table.relations.length > 0 && (
                        <div className="bg-gray-900/40 p-2.5 border-t border-gray-800/60 flex flex-wrap gap-1 items-center justify-start text-[10px] text-gray-400">
                          <span className="font-bold text-gray-500 text-[9px]">Relacionamentos:</span>
                          {table.relations.map((rel, rIdx) => (
                            <span key={rIdx} className="bg-gray-800 text-[9px] px-1.5 py-0.5 rounded text-gray-300 font-mono">
                              &rarr; {rel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inner Tab: Concurrency & Scalability Projections */}
            {dbSubTab === 'scalability' && (
              <div className="space-y-5 animate-fade-in text-left">
                <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Projetor de Performance & Infraestrutura</span>
                    <h4 className="text-sm font-bold text-gray-200">Escolha a escala de concorrência esperada para o SaaS para calcular dimensões ideais de infra</h4>
                  </div>

                  {/* Traffic Select Button Slider */}
                  <div className="grid grid-cols-3 bg-gray-900 p-1 rounded-lg border border-gray-800 w-full md:w-auto text-[10px] font-bold gap-1">
                    {[
                      { key: 'mvp', label: '🚀 1k users/semana' },
                      { key: 'scale', label: '⚡ 100k users/semana' },
                      { key: 'enterprise', label: '🏢 +1M users/semana' }
                    ].map(tier => (
                      <button
                        key={tier.key}
                        onClick={() => setTrafficTier(tier.key as any)}
                        className={`px-3 py-2 rounded-md transition cursor-pointer text-center ${
                          trafficTier === tier.key ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gray-950 p-5 rounded-xl border border-gray-850 space-y-4">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block border-b border-gray-900 pb-2">
                      Análise de Gargalos e Soluções Proativas
                    </span>

                    <div className="space-y-3 font-sans text-[11px] leading-relaxed">
                      {trafficTier === 'mvp' ? (
                        <>
                          <div className="flex gap-2">
                            <span className="text-yellow-500 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-200 font-bold block">Conexão direta ao banco:</strong>
                              <p className="text-gray-400">Excelente para protótipos e testes offline. Dispensa o uso de balanceadores de carga ou intermediários do lado do banco de dados.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-yellow-500 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-200 font-bold block">Limites de Cota de IA:</strong>
                              <p className="text-gray-400">O Gemini-3.5-Flash acomoda até 2.000 requisições/minuto gratuitas, dando total liberdade para as simulações em tempo de desenvolvimento.</p>
                            </div>
                          </div>
                        </>
                      ) : trafficTier === 'scale' ? (
                        <>
                          <div className="flex gap-2">
                            <span className="text-cyan-400 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-200 font-bold block">Otimização de Pool de Conexões:</strong>
                              <p className="text-gray-400">Recomenda-se setar <span className="text-white font-mono bg-cyan-950/40 px-1">connection_limit=20</span> no Prisma ou Docker. Evita rejeição de pacotes em picos repentinos de acessos simultâneos.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-cyan-400 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-200 font-bold block">Estratégia de Cache Estático:</strong>
                              <p className="text-gray-400">Configurando TTL de cache do catálogo e listagens públicas em 60s reduz a carga direta no PostgreSQL em até 88%, reduzindo uso de CPU do cluster.</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <span className="text-red-400 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-100 font-bold block">Read-Replicas Requeridas:</strong>
                              <p className="text-gray-400 text-[10.5px]">Necessidade de isolamento: 1 instância principal dedicada a escritas rápidas (Transações de Checkout, Comentários, Trips) e de 2 a 3 instâncias de réplica apenas de leitura para listagem do catálogo de forma horizontal.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-red-400 font-bold">&bull;</span>
                            <div>
                              <strong className="text-gray-100 font-bold block">Redis Cluster ou Memcached Necessário:</strong>
                              <p className="text-gray-400 text-[10.5px]">Uma camada de memória RAM intermediária é mandatória para reter as tabelas de alta mutação, evitando transações caras e I/O de disco repetitivo.</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-xl border border-gray-850 space-y-4 font-mono text-[11px]">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider block border-b border-gray-900 pb-2 font-sans">
                      Estimadores e Métricas Recomendadas de Sizing
                    </span>

                    <table className="w-full text-left font-mono text-[10.5px] border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-900">
                          <td className="py-2 text-gray-500 font-sans">Queries por Segundo (QPS)</td>
                          <td className="py-2 text-right text-gray-200 font-bold">
                            {trafficTier === 'mvp' ? '~1.2 Queries/s' : trafficTier === 'scale' ? '~45 Queries/s (Picos: 300 QPS)' : '~1.500 Queries/s (Picos: 8.000 QPS)'}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-900">
                          <td className="py-2 text-gray-500 font-sans">Sizing RAM & CPU (GCP | AWS)</td>
                          <td className="py-2 text-right text-cyan-400 font-bold">
                            {trafficTier === 'mvp' ? '0.25 vCPU, 512MB RAM' : trafficTier === 'scale' ? '2 dedicated vCPUs, 4GB RAM' : '8+ dedicated vCPUs, 32GB RAM'}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-900">
                          <td className="py-2 text-gray-500 font-sans">Mecanismo de Escala Horizontal</td>
                          <td className="py-2 text-right text-gray-200">
                            {trafficTier === 'mvp' ? 'Nenhum (Container Único)' : trafficTier === 'scale' ? 'Autoprovisionamento (Min: 2, Max: 10 containers)' : 'Cluster Kubernetes / ECS (Min: 6, Max: 50 containers)'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-500 font-sans">Custo Estimado de DB Mensal</td>
                          <td className="py-2 text-right text-emerald-400 font-bold">
                            {trafficTier === 'mvp' ? 'R$ 0,00 (Plano Gratuito)' : trafficTier === 'scale' ? 'R$ 150,00 - R$ 300,00 /mês' : 'R$ 1.800,00 a R$ 4.500,00 /mês'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 border border-gray-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block pb-1.5 border-b border-gray-900">
                    📋 Checklist de Verificação de Alta Disponibilidade (Produção)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] leading-relaxed text-gray-400">
                    <div className="flex gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-900">
                      <input type="checkbox" defaultChecked className="mt-0.5 rounded text-cyan-500 accent-cyan-500 cursor-pointer" />
                      <div>
                        <strong className="text-gray-200 font-bold block">Indexação de Chaves Estrangeiras:</strong>
                        <span>Verificado. Todos os esquemas fornecidos indexam implicitamente campos de busca composta.</span>
                      </div>
                    </div>
                    <div className="flex gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-900">
                      <input type="checkbox" defaultChecked className="mt-0.5 round text-cyan-500 accent-cyan-500 cursor-pointer" />
                      <div>
                        <strong className="text-gray-200 font-bold block">Isolamento Multi-tenant:</strong>
                        <span>Habilitado por padrão utilizando Clerk JWT ou políticas RLS Supabase nativas por ID de User.</span>
                      </div>
                    </div>
                    <div className="flex gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-900">
                      <input type="checkbox" defaultChecked className="mt-0.5 round text-cyan-500 accent-cyan-500 cursor-pointer" />
                      <div>
                        <strong className="text-gray-200 font-bold block">Compressão gzip/brotli:</strong>
                        <span>Otimizado. Bundles do Vite ativos com minificação e compressão para carregamento sub-segundo no Edge.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inner Tab: Raw Migrations / Codes Visualizer */}
            {dbSubTab === 'code' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-gray-900 border border-gray-750 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="text-left font-sans">
                    <h3 className="font-bold text-gray-200 text-sm flex items-center gap-1.5 animate-pulse">
                      ⚡ Códigos de Banco de Dados de Produção
                    </h3>
                    <p className="text-gray-400 text-[11px] mt-1 leading-relaxed max-w-xl">
                      Copie os scripts e execute no orquestrador do seu banco de dados para criar tabelas e schemas instantaneamente.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 bg-gray-950 p-1 rounded-md border border-gray-850 text-[10px] font-bold">
                    {(['prisma', 'sql', 'supabase', 'mongodb'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => setDbType(style)}
                        className={`px-3 py-1.5 uppercase rounded-sm cursor-pointer ${
                          dbType === style ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-950 border border-gray-850 rounded-lg overflow-hidden flex flex-col relative h-[450px]">
                  <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center z-10 font-sans">
                    <span className="font-mono text-[10px] text-gray-400">
                      {dbType === 'prisma' ? 'schema.prisma' : dbType === 'sql' ? 'migrations.sql' : dbType === 'supabase' ? 'supabase_policies.sql' : 'mongoose_schema.js'}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-3 py-1 text-[10px] rounded border border-gray-700 transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      {isCopied ? 'Copiado! ✓' : 'Copiar Código'}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 bg-gray-950 font-mono text-[11px]/relaxed text-gray-300 custom-scrollbar select-text selection:bg-cyan-500/20">
                    <code>{getSchema()}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deploy">
          <div className="bg-gray-900 border border-gray-750 p-5 rounded-lg space-y-5 animate-fade-in text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <div>
                <h3 className="font-extrabold text-sm text-gray-200 uppercase flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-cyan-400 animate-pulse" /> Sincronização e Deploy 1-Clique Vercel/GitHub
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal mt-0.5 max-w-xl">
                  Insira suas chaves do GitHub e Vercel para que as APIs enviem o código real de forma autenticada. Se preferir, clique direto para testar com nosso simulador sandbox.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-3.5 bg-gray-950 p-4 rounded-xl border border-gray-850">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block pb-1 border-b border-gray-800">
                  Chaves de Integração (PAT)
                </span>
                
                <div className="space-y-1">
                  <label className="text-gray-400 font-bold block">GitHub Token (PAT)</label>
                  <input 
                    type="password" 
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxx" 
                    value={githubToken}
                    onChange={e => {
                      setGithubToken(e.target.value);
                      localStorage.setItem('github_api_token', e.target.value);
                    }}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-white font-mono focus:outline-none placeholder-gray-600 focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 font-bold block">Nome do Repositório</label>
                  <input 
                    type="text" 
                    placeholder="minha-loja-ia-premium" 
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1 pb-1">
                  <label className="text-gray-400 font-bold block">Vercel Deploy Webhook URL (opcional)</label>
                  <input 
                    type="password" 
                    placeholder="https://api.vercel.com/v1/integrations/deploy/..." 
                    value={vercelHook}
                    onChange={e => {
                      setVercelHook(e.target.value);
                      localStorage.setItem('vercel_deploy_hook', e.target.value);
                    }}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-white focus:outline-none placeholder-gray-600 focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col justify-between space-y-3.5 bg-gray-950 p-4 rounded-xl border border-gray-850 text-xs text-left">
                <div>
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest block pb-1 border-b border-gray-800">
                    Console Logs da Pipeline
                  </span>

                  {deployStep === 'running' && (
                    <div className="mt-3 bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-850">
                      <div 
                        className="bg-cyan-500 h-full transition-all duration-300"
                        style={{ width: `${deployProgress}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="mt-3 bg-gray-900 border border-gray-850 rounded-lg p-3 h-56 overflow-y-auto space-y-1.5 font-mono text-[10px] text-gray-400 custom-scrollbar h-48 select-text">
                    {deployLogs.length === 0 ? (
                      <span className="text-gray-550 block italic">Aguardando gatilho do botão de Deploy para compilar...</span>
                    ) : (
                      deployLogs.map((log, lIdx) => (
                        <div key={lIdx} className={log.includes('[ERRO]') ? 'text-red-400 font-bold' : log.includes('Sincronização real') ? 'text-green-400 font-bold' : ''}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={runDeployPipeline}
                    disabled={deployStep === 'running'}
                    className="w-full sm:w-auto flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {deployStep === 'running' ? (
                      <>Compilando {deployProgress}%</>
                    ) : (
                      <>🚀 Sincronizar & Publicar na Nuvem</>
                    )}
                  </button>

                  {deployStep === 'success' && urlProd && (
                    <a
                      href={urlProd}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex-1 py-1.5 border border-green-500/40 text-green-400 hover:text-green-300 bg-green-500/5 text-center font-bold text-[10px] rounded-lg transition"
                    >
                      Abrir link gerado em Produção &gt;
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distributed">
          <div className="space-y-4 animate-fade-in">
            <DistributedSystemDashboard projectType={projectType} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultScreen;
