import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SITE } from '@/lib/site';

export default function Home() {
  return (
    <div className="hero">
      <h1>{SITE.copy.heroTitle}</h1>
      <p>{SITE.copy.heroSubtitle}</p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
          <Link href="/dashboard" className="btn">
            {SITE.copy.ctaLabel} <ArrowRight size={16} />
          </Link>
          <Link href="/my-trips" className="btn btn-outline">
            Ver Histórico
          </Link>
      </div>
    </div>
  );
}
