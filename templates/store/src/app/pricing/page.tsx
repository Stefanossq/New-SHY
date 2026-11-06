import { PricingTable } from '@clerk/nextjs';

export default function PricingPage() {
  return (
    <div style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center', background: 'var(--bg-main)', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-main)' }}>Nossos Planos</h1>
        <PricingTable />
      </div>
    </div>
  );
}