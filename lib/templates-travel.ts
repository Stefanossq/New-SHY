

/**
 * @file Contains all file content for the 'Travel Planner' project template.
 * REWRITTEN: PURE CSS VERSION (NO TAILWIND)
 */

const packageJsonContent = `{
  "name": "travel-planner-ai-pure",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@clerk/nextjs": "^5.0.0",
    "@google/genai": "^1.28.0",
    "convex": "^1.12.0",
    "next": "14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.378.0",
    "react-markdown": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}`;

const readmeContent = `# AI Travel Planner 🌍 (Noir Pure CSS)

Um assistente de viagens minimalista focado em simplicidade e elegância.
Construído com CSS Puro (sem frameworks) para máxima estabilidade de layout.

## Funcionalidades

- **Dashboard Unificado:** Chatbot e Planejador na mesma tela.
- **Roteiros IA:** Geração via Google Gemini.
- **Design:** Noir (Preto e Branco) com Glassmorphism.

## Como Executar

1. \`npm install\`
2. Configure \`.env.local\`
3. \`npx convex dev\`
4. \`npm run dev\`
`;

const convexSchemaContent = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trips: defineTable({
    userId: v.string(),
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
    itinerary: v.string(), // JSON stringified
    title: v.string(),
  }).index("by_user", ["userId"]),
});
`;

const convexAiContent = `import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const generateItinerary = action({
  args: {
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = \`
      Crie um roteiro de viagem para \${args.destination} (\${args.days} dias, \${args.budget}, \${args.travelers}).
      Retorne APENAS JSON válido:
      {
        "title": "Título Criativo",
        "summary": "Resumo curto em 1 frase",
        "dailyPlan": [
          { "day": 1, "theme": "Tema do Dia", "activities": ["Atividade A", "Atividade B"] }
        ]
      }
    \`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return result.text;
  },
});

export const chat = action({
  args: { message: v.string(), history: v.array(v.object({ role: v.string(), parts: v.array(v.object({ text: v.string() })) })) },
  handler: async (ctx, { message, history }) => {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = "Você é um expert em viagens. Responda de forma concisa e elegante.";
    
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "OK." }] },
        ...history
      ]
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  }
});
`;

const convexTripsContent = `import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTrip = mutation({
  args: {
    destination: v.string(),
    days: v.number(),
    budget: v.string(),
    travelers: v.string(),
    itinerary: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.insert("trips", { ...args, userId: identity.subject });
  },
});

export const getMyTrips = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("trips").withIndex("by_user", q => q.eq("userId", identity.subject)).order("desc").collect();
  }
});
`;

const globalsCss = `
/* PURE CSS DESIGN SYSTEM - NOIR GLASS */

:root {
  --bg-color: #050505;
  --panel-bg: rgba(20, 20, 20, 0.6);
  --border-color: rgba(255, 255, 255, 0.1);
  --text-main: #ffffff;
  --text-muted: #888888;
  --accent: #ffffff;
  --glass-blur: blur(12px);
  --radius: 12px;
  --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg-color);
  color: var(--text-main);
  font-family: var(--font-main);
  height: 100vh;
  overflow: hidden; /* App-like feel */
  background-image: 
    radial-gradient(circle at 50% 0%, #1a1a1a 0%, transparent 70%);
}

a { color: inherit; text-decoration: none; }

/* UTILITIES */
.flex { display: flex; }
.col { flex-direction: column; }
.center { align-items: center; justify-content: center; }
.gap-1 { gap: 1rem; }
.gap-2 { gap: 2rem; }
.full-h { height: 100%; }
.full-w { width: 100%; }

/* COMPONENTS */
.btn {
  background: var(--text-main);
  color: var(--bg-color);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-outline {
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border-color);
}
.btn-outline:hover {
  border-color: var(--text-main);
}

.input {
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 12px;
  border-radius: 8px;
  width: 100%;
  font-size: 0.95rem;
  outline: none;
}
.input:focus { border-color: var(--text-main); }

.glass-panel {
  background: var(--panel-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
}

/* HEADER */
.header {
  height: 70px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: rgba(5,5,5,0.8);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}
.logo { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.5px; }
.nav-links { display: flex; gap: 20px; }
.nav-link { color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
.nav-link:hover { color: var(--text-main); }

/* MAIN LAYOUT */
.main-wrapper {
  padding-top: 70px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  padding: 20px;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
}

/* CHAT STYLES */
.chat-container { display: flex; flex-direction: column; height: 100%; }
.chat-header { padding: 15px; border-bottom: 1px solid var(--border-color); font-weight: 600; }
.chat-messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
.message { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; }
.msg-user { align-self: flex-end; background: var(--text-main); color: var(--bg-color); }
.msg-bot { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); }
.chat-input-area { padding: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px; }

/* PLANNER STYLES */
.planner-container { display: flex; flex-direction: column; height: 100%; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
.label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }

.itinerary-card { margin-top: 20px; animation: fadeIn 0.5s ease; }
.day-card { border-left: 2px solid var(--border-color); padding-left: 20px; margin-bottom: 20px; position: relative; }
.day-card::before { content: ''; position: absolute; left: -5px; top: 0; width: 8px; height: 8px; background: var(--text-main); border-radius: 50%; }
.day-title { font-weight: bold; margin-bottom: 5px; color: var(--text-main); }
.activity { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* LANDING */
.hero { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.hero h1 { font-size: 4rem; letter-spacing: -2px; line-height: 1; margin-bottom: 20px; }
.hero p { color: var(--text-muted); max-width: 500px; margin-bottom: 40px; }

`;

const layoutContent = `import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import ConvexClientProvider from "./ConvexClientProvider";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Travel AI Noir",
  description: "Planejamento de viagens minimalista",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body>
          <ConvexClientProvider>
            <Header />
            <main className="main-wrapper">
                {children}
            </main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
`;

const headerComponent = `'use client';
import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Plane } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plane size={24} />
          <span className="logo">TRAVEL_AI</span>
        </Link>
        
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/my-trips" className="nav-link">Histórico</Link>
        </nav>

        <div>
          <SignedIn><UserButton /></SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
                <button className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>LOGIN</button>
            </SignInButton>
          </SignedOut>
        </div>
    </header>
  );
}
`;

const homePage = `import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="hero">
      <h1>EXPLORE<br/><span style={{ color: '#333' }}>THE WORLD.</span></h1>
      <p>Simplicidade absoluta no planejamento da sua próxima jornada. Inteligência Artificial sem distrações visuais.</p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
          <Link href="/dashboard" className="btn">
            Começar <ArrowRight size={16} />
          </Link>
          <Link href="/my-trips" className="btn btn-outline">
            Ver Histórico
          </Link>
      </div>
    </div>
  );
}
`;

const dashboardPage = `'use client';
import { useState, useRef, useEffect } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Send, Save, Loader, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  // CHAT STATE
  const sendMessage = useAction(api.ai.chat);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([{role: 'model', text: 'Olá. Como posso ajudar na sua viagem?'}]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PLANNER STATE
  const generate = useAction(api.ai.generateItinerary);
  const saveTrip = useMutation(api.trips.createTrip);
  const router = useRouter();
  const [form, setForm] = useState({ destination: '', days: 3, budget: 'Medium', travelers: 'Couple' });
  const [planLoading, setPlanLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // HANDLERS
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    const txt = chatInput; setChatInput('');
    setMessages(p => [...p, {role: 'user', text: txt}]);
    setChatLoading(true);
    try {
        const history = messages.map(m => ({ role: m.role, parts: [{text: m.text}] }));
        const res = await sendMessage({ message: txt, history });
        setMessages(p => [...p, {role: 'model', text: res}]);
    } finally { setChatLoading(false); }
  };

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanLoading(true);
    try {
        const json = await generate(form);
        setResult(JSON.parse(json));
    } finally { setPlanLoading(false); }
  };

  const handleSave = async () => {
    if(!result) return;
    await saveTrip({ ...form, days: Number(form.days), itinerary: JSON.stringify(result), title: result.title });
    router.push('/my-trips');
  };

  return (
    <div className="dashboard-grid">
        {/* LEFT: CHATBOT */}
        <div className="glass-panel chat-container">
            <div className="chat-header">TRAVEL BUDDY_</div>
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={\`message \${m.role === 'user' ? 'msg-user' : 'msg-bot'}\`}>{m.text}</div>
                ))}
                {chatLoading && <div className="message msg-bot">...</div>}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChat} className="chat-input-area">
                <input className="input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Pergunte sobre vistos, clima..." />
                <button type="submit" className="btn" style={{ padding: '0 15px' }} disabled={chatLoading}><Send size={18} /></button>
            </form>
        </div>

        {/* RIGHT: PLANNER */}
        <div className="glass-panel planner-container" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>NOVO ROTEIRO</h2>
            
            <form onSubmit={handlePlan}>
                <div className="form-grid">
                    <div>
                        <span className="label">Destino</span>
                        <input className="input" required value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="Ex: Tokyo" />
                    </div>
                    <div>
                        <span className="label">Dias</span>
                        <input className="input" type="number" min="1" max="15" value={form.days} onChange={e => setForm({...form, days: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="form-grid">
                    <div>
                        <span className="label">Orçamento</span>
                        <select className="input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}>
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                    <div>
                        <span className="label">Viajantes</span>
                        <select className="input" value={form.travelers} onChange={e => setForm({...form, travelers: e.target.value})}>
                            <option>Solo</option><option>Couple</option><option>Family</option><option>Friends</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="btn full-w center" disabled={planLoading}>
                    {planLoading ? <Loader className="animate-spin" size={18} /> : 'GERAR ROTEIRO'}
                </button>
            </form>

            {/* RESULTS */}
            {result && (
                <div className="itinerary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '5px' }}>{result.title}</h1>
                            <p style={{ color: 'var(--text-muted)' }}>{result.summary}</p>
                        </div>
                        <button onClick={handleSave} className="btn btn-outline"><Save size={18} /> Salvar</button>
                    </div>

                    <div className="timeline">
                        {result.dailyPlan?.map((day: any) => (
                            <div key={day.day} className="day-card">
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>DIA {day.day}</div>
                                <div className="day-title">{day.theme}</div>
                                <ul>
                                    {day.activities?.map((act: string, idx: number) => (
                                        <li key={idx} className="activity">• {act}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
`;

const myTripsPage = `'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';

export default function MyTripsPage() {
  const trips = useQuery(api.trips.getMyTrips);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <h1>HISTÓRICO DE VIAGENS</h1>
        <Link href="/dashboard" className="btn">Novo +</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {trips?.map(trip => (
            <div key={trip._id} className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{trip.destination}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>{trip.title}</p>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#fff' }}>
                    <span style={{ background: '#333', padding: '2px 8px', borderRadius: '4px' }}>{trip.days} Dias</span>
                    <span style={{ background: '#333', padding: '2px 8px', borderRadius: '4px' }}>{trip.budget}</span>
                </div>
            </div>
        ))}
        {trips?.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma viagem salva.</p>}
      </div>
    </div>
  );
}
`;

export const travelFiles = {
  'package.json': packageJsonContent,
  'README.md': readmeContent,
  '.env.local.example': 'CONVEX_DEPLOYMENT=\nNEXT_PUBLIC_CONVEX_URL=\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\nCLERK_SECRET_KEY=\nGEMINI_API_KEY=',
  'convex/schema.ts': convexSchemaContent,
  'convex/ai.ts': convexAiContent,
  'convex/trips.ts': convexTripsContent,
  'convex/auth.config.ts': `export default { providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://placeholder.clerk.accounts.dev", applicationID: "convex" }] };`,
  'src/app/layout.tsx': layoutContent,
  'src/app/globals.css': globalsCss,
  'src/app/page.tsx': homePage,
  'src/app/dashboard/page.tsx': dashboardPage,
  'src/app/my-trips/page.tsx': myTripsPage,
  'src/components/Header.tsx': headerComponent,
  'src/app/ConvexClientProvider.tsx': `"use client";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}`,
};
