'use client';
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
