'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAction, useQuery } from 'convex/react';
import { SignInButton, useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { PLAN } from '@/lib/plan';
import { SITE } from '@/lib/site';

const price = (PLAN.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function PremiumContent() {
  const { isSignedIn } = useUser();
  const plan = useQuery(api.subscriptions.mine);
  const checkout = useAction(api.stripe.createSubscriptionCheckout);
  const portal = useAction(api.stripe.createBillingPortal);
  const justPaid = useSearchParams().get('status') === 'sucesso';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (fn: () => Promise<string>) => {
    setLoading(true);
    setError(null);
    try {
      window.location.assign(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir o Stripe.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '4rem auto', padding: '0 20px' }}>
      <h1>{PLAN.name}</h1>
      <p style={{ opacity: 0.8 }}>{SITE.name} · {price}/mês</p>
      <ul style={{ margin: '1.5rem 0', lineHeight: 1.8 }}>
        {PLAN.benefits.map((b) => <li key={b}>{b}</li>)}
      </ul>

      {justPaid && !plan?.premium && <p>Pagamento recebido. Aguardando a confirmação do Stripe...</p>}

      {!isSignedIn ? (
        <SignInButton mode="modal"><button className="btn">Entrar para assinar</button></SignInButton>
      ) : plan === undefined ? (
        <p>Carregando...</p>
      ) : plan?.premium ? (
        <>
          <p><strong>Sua assinatura está ativa.</strong> Obrigado!</p>
          <button className="btn" disabled={loading} onClick={() => go(() => portal())}>Gerenciar assinatura</button>
        </>
      ) : (
        <button className="btn" disabled={loading} onClick={() => go(() => checkout())}>
          {loading ? 'Abrindo o Stripe...' : `Assinar por ${price}/mês`}
        </button>
      )}
      {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={null}>
      <PremiumContent />
    </Suspense>
  );
}
