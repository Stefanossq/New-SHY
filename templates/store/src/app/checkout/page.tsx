'use client';
import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';
import styles from './page.module.css';
import { Lock, CreditCard } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const { cart } = useCart();
  const createOrder = useMutation(api.orders.create);
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardError, setCardError] = useState(false);
  
  const [shipping, setShipping] = useState({ fullName: user?.fullName || '', address: '', city: '', postalCode: '' });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Luhn Algorithm Implementation for Credit Card Validation
  const luhnCheck = (val: string) => {
    let checksum = 0;
    let j = 1;
    for (let i = val.length - 1; i >= 0; i--) {
      let calc = 0;
      calc = Number(val.charAt(i)) * j;
      if (calc > 9) { checksum = checksum + 1; calc = calc - 10; }
      checksum = checksum + calc;
      j = (j == 1) ? 2 : 1;
    }
    return (checksum % 10) == 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i=0, len=match.length; i<len; i+=4) {
      parts.push(match.substring(i, i+4));
    }
    if (parts.length) return parts.join(" ");
    return v;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardNumber(formatCardNumber(val));
    const raw = val.replace(/\s+/g, "");
    if (raw.length >= 13) {
        setCardError(!luhnCheck(raw));
    } else {
        setCardError(false);
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if(cardError || cardNumber.length < 15) {
        alert("Cartão inválido. Por favor verifique o número.");
        return;
    }
    setLoading(true);
    try {
      const orderId = await createOrder({
        items: cart.map(i => ({ productId: i._id, name: i.name, price: i.price, quantity: i.quantity })),
        total,
        shippingAddress: shipping
      });
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (err) {
      alert("Erro ao processar pedido. Tente novamente.");
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) return <RedirectToSignIn />;
  if (cart.length === 0) return <div className={styles.empty}>Carrinho vazio.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        
        {/* LEFT: FORM */}
        <form onSubmit={handlePlaceOrder} className={styles.form}>
            <h2 className={styles.sectionTitle}>Entrega</h2>
            <div className={styles.fieldGroup}>
                <input placeholder="Nome Completo" value={shipping.fullName} onChange={e => setShipping({...shipping, fullName: e.target.value})} required />
            </div>
            <div className={styles.fieldGroup}>
                <input placeholder="Endereço" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} required />
            </div>
            <div className={styles.row}>
                <input placeholder="Cidade" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} required />
                <input placeholder="CEP" value={shipping.postalCode} onChange={e => setShipping({...shipping, postalCode: e.target.value})} required />
            </div>

            <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Pagamento Seguro</h2>
            <div className={styles.cardInputWrapper}>
                <div className={`${styles.stripeElement} ${cardError ? styles.invalid : ''} ${cardNumber.length > 14 && !cardError ? styles.valid : ''}`}>
                    <CreditCard className={styles.cardIcon} size={20} />
                    <input 
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber} 
                        onChange={handleCardChange} 
                        maxLength={19}
                        required
                    />
                    {cardError && <span className={styles.errorIcon}>!</span>}
                </div>
                <div className={styles.row}>
                    <input className={styles.stripeInput} placeholder="MM / AA" value={expiry} onChange={e => setExpiry(e.target.value)} maxLength={5} required />
                    <input className={styles.stripeInput} placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} maxLength={4} required />
                </div>
            </div>
            
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px', padding: '15px' }} disabled={loading || cardError}>
                {loading ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
            </button>
            
            <div className={styles.secureBadge}>
                <Lock size={12} /> Pagamento criptografado de ponta a ponta
            </div>
        </form>

        {/* RIGHT: SUMMARY */}
        <div className={styles.summary}>
            <h3>Resumo</h3>
            {cart.map(item => (
                <div key={item._id} className={styles.item}>
                    <span>{item.name} <small>x{item.quantity}</small></span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            <div className={styles.totalRow}>
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
            </div>
        </div>

      </div>
    </div>
  );
};
export default CheckoutPage;
