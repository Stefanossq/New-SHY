'use client';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { Trash, Minus, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    const { cart, removeFromCart, updateCartQuantity } = useCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cart.length === 0) return <div className={styles.empty}>Seu carrinho está vazio.</div>;

    return (
        <div className={styles.container}>
            <h1>Seu Carrinho</h1>
            <div className={styles.list}>
                {cart.map(item => (
                    <div key={item._id} className={styles.item}>
                        <img src={item.imageUrl} alt={item.name} className={styles.img} />
                        <div className={styles.details}>
                            <h3>{item.name}</h3>
                            <p>R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className={styles.quantity}>
                            <button onClick={() => updateCartQuantity(item._id, item.quantity - 1)}><Minus size={16} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item._id, item.quantity + 1)}><Plus size={16} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} className={styles.remove}><Trash size={18} /></button>
                    </div>
                ))}
            </div>
            <div className={styles.summary}>
                <h2>Total: R$ {total.toFixed(2)}</h2>
                <Link href="/checkout" className="btn">Finalizar Compra</Link>
            </div>
        </div>
    );
}