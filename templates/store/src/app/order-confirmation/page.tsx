'use client';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import styles from './page.module.css';
import Link from 'next/link';
import { Suspense } from 'react';

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const order = useQuery(api.orders.getById, orderId ? { id: orderId as Id<"sales"> } : "skip");

    if (!order) return <div className={styles.loading}>Carregando pedido...</div>;

    return (
        <div className={styles.container}>
            <h1>Pedido Confirmado!</h1>
            <p>Obrigado pela sua compra. Enviamos um email com os detalhes.</p>
            
            <div className={styles.receipt}>
                <h3>Pedido #{order._id.substring(0, 8)}</h3>
                <div className={styles.items}>
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className={styles.item}>
                            <span>{item.name} x{item.quantity}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.total}>
                    <span>Total</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <Link href="/" className="btn">Voltar para a Loja</Link>
        </div>
    );
}

export default function OrderConfirmation() {
    return (
        <Suspense fallback={<div className={styles.loading}>Carregando confirmação...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}