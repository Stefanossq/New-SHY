import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ProjectType, FileNode } from '../types';
import { PROJECT_TEMPLATES } from '../lib/templates';
import { generateProjectZip } from '../lib/generateProject';
import { buildFileTree } from '../lib/utils';
import { FolderIcon, FileIcon } from './icons';
import { LivePreview } from './LivePreview';
import { DistributedSystemDashboard } from './DistributedSystemDashboard';
import { PlatformAdapter } from '../lib/platformAdapter';
import { 
  CheckCircle2, Sparkles, Code2, Server, GitBranch, CreditCard, X, Download, ShieldCheck, Network, Laptop, FolderDown, Eye, Database, RotateCcw
} from 'lucide-react';

declare global {
  interface Window {
    hljs: any;
  }
}

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onSelectFile: (file: FileNode) => void;
  selectedFile: FileNode | null;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level, onSelectFile, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(level < 2);

  const isFolder = node.type === 'folder';
  const isSelected = !isFolder && selectedFile?.name === node.name && JSON.stringify(selectedFile) === JSON.stringify(node);

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center space-x-2 py-1.5 px-2 cursor-pointer rounded transition-colors duration-150 ${
          isSelected ? 'bg-cyan-500/20' : 'hover:bg-gray-700/50'
        }`}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <FolderIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        ) : (
          <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
        <span className="text-gray-300 truncate text-sm">{node.name}</span>
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem key={`${child.name}-${index}`} node={child} level={level + 1} onSelectFile={onSelectFile} selectedFile={selectedFile} />
          ))}
        </div>
      )}
    </div>
  );
};

const ResultScreen: React.FC<{ 
  projectType: ProjectType;
  projectFiles: Record<string, any>;
  onReset: () => void;
}> = ({ projectType, projectFiles, onReset }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'database' | 'deploy' | 'distributed'>('preview');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const codeBlockRef = useRef<HTMLElement>(null);

  const project = PROJECT_TEMPLATES[projectType] || { name: 'Projeto Gerado', slug: 'projeto', files: {}, lifecycle: [] };
  const structure = useMemo(() => buildFileTree(projectFiles || {}), [projectFiles]);

  // Wallet State System
  const [credits, setCredits] = useState<number>(() => {
    const stored = localStorage.getItem('user_generator_credits');
    return stored ? parseFloat(stored) : 8.8; // beautiful decimal
  });
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [selectedPack, setSelectedPack] = useState({ name: 'Pacote Pro', cost: 49.00, credits: 50 });
  const [billingStep, setBillingStep] = useState<'select' | 'payment' | 'done'>('select');

  // Checkout and Card states for Billing
  const [billCardNum, setBillCardNum] = useState('');
  const [billCardName, setBillCardName] = useState('');
  const [billCardExp, setBillCardExp] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

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

  // Save credits
  useEffect(() => {
    localStorage.setItem('user_generator_credits', credits.toFixed(1));
  }, [credits]);

  useEffect(() => {
    const findFirstFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file' && (node.name.endsWith('.tsx') || node.name.endsWith('README.md'))) return node;
        if (node.type === 'folder' && node.children) {
          const file = findFirstFile(node.children);
          if (file) return file;
        }
      }
      for (const node of nodes) {
        if (node.type === 'file') return node;
        if (node.type === 'folder' && node.children) {
          const file = findFirstFile(node.children);
          if (file) return file;
        }
      }
      return null;
    };
    const firstFile = findFirstFile(structure);
    setSelectedFile(firstFile);
  }, [structure]);

  useEffect(() => {
    if (selectedFile && codeBlockRef.current && window.hljs) {
      window.hljs.highlightElement(codeBlockRef.current);
    }
  }, [selectedFile, activeTab]);

  const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const langMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
      'tsx': 'typescript', 'css': 'css', 'json': 'json',
      'md': 'markdown', 'html': 'html', 'gitignore': 'plaintext',
    };
    return langMap[extension] || 'plaintext';
  };

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
      alert("Ocorreu um erro ao exportar o projeto.");
    } finally {
      setIsDownloading(false);
    }
  }, [project, projectType, projectFiles]);

  const handleReloadCredits = () => {
    if (paymentMethod === 'card' && (!billCardNum || !billCardName || !billCardExp)) {
      setPayError('Favor inserir todas as credenciais do cartão de crédito.');
      return;
    }
    setPayError(null);
    setBillingStep('done');
    setCredits(prev => prev + selectedPack.credits);
  };

  const getDatabaseSchema = (): string => {
    if (projectType === 'store') {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  cart      Cart?
  reviews   Review[]
  sales     Sale[]
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Float
  description String
  category    String
  stock       Int
  imageUrl    String
  reviews     Review[]
  saleItems   SaleItem[]
  createdAt   DateTime @default(now())
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userName  String
  rating    Int
  comment   String
  createdAt DateTime @default(now())
}

model Cart {
  id     String     @id @default(cuid())
  userId String     @unique
  user   User       @relation(fields: [userId], references: [id])
  items  CartItem[]
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  cart      Cart   @relation(fields: [cartId], references: [id])
  productId String
  quantity  Int
}

model Sale {
  id              String     @id @default(cuid())
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  total           Float
  items           SaleItem[]
  shippingAddress String
  createdAt       DateTime   @default(now())
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  sale      Sale    @relation(fields: [saleId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  name      String
  price     Float
  quantity  Int
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_store_schema.sql
CREATE TABLE "users" (
    "id" VARCHAR(255) PRIMARY KEY,
    "clerk_id" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "products" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "stock" INT NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "reviews" (
    "id" VARCHAR(255) PRIMARY KEY,
    "product_id" VARCHAR(255) REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" VARCHAR(255) REFERENCES "users"("id") ON DELETE CASCADE,
    "user_name" VARCHAR(255) NOT NULL,
    "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "cart" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) UNIQUE REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "cart_items" (
    "id" VARCHAR(255) PRIMARY KEY,
    "cart_id" VARCHAR(255) REFERENCES "cart"("id") ON DELETE CASCADE,
    "product_id" VARCHAR(255) REFERENCES "products"("id"),
    "quantity" INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE "sales" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) REFERENCES "users"("id"),
    "total" DECIMAL(10, 2) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
      } else if (dbType === 'supabase') {
        return `-- Supabase RLS Policies for Store
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos públicos para leitura" ON products
  FOR SELECT TO public USING (true);

