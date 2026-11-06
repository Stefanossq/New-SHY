'use client';
import React from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import styles from './ProductCard.module.css';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className={styles.card}>
      <Link href={`/product/${product._id}`} className={styles.imageLink}>
        <div className={styles.imageContainer}>
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
          <div className={styles.overlay}>
            <span className={styles.viewText}><Eye size={16} /> Ver Detalhes</span>
          </div>
        </div>
      </Link>
      
      <div className={styles.info}>
        <Link href={`/product/${product._id}`}>
            <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <p className={styles.price}>R$ {product.price.toFixed(2).replace('.', ',')}</p>
        <button 
          className={styles.button}
          onClick={() => addToCart(product._id)}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}