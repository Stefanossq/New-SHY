'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CartItem } from '@/types';
import { useToaster } from './ToasterContext';

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (productId: Id<"products">) => Promise<void>;
  removeFromCart: (productId: Id<"products">) => Promise<void>;
  updateCartQuantity: (productId: Id<"products">, newQuantity: number) => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useUser();
  const { showToast } = useToaster();
  
  const cartData = useQuery(api.cart.get, !isSignedIn ? 'skip' : undefined);
  const addItem = useMutation(api.cart.addItem);
  const removeItem = useMutation(api.cart.removeItem);
  const updateQuantity = useMutation(api.cart.updateItemQuantity);

  const cart = (cartData as CartItem[] | undefined) || [];

  const addToCart = async (productId: Id<"products">) => {
    if (!isSignedIn) {
        showToast('Login necessário para adicionar ao carrinho.', 'info');
        return;
    }
    try {
        await addItem({ productId, quantity: 1 });
        showToast('Produto adicionado.', 'success');
    } catch (error) {
        showToast('Erro ao adicionar.', 'error');
    }
  };

  const removeFromCart = async (productId: Id<"products">) => {
    try { await removeItem({ productId }); showToast('Item removido.', 'success'); } 
    catch (error) { showToast('Erro ao remover.', 'error'); }
  };

  const updateCartQuantity = async (productId: Id<"products">, quantity: number) => {
    try { await updateQuantity({ productId, quantity }); } 
    catch (error) { showToast('Erro ao atualizar.', 'error'); }
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return <CartContext.Provider value={{ cart, isLoading: cartData === undefined, addToCart, removeFromCart, updateCartQuantity, cartCount }}>{children}</CartContext.Provider>;
};