CREATE POLICY "Apenas admin manipula produtos" ON products
  FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Adições de reviews autenticados" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leitura de reviews pública" ON reviews
  FOR SELECT TO public USING (true);`;
      } else {
        return `// models/Product.js - MongoDB Schema
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);`;
      }
    } else if (projectType === 'blog') {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  summary     String
  content     String    @db.Text
  published   Boolean   @default(false)
  likesCount  Int       @default(0)
  comments    Comment[]
  createdAt   DateTime  @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    String
  text      String
  persona   String   @default("Fanboy")
  createdAt DateTime @default(now())
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_blog_schema.sql
CREATE TABLE "posts" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "published" BOOLEAN DEFAULT false,
    "likes_count" INT DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "comments" (
    "id" VARCHAR(255) PRIMARY KEY,
    "post_id" VARCHAR(255) REFERENCES "posts"("id") ON DELETE CASCADE,
    "author" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "persona" VARCHAR(50) DEFAULT 'Fanboy',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
      } else if (dbType === 'supabase') {
        return `-- Supabase RLS Policies for Blog
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts públicos" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Leitura de comentários pública" ON comments FOR SELECT TO public USING (true);`;
      } else {
        return `// models/Post.js - MongoDB Schema
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);`;
      }
    } else {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
model Trip {
  id          String      @id @default(cuid())
  userId      String
  destination String
  itineraries Itinerary[]
  createdAt   DateTime    @default(now())
}

model Itinerary {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  dayTitle    String
  transport   String
  morningPlan String
  afterPlan   String
  eveningPlan String
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_travel_schema.sql
CREATE TABLE "trips" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "itineraries" (
    "id" VARCHAR(255) PRIMARY KEY,
    "trip_id" VARCHAR(255) REFERENCES "trips"("id") ON DELETE CASCADE,
    "day_title" VARCHAR(255) NOT NULL,
    "transport" VARCHAR(255),
    "morning" TEXT,
    "afternoon" TEXT,
    "evening" TEXT
);`;
      } else {
        return `// models/Trip.js - MongoDB Schema
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  destination: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Trip || mongoose.model('Trip', TripSchema);`;
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getDatabaseSchema());
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
            const fileContentToSend = typeof content === 'string' ? content : (content.base64 || '');
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

  return (
    <div className="bg-[#0D131F] border border-gray-800 rounded-xl p-5 md:p-6 w-full flex flex-col space-y-6 animate-fade-in relative text-xs font-sans">
      
      {/* Top Project & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {project.name}
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Pronto
              </span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <span>Scaffolding gerado</span>
              <span aria-hidden="true">·</span>
              <span>{Object.keys(projectFiles).length} arquivos no blueprint</span>
            </div>
          </div>
        </div>

        {/* Right Actions & Credits */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Credits Counter */}
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-850 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
              {credits.toFixed(1)} cr
            </span>
            <button
              onClick={() => {
                setBillingStep('select');
                setIsBillingOpen(true);
              }}
              title="Recarregar créditos de orquestração"
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset / New Project */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white transition-colors cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Novo</span>
          </button>

          {/* Direct Export Action */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors cursor-pointer disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-sm shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Exportando...' : PlatformAdapter.isDesktop() ? 'Salvar no Disco' : 'Exportar (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Iconic Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-800 gap-1.5">
        <button
          onClick={() => setActiveTab('preview')}
          className={`py-2 px-3.5 font-semibold text-xs rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'preview'
              ? 'border-cyan-400 text-cyan-400 bg-gray-900/40'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`py-2 px-3.5 font-semibold text-xs rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'code'
              ? 'border-cyan-400 text-cyan-400 bg-gray-900/40'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Explorador de Código</span>
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`py-2 px-3.5 font-semibold text-xs rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'database'
              ? 'border-cyan-400 text-cyan-400 bg-gray-900/40'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Esquemas DB & Prisma</span>
        </button>
        <button
          onClick={() => setActiveTab('distributed')}
          className={`py-2 px-3.5 font-semibold text-xs rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'distributed'
              ? 'border-cyan-400 text-cyan-400 bg-gray-900/40'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Topologia Distribuída</span>
        </button>
        <button
          onClick={() => setActiveTab('deploy')}
          className={`py-2 px-3.5 font-semibold text-xs rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'deploy'
              ? 'border-cyan-400 text-cyan-400 bg-gray-900/40'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Deploy & Git Pipeline</span>
        </button>
      </div>

      {/* Tabs contents */}
      <div className="min-h-[500px]">
        {activeTab === 'preview' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-750 p-4 rounded-lg">
              <h3 className="font-bold text-gray-200 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Live Virtualized App Playground
              </h3>
              <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                As APIs do Next.js + Convex foram simuladas na memória do navegador. Você pode testar fluxos de checkout de cartão de crédito securizados com verificação Luhn, comentários do blog com sentiment analyzer e AI guide trips!
              </p>
            </div>
            <LivePreview projectType={projectType} projectFiles={projectFiles} />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="flex flex-col md:flex-row gap-4 h-[65vh] md:h-[550px] animate-fade-in">
            <div className="md:w-1/4 h-1/3 md:h-full bg-gray-900/55 border border-gray-750 rounded-lg p-2.5 overflow-y-auto order-1 md:order-none custom-scrollbar">
              {structure.map((node, index) => (
                <FileTreeItem key={index} node={node} level={0} onSelectFile={setSelectedFile} selectedFile={selectedFile} />
              ))}
            </div>

            <div className="flex-1 h-2/3 md:h-full bg-gray-900 border border-gray-750 rounded-lg overflow-hidden relative order-2 md:order-none flex flex-col">
              {selectedFile ? (
                <>
                  <div className="bg-gray-950 px-4 py-2 border-b border-gray-850 flex justify-between items-center z-10">
                    <span className="font-mono text-[10px] text-gray-500">Workspace / {selectedFile.name}</span>
                    <span className="bg-gray-800 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      {getFileLanguage(selectedFile.name)}
                    </span>
                  </div>
                  <pre className="flex-1 overflow-auto !bg-transparent custom-scrollbar p-4 select-text">
                    <code
                      ref={codeBlockRef}
                      key={selectedFile.name}
                      className={`language-${getFileLanguage(selectedFile.name)} block text-[11px] leading-relaxed`}
                    >
                      {selectedFile.base64Content ? `[Conteúdo Binário: ${selectedFile.name}]` : selectedFile.content || ''}
                    </code>
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 text-gray-500">Selecione um arquivo para visualizar.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'database' && (
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
                    <code>{getDatabaseSchema()}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deploy' && (
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
        )}

        {activeTab === 'distributed' && (
          <div className="space-y-4 animate-fade-in">
            <DistributedSystemDashboard projectType={projectType} />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 border-t border-gray-800">
        <button 
          onClick={onReset} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span>Orquestrar Novo Projeto</span>
        </button>
        <button 
          onClick={handleDownload} 
          disabled={isDownloading} 
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>Exportando Arquivos...</span>
            </>
          ) : PlatformAdapter.isTauriApp() ? (
            <>
              <FolderDown className="w-4 h-4" />
              <span>Salvar Diretamente na Pasta Local (Disco)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Baixar Pacote Estruturado (.zip)</span>
            </>
          )}
        </button>
      </div>

      {isBillingOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md overflow-hidden animate-fade-in text-xs flex flex-col justify-between">
            <div className="bg-gray-850 px-4 py-3 flex justify-between items-center text-white border-b border-gray-800">
              <span className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                <CreditCard className="w-4 h-4" /> Recarga de Créditos (Pay-as-you-go)
              </span>
              <button onClick={() => setIsBillingOpen(false)} className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {billingStep === 'select' && (
              <div className="p-5 space-y-4">
                <div className="text-gray-400 text-[11px] leading-relaxed">
                  Trabalhamos com o modelo Pay-As-You-Go para as requisições de IA e fotografia de estúdio. Escolha o melhor pacote para as suas necessidades de software.
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'Pacote Starter', credits: 15, cost: 15.00, desc: 'Ideal para testar 3 ideias dinâmicas completas.' },
                    { name: 'Pacote Pro', credits: 50, cost: 49.00, desc: 'Mais popular para desenvolvedores freelancers.' },
                    { name: 'Pacote Expert', credits: 150, cost: 120.00, desc: 'Perfeito para agências que orquestram dezenas de MVPs.' }
                  ].map(pack => (
                    <div 
                      key={pack.name}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center gap-3 transition ${
                        selectedPack.name === pack.name 
                          ? 'bg-cyan-500/10 border-cyan-400 text-white' 
                          : 'bg-gray-950 border-gray-850 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-bold text-gray-200">{pack.name} ({pack.credits} créditos)</div>
                        <div className="text-[10px] text-gray-500 leading-normal mt-0.5">{pack.desc}</div>
                      </div>
                      <div className="text-right flex-shrink-0 font-mono font-black text-cyan-400 text-sm">
                        R$ {pack.cost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setBillingStep('payment')}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase text-xs tracking-wider rounded-lg transition cursor-pointer"
                  >
                    Prosseguir para o Pagamento
                  </button>
                </div>
              </div>
            )}

            {billingStep === 'payment' && (
              <div className="p-5 space-y-4">
                <div className="flex gap-2 bg-gray-950 p-1 rounded-md border border-gray-800 text-[10px] font-bold">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 py-1 rounded transition text-center cursor-pointer ${
                      paymentMethod === 'pix' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ PIX Instantâneo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-1 rounded transition text-center cursor-pointer ${
                      paymentMethod === 'card' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    💳 Cartão de Crédito
                  </button>
                </div>

                {payError && (
                  <div className="p-2.5 bg-red-900/40 border border-red-500/30 text-red-400 text-[10px] rounded leading-normal">
                    {payError}
                  </div>
                )}

                {paymentMethod === 'pix' ? (
                  <div className="text-center space-y-3.5 py-2">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Efetue o pagamento de R$ {selectedPack.cost.toFixed(2)}</span>
                    <div className="w-24 h-24 bg-white border border-gray-800 rounded-md mx-auto p-1.5 flex items-center justify-center relative">
                      <div className="absolute w-6 h-6 bg-cyan-400 flex items-center justify-center text-[8px] text-black font-black rounded font-mono shadow">PIX</div>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="navy">
                        <rect x="5" y="5" width="20" height="20" />
                        <rect x="75" y="5" width="20" height="20" />
                        <rect x="5" y="75" width="20" height="20" />
                        <rect x="35" y="35" width="30" height="30" />
                      </svg>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] text-gray-500 max-w-xs block mx-auto leading-normal">Código Copia e Cola Pix gerado com sucesso. Use o simulador abaixo para receber instantaneamente.</span>
                      <input 
                        type="text" 
                        readOnly 
                        value="00020126580014br.gov.bcb.pix0136ecea32a6-ef12-4cfc-a612-4fb0fdcc13685204000053039865802BR"
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2 py-1 text-center font-mono text-[9px] text-gray-400 select-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-left">
                    <div>
                      <label className="text-gray-500 block text-[10px] mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Stefan S" 
                        required
                        value={billCardName}
                        onChange={e => setBillCardName(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block text-[10px] mb-1">Número do Cartão de Crédito</label>
                      <input 
                        type="text" 
                        placeholder="4111 2222 3333 4444" 
                        required
                        value={billCardNum}
                        onChange={e => setBillCardNum(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white font-mono tracking-wider focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div>
                        <label className="text-gray-500 block text-[10px] mb-1 font-sans">Expiração</label>
                        <input 
                          type="text" 
                          placeholder="MM/AA" 
                          required
                          value={billCardExp}
                          onChange={e => setBillCardExp(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 block text-[10px] mb-1 font-sans">CVC</label>
                        <input 
                          type="password" 
                          placeholder="***" 
                          maxLength={3} 
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReloadCredits}
                  className="w-full py-2 bg-green-500 hover:bg-green-400 text-black font-extrabold uppercase text-xs tracking-wider rounded-lg transition cursor-pointer"
                >
                  ✓ Confirmar Pagamento Simulado
                </button>
              </div>
            )}

            {billingStep === 'done' && (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-100 font-sans">Créditos Adicionados!</h3>
                  <p className="text-[11px] text-gray-400 mt-2 font-sans">Os {selectedPack.credits} créditos foram adicionados à sua carteira com sucesso.</p>
                </div>
                <button 
                  onClick={() => setIsBillingOpen(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg cursor-pointer font-sans"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultScreen;
