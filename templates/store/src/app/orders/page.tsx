'use client';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { RedirectToSignIn, useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { ORDER_STATUS_LABEL, formatBRL } from '@/types';
import styles from '../order-confirmation/page.module.css';

export default function OrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const orders = useQuery(api.orders.mine, isSignedIn ? {} : 'skip');

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (orders === undefined) return <div className={styles.loading}>Carregando pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1>Meus pedidos</h1>
      {orders.length === 0 && <p>Você ainda não fez nenhum pedido.</p>}
      {orders.map((order) => (
        <Link key={order._id} href={`/order-confirmation?orderId=${order._id}`} className={styles.receipt} style={{ display: 'block' }}>
          <h3>Pedido #{order._id.substring(0, 8)}</h3>
          <p>{new Date(order._creationTime).toLocaleString('pt-BR')} · {ORDER_STATUS_LABEL[order.status]}</p>
          <div className={styles.total}>
            <span>Total</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
