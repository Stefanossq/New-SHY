'use client';
import React, { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Product } from '@/types';
import ProductList from '@/components/ProductList';
import styles from './page.module.css';

export default function HomePage() {
  const products = useQuery(api.products.get);
  const seedDatabase = useMutation(api.products.seed);

  useEffect(() => {
    if (products && products.length === 0) seedDatabase();
  }, [products, seedDatabase]);

  if (products === undefined) {
      return <div className={styles.loading}>Carregando coleção...</div>
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
          <h1 className={styles.heroTitle}>MONOCHROME.</h1>
          <p className={styles.heroSubtitle}>Simplicidade é a sofisticação suprema.</p>
          <a href="#collection" className="btn">Ver Coleção</a>
      </section>

      <section id="collection" className={styles.section}>
        <h2 className={styles.sectionTitle}>Coleção Atual</h2>
        <ProductList products={products as Product[]} showSearch={true} />
      </section>
    </div>
  );
};
