'use client';
import { useState, FormEvent } from 'react';
import { useAction, useMutation } from 'convex/react';
import { RedirectToSignIn, useUser } from '@clerk/nextjs';
import { Lock } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import ShippingForm, { emptyAddress } from '@/components/ShippingForm';
import OrderSummary from '@/components/OrderSummary';
import styles from './page.module.css';

/**
 * Checkout com Stripe: o pedido é criado no servidor (preços do banco),
 * e o cliente é levado à página de pagamento do Stripe. Dados de cartão
 * nunca passam por este site.
 */
export default function CheckoutPage() {
  const { cart } = useCart();
  const { isSignedIn, isLoaded, user } = useUser();
  const createOrder = useMutation(api.orders.createFromCart);
  const createCheckout = useAction(api.stripe.createCheckout);
  const [shipping, setShipping] = useState(emptyAddress(user?.fullName ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (cart.length === 0) return <div className={styles.empty}>Carrinho vazio.</div>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const orderId = await createOrder({ shippingAddress: shipping });
      const url = await createCheckout({ orderId });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <form onSubmit={submit} className={styles.form}>
          <ShippingForm value={shipping} onChange={setShipping} />
          <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Pagamento</h2>
          <p className={styles.note}>Você será levado ao ambiente seguro do Stripe para pagar.</p>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 20, padding: 15 }} disabled={loading}>
            {loading ? 'Redirecionando...' : 'Ir para o pagamento'}
          </button>
          <div className={styles.secureBadge}>
            <Lock size={12} /> Pagamento processado pelo Stripe
          </div>
        </form>
        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}
