'use client';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export default function AiringWidget() {
    const getSchedule = useAction(api.jikan.getAiringSchedule);
    const [animes, setAnimes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSchedule().then(data => {
            setAnimes(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <span>NO AR AGORA</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>AO VIVO</span>
            </h3>
            
            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Buscando dados do satélite...</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                    {animes.slice(0, 5).map(anime => (
                        <li key={anime.mal_id} style={{ marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                            <a href={anime.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', maxWidth: '70%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        {anime.title}
                                    </span>
                                    <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', border: '1px solid var(--color-accent)', padding: '0 4px', borderRadius: '4px' }}>
                                        {anime.score || 'N/A'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Assistir Agora &rarr;
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
