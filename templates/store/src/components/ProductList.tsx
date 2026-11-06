'use client';
import React, { useState } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import styles from './ProductList.module.css';

interface ProductListProps {
  products: Product[];
  showSearch?: boolean;
}

export default function ProductList({ products, showSearch = false }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {showSearch && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}
      <div className={styles.productListGrid}>
        {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
        ))}
        {filteredProducts.length === 0 && <p className={styles.noProducts}>Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}