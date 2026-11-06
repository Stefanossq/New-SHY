'use client';
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
                    <div key={i} className={`message ${m.role === 'user' ? 'msg-user' : 'msg-bot'}`}>{m.text}</div>
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
