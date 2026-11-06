'use client';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function VibeMatcher() {
    const [vibe, setVibe] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const matchVibe = useAction(api.jikan.matchVibe);

    const handleMatch = async () => {
        if (!vibe) return;
        setLoading(true);
        try {
            const data = await matchVibe({ vibe });
            setResult(data);
        } catch (e) {
            alert('Erro ao processar vibe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ border: '1px dashed var(--color-accent)' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '10px' }}>VIBE_MATCHER_PROTOCOL</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                Como você está se sentindo hoje? A IA encontrará o anime perfeito.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    value={vibe} 
                    onChange={(e) => setVibe(e.target.value)} 
                    placeholder="Ex: Triste mas esperançoso, Quero adrenalina..." 
                />
                <button onClick={handleMatch} disabled={loading} className="btn">
                    {loading ? '...' : 'MATCH'}
                </button>
            </div>

            {result && (
                <div style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        KEYWORD DETECTED: <span style={{ color: 'var(--text-primary)' }}>{result.keyword}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.animes.map((anime: any) => (
                            <a key={anime.mal_id} href={anime.url} target="_blank" style={{ display: 'flex', gap: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', padding: '5px' }}>
                                <img src={anime.images.jpg.image_url} style={{ width: '50px', height: '70px', objectFit: 'cover' }} />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{anime.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score: {anime.score}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
