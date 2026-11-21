'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ORDER_STATUS_LABEL, formatBRL } from '@/types';
import styles from './page.module.css';

function OrderConfirmationContent() {
  const orderId = useSearchParams().get('orderId');
  const order = useQuery(api.orders.getById, orderId ? { id: orderId as Id<'sales'> } : 'skip');

  if (order === undefined) return <div className={styles.loading}>Carregando pedido...</div>;
  if (order === null) return <div className={styles.loading}>Pedido não encontrado.</div>;

  const title =
    order.status === 'paid' || order.status === 'placed'
      ? 'Pedido confirmado!'
      : order.status === 'pending_payment'
        ? 'Estamos confirmando seu pagamento...'
        : 'Pedido cancelado';

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <p>Status: {ORDER_STATUS_LABEL[order.status]}</p>
      <div className={styles.receipt}>
        <h3>Pedido #{order._id.substring(0, 8)}</h3>
        <div className={styles.items}>
          {order.items.map((item, idx) => (
            <div key={idx} className={styles.item}>
              <span>{item.name} x{item.quantity}</span>
              <span>{formatBRL(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className={styles.total}>
          <span>Total</span>
          <span>{formatBRL(order.total)}</span>
        </div>
      </div>
      <Link href="/orders" className="btn">Ver meus pedidos</Link>
    </div>
  );
}

export default function OrderConfirmation() {
  return (
    <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
