import Link from 'next/link';
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
