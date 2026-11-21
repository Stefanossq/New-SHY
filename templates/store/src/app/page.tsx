'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ProductList from '@/components/ProductList';
import styles from './page.module.css';
import { SITE } from '@/lib/site';

export default function HomePage() {
  const products = useQuery(api.products.get);

  if (products === undefined) {
    return <div className={styles.loading}>Carregando produtos...</div>;
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{SITE.copy.heroTitle}</h1>
        <p className={styles.heroSubtitle}>{SITE.copy.heroSubtitle}</p>
        <a href="#collection" className="btn">{SITE.copy.ctaLabel}</a>
      </section>

      {SITE.copy.aboutText && (
        <section className={styles.section} style={{ maxWidth: 720 }}>
          <h2 className={styles.sectionTitle}>{SITE.copy.aboutTitle}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>{SITE.copy.aboutText}</p>
        </section>
      )}

      <section id="collection" className={styles.section}>
        <h2 className={styles.sectionTitle}>Produtos</h2>
        {products.length === 0 ? (
          <p className={styles.loading}>Nenhum produto cadastrado ainda. Rode <code>npx convex run products:seed</code> ou cadastre pelo painel admin.</p>
        ) : (
          <ProductList products={products} showSearch={true} />
        )}
      </section>
    </div>
  );
}
