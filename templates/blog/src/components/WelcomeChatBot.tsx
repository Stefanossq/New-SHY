'use client';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MessageSquare, X, Volume2 } from 'lucide-react';

export default function WelcomeChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{sender: 'user'|'bot', text: string}[]>([{sender: 'bot', text: 'Olá! Sou o assistente virtual do blog. Em que posso ajudar hoje?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    const sendMessage = useAction(api.gemini.chat);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);
        
        try {
            const reply = await sendMessage({ message: userMsg });
            setMessages(prev => [...prev, { sender: 'bot', text: reply ?? '' }]);
        } catch(e) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Desculpe, ocorreu um erro de conexão.' }]);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Seu navegador não suporta Text-to-Speech.");
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="btn" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare />
                </button>
            )}
            
            {isOpen && (
                <div className="card" style={{ width: '300px', height: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: 'var(--color-accent)', color: 'black', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>ASSISTENTE VIRTUAL</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'black' }}><X size={16} /></button>
                    </div>
                    
                    <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: m.sender === 'user' ? '#333' : 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                padding: '8px',
                                borderRadius: '4px',
                                maxWidth: '85%',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>{m.text}</span>
                                {m.sender === 'bot' && (
                                    <button 
                                        onClick={() => speak(m.text)} 
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', padding: 0, minWidth: '16px' }}
                                        title="Ouvir mensagem"
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Digitando...</div>}
                    </div>
                    
                    <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '5px' }}>
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Digite sua mensagem..." 
                            style={{ flex: 1, fontSize: '0.9rem' }}
                        />
                        <button onClick={handleSend} className="btn" style={{ padding: '5px 10px' }}>&gt;</button>
                    </div>
                </div>
            )}
        </div>
    );
}
