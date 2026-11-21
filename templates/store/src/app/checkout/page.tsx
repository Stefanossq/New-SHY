'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { RedirectToSignIn, useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import ShippingForm, { emptyAddress } from '@/components/ShippingForm';
import OrderSummary from '@/components/OrderSummary';
import styles from './page.module.css';

/** Checkout sem gateway: o pedido é registrado com pagamento na entrega. */
export default function CheckoutPage() {
  const { cart } = useCart();
  const { isSignedIn, isLoaded, user } = useUser();
  const createOrder = useMutation(api.orders.createFromCart);
  const router = useRouter();
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
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <form onSubmit={submit} className={styles.form}>
          <ShippingForm value={shipping} onChange={setShipping} />
          <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Pagamento</h2>
          <p className={styles.note}>Pagamento na entrega. Combine a forma de pagamento com a loja.</p>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 20, padding: 15 }} disabled={loading}>
            {loading ? 'Enviando...' : 'Confirmar pedido'}
          </button>
        </form>
        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}
