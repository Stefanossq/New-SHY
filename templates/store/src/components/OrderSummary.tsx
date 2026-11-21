import styles from '@/app/checkout/page.module.css';
import { CartItem, formatBRL } from '@/types';

export default function OrderSummary({ cart }: { cart: CartItem[] }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className={styles.summary}>
      <h3>Resumo</h3>
      {cart.map((item) => (
        <div key={item._id} className={styles.item}>
          <span>{item.name} <small>x{item.quantity}</small></span>
          <span>{formatBRL(item.price * item.quantity)}</span>
        </div>
      ))}
      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{formatBRL(total)}</span>
      </div>
      <p className={styles.note}>O valor final é calculado no servidor com os preços atuais.</p>
    </div>
  );
}
