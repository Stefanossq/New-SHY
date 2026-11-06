'use client';
import React from 'react';

interface Character {
    jikanId: number;
    name: string;
    imageUrl: string;
}

interface TeamCardsProps {
    characters: Character[];
}

export default function TeamCards({ characters }: TeamCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '15px' }}>
        {characters.map((char) => (
            <a 
                key={char.jikanId} 
                href={`https://myanimelist.net/character/${char.jikanId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                    display: 'block', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    textAlign: 'center',
                    textDecoration: 'none',
                    background: 'var(--card-bg)',
                    transition: 'transform 0.2s, border-color 0.2s'
                }}
                className="team-card"
            >
                <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                    <img 
                        src={char.imageUrl} 
                        alt={char.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                </div>
                <div style={{ padding: '10px' }}>
                    <p style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold', 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {char.name}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)' }}>ver perfil &rarr;</span>
                </div>
            </a>
        ))}
        <style jsx>{`
            .team-card:hover {
                transform: translateY(-3px);
                border-color: var(--color-accent) !important;
            }
        `}</style>
    </div>
  );
}
