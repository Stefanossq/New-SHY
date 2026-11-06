import React, { useState, useMemo, useEffect } from 'react';
import { ProjectType } from '../types';
import { 
  ShoppingCart, Star, Trash, Heart, MessageSquare, Send, Calendar, 
  MapPin, Map, CheckCircle2, User, Search, RefreshCw, Sparkles, CreditCard, X, ShieldCheck
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { getAIConfig } from '../lib/aiService';

interface LivePreviewProps {
  projectType: ProjectType;
  projectFiles: Record<string, any>;
  theme?: string;
}

// -------------------------------------------------------------
// HELPER: PARSE DYNAMIC PRODUCTS GENERATED FOR STORE
// -------------------------------------------------------------
const parseProductsFromCode = (files: Record<string, any>, theme: string = ''): any[] => {
  const fileContent = files['convex/products.ts'];
  if (!fileContent || typeof fileContent !== 'string') {
    return [
      { name: 'Notebook Ultrawide Pro', price: 6499.00, description: 'Alta performance com chip de última geração.', category: 'Tech', stock: 5, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      { name: 'Cadeira Ergonômica Carbon', price: 1899.00, description: 'Conforto absoluto para longas sessões de trabalho.', category: 'Office', stock: 12, imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60' },
      { name: 'Teclado Mecânico Puro', price: 549.00, description: 'Switches táteis silenciosos e retroiluminação suave.', category: 'Acessórios', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' },
      { name: 'Fone de ouvido ANC PureSound', price: 1199.00, description: 'Cancelamento ativo premium e autonomia de 40h.', category: 'Tech', stock: 8, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' }
    ];
  }

  const products: any[] = [];
  try {
    // Exact parsing of standard JS list generated
    const singleMatches = fileContent.match(/\{\s*name:\s*'([^']+)',\s*price:\s*([\d.]+),\s*description:\s*'([^']*)',\s*category:\s*'([^']*)',\s*stock:\s*(\d+),\s*imageUrl:\s*'([^']*)'\s*\}/g);
    if (singleMatches) {
      for (const m of singleMatches) {
        const name = m.match(/name:\s*'([^']+)'/)?.[1] || '';
        const price = parseFloat(m.match(/price:\s*([\d.]+)/)?.[1] || '0');
        const description = m.match(/description:\s*'([^']*)'/)?.[1] || '';
        const category = m.match(/category:\s*'([^']*)'/)?.[1] || '';
        const stock = parseInt(m.match(/stock:\s*(\d+)/)?.[1] || '0');
        const imageUrl = m.match(/imageUrl:\s*'([^']*)'/)?.[1] || '';
        if (name) {
          products.push({ name, price, description, category, stock, imageUrl });
        }
      }
    }
  } catch (error) {
    console.error("Failed parsing live preview products:", error);
  }

  if (products.length === 0) {
    // Dynamic placeholder list based on theme
    const themeLabel = theme || 'Coleção Premium';
    return [
      { name: `Item ${themeLabel} Prime`, price: 299.90, description: `Produto exclusivo de altíssima qualidade customizado para o tema ${themeLabel}.`, category: 'Premium', stock: 5, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' },
      { name: `Acessório ${themeLabel} Black`, price: 149.00, description: `Design minimalista noir e excelente performance diária.`, category: 'Acessórios', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60' },
      { name: `Kit Completo ${themeLabel}`, price: 799.00, description: `O combo ideal contendo os produtos de destaque do setor.`, category: 'Kits', stock: 3, imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60' },
      { name: `Edição de Colecionador`, price: 1250.00, description: `Unidades extremamente limitadas em embalagem especial numerada.`, category: 'Premium', stock: 1, imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60' }
    ];
  }

  return products;
};

// -------------------------------------------------------------
// LIVE PREVIEW COMPONENT
// -------------------------------------------------------------
export const LivePreview: React.FC<LivePreviewProps> = ({ projectType, projectFiles }) => {
  if (projectType === 'store') {
    return <StorePreview files={projectFiles} />;
  } else if (projectType === 'blog') {
    return <BlogPreview files={projectFiles} />;
  } else {
    return <TravelPreview files={projectFiles} />;
  }
};

// ============================================================================
// 1. STORE PREVIEW SIMULATOR
// ============================================================================
const StorePreview: React.FC<{ files: Record<string, any> }> = ({ files }) => {
  const products = useMemo(() => parseProductsFromCode(files), [files]);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<Record<string, { userName: string; rating: number; comment: string; date: string }[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success'>('form');
  
  // Checkout Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  // Auto-format card expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiryInput(val);
  };

  const [expiryInput, setExpiryInput] = useState('');

  // Auto-format credit card spacing
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    const formatted: string[] = [];
    for (let i = 0; i < val.length; i += 4) {
      formatted.push(val.substring(i, i + 4));
    }
    setCardNumber(formatted.slice(0, 4).join(' '));
  };

  // Luhn Algorithm Card validation
  const validateLuhn = (num: string): boolean => {
    let clean = num.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.name === product.name);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productName: string) => {
    setCart(prev => prev.filter(item => item.product.name !== productName));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  // Handle Review Insertion
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');

  const submitReview = (productName: string) => {
    if (!newReviewComment || !newReviewName) return;
    const itemReview = {
      userName: newReviewName,
      rating: newReviewRating,
      comment: newReviewComment,
      date: 'Agora mesmo'
    };
    setReviews(prev => ({
      ...prev,
      [productName]: [itemReview, ...(prev[productName] || [])]
    }));
    setNewReviewComment('');
    setNewReviewName('');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !expiryInput || !cardCvv) {
      setCardError('Preencha todos os campos do cartão de crédito.');
      return;
    }
    // Verify Luhn format
    if (!validateLuhn(cardNumber)) {
      setCardError('Cartão inválido! Falha na validação do Algoritmo de Luhn (use números válidos de teste como 4111 1111 ... ou 4539 ...)');
      return;
    }
    setCardError(null);
    setCheckoutStep('success');
    setCart([]);
  };

  return (
    <div className="bg-gray-950 text-white border border-gray-800 rounded-lg overflow-hidden h-[620px] flex flex-col font-sans">
      {/* Simulation Alert Banner */}
      <div className="bg-cyan-500/10 text-cyan-400 py-1 px-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 border-b border-cyan-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        Interactive Live Simulation: Experimente a Loja Premium Gerada
      </div>

      {/* Header */}
      <header className="bg-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black uppercase tracking-widest text-cyan-400">NOIR.STORE</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md font-mono">NEXT.JS/CONVEX</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 border border-gray-800 rounded-md px-2 py-0.5 bg-gray-950 flex items-center gap-1">
            <User className="w-3 h-3 text-cyan-400" /> Clerk Auth
          </span>
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="relative p-2 bg-gray-800 hover:bg-gray-700 rounded-lg Transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((ac, item) => ac + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Categories Bar */}
      <div className="bg-gray-900/60 px-4 py-2 border-b border-gray-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-gray-500 font-semibold mr-1">Filtrar:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full capitalize transition font-medium cursor-pointer ${
              activeCategory === cat ? 'bg-cyan-500 text-black font-semibold' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Store Container Splitted into Feed and Cart Bar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p, idx) => {
              const itemReviews = reviews[p.name] || [];
              const productReviews = [
                { rating: 4, comment: 'Incrível!' },
                { rating: 5, comment: 'Melhor compra do ano.' },
                ...itemReviews
              ];
              const avgRating = (productReviews.reduce((ac, re) => ac + re.rating, 0) / productReviews.length).toFixed(1);

              return (
                <div key={idx} className="bg-gray-900 border border-gray-800/80 rounded-lg overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition group">
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
                    <img 
                      src={p.imageUrl.startsWith('data:') ? p.imageUrl : p.imageUrl} 
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/80 text-[10px] text-gray-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] text-gray-400 font-bold">{avgRating} ({productReviews.length})</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-100 truncate">{p.name}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between items-center border-t border-gray-800 pt-2.5">
                        <span className="font-black text-sm text-cyan-400 font-mono">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-gray-500">Qtd: {p.stock}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1.5">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="col-span-2 text-[10px] py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded transition cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => addToCart(p)}
                          className="col-span-3 text-[10px] py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          + <ShoppingCart className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Quick Cart Panel (collapsible or always shown lightly inside dashboard simulation) */}
        <div className="w-72 border-l border-gray-800 bg-gray-900/40 p-4 flex flex-col justify-between hidden md:flex">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" /> Sacola do Carrinho
            </h4>
            
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                Sua sacola está vazia. Adicione produtos ao carrinho!
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-gray-900/80 border border-gray-800/80 rounded-md p-2 flex items-center justify-between gap-1">
                    <div className="truncate flex-1">
                      <div className="font-bold text-xs text-gray-200 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {item.quantity}x R$ {item.product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs font-mono text-cyan-400">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item.product.name)}
                        className="text-red-400 hover:text-red-300 p-1 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 font-semibold">Total Geral:</span>
              <span className="text-base font-black font-mono text-green-400">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={() => {
                if (cart.length > 0) {
                  setCheckoutStep('form');
                  setIsCheckoutOpen(true);
                }
              }}
              disabled={cart.length === 0}
              className="w-full py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider rounded-lg transition text-center cursor-pointer"
            >
              Comprar Agora (checkout)
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Overlays */}
      {/* 1. PRODUCT DETAIL MODAL WITH REVIEWS */}
      {selectedProduct && (
        <div className="absolute inset-0 bg-black/90 z-20 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-850 rounded-xl w-full max-w-lg overflow-hidden flex flex-col justify-between max-h-[500px]">
            <div className="bg-gray-800 p-3 flex justify-between items-center">
              <span className="font-bold text-xs text-cyan-400 uppercase tracking-widest">{selectedProduct.category}</span>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="flex gap-4">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-28 h-28 object-cover rounded-md bg-gray-950 flex-shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-base text-gray-100">{selectedProduct.name}</h3>
                  <p className="font-black text-cyan-400 font-mono text-sm mt-1">R$ {selectedProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selectedProduct.description}</p>
                </div>
              </div>

              {/* Live Reviews Section */}
              <div className="border-t border-gray-800 pt-3">
                <h4 className="font-bold text-xs text-gray-300 flex items-center gap-1 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Avaliações do Produto (Simuladas)
                </h4>
                
                <div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto pr-1">
                  {/* Default Reviews */}
                  <div className="bg-gray-950 p-2 rounded border border-gray-850 text-[11px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-cyan-400 font-bold">stefsqs@gmail.com</span>
                      <div className="flex text-yellow-500"><Star className="w-2.5 h-2.5 fill-current" /><Star className="w-2.5 h-2.5 fill-current" /><Star className="w-2.5 h-2.5 fill-current" /><Star className="w-2.5 h-2.5 fill-current" /><Star className="w-2.5 h-2.5 fill-current" /></div>
                    </div>
                    <p className="text-gray-400">Entrega rápida e produto condizente com a IA. Absurdamente foda!</p>
                  </div>
                  {(reviews[selectedProduct.name] || []).map((rev, rIdx) => (
                    <div key={rIdx} className="bg-gray-950 p-2 rounded border border-gray-850 text-[11px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-cyan-400 font-bold">{rev.userName}</span>
                        <div className="flex text-yellow-500">
                          {Array.from({ length: rev.rating }).map((_, st) => <Star key={st} className="w-2.5 h-2.5 fill-current" />)}
                        </div>
                      </div>
                      <p className="text-gray-400">{rev.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Submit New Review Form */}
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Adicionar sua Avaliação</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Seu nome ou email" 
                      value={newReviewName}
                      onChange={e => setNewReviewName(e.target.value)}
                      className="bg-gray-900 border border-gray-850 rounded text-[11px] px-2 py-1 text-white focus:outline-none focus:border-cyan-500"
                    />
                    <select 
                      value={newReviewRating}
                      onChange={e => setNewReviewRating(parseInt(e.target.value))}
                      className="bg-gray-900 border border-gray-850 rounded text-[11px] px-2 py-1 text-white"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value="4">⭐⭐⭐⭐ (4/5)</option>
                      <option value="3">⭐⭐⭐ (3/5)</option>
                      <option value="2">⭐⭐ (2/5)</option>
                      <option value="1">⭐ (1/5)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Sua avaliação sincera aqui..." 
                      value={newReviewComment}
                      onChange={e => setNewReviewComment(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-850 rounded text-[11px] px-2 py-1 text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button 
                      onClick={() => submitReview(selectedProduct.name)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1 text-[11px] font-bold rounded cursor-pointer"
                    >
                      Avaliar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-950 border-t border-gray-800 flex gap-2">
              <button 
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg cursor-pointer"
              >
                Adicionar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STRIPE CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="absolute inset-0 bg-black/95 z-30 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md overflow-hidden">
            {checkoutStep === 'form' ? (
              <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Checkout de Segurança
                  </h3>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-800 rounded text-gray-400 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-gray-950 rounded border border-gray-850">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Cesta total</div>
                  <div className="text-xl font-black text-green-400 font-mono">
                    R$ {(cartTotal || 120.0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {cardError && (
                  <div className="p-2.5 bg-red-900/30 text-red-400 border border-red-500/30 text-[10px] rounded font-medium">
                    {cardError}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Nome no Cartão</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Stefan S" 
                      required
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Número do Cartão de Crédito</label>
                    <input 
                      type="text" 
                      placeholder="4111 1111 1111 1111" 
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-white font-mono tracking-wider focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">Expiração</label>
                      <input 
                        type="text" 
                        placeholder="MM/AA" 
                        required
                        maxLength={5}
                        value={expiryInput}
                        onChange={handleExpiryChange}
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">CVV (Segurança)</label>
                      <input 
                        type="text" 
                        placeholder="123" 
                        required
                        maxLength={3}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2 py-2 bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Confirmar e Pagar R$ {(cartTotal || 120.0).toFixed(2)}
                </button>
              </form>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto text-xl">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-100">Simulação Concluída!</h3>
                  <p className="text-xs text-gray-400 mt-2">O pagamento foi efetuado e o callback do Convex / Clerk foi simulado de forma idêntica à de produção.</p>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Fechar Visualização
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. BLOG PREVIEW SIMULATOR (Terminal/Hacker Theme)
// ============================================================================
const BlogPreview: React.FC<{ files: Record<string, any> }> = ({ files }) => {
  const [selectedPostIdx, setSelectedPostIdx] = useState<number>(0);
  const [likes, setLikes] = useState<Record<number, number>>({ 0: 42, 1: 18, 2: 7 });
  const [comments, setComments] = useState<Record<number, { author: string; text: string; role: string }[]>>({
    0: [
      { author: 'OtakuHater99', text: 'Esse anime é pura fan-service, prefiro o manga original.', role: 'Hater' },
      { author: 'KiraFanboy', text: 'Obra de arte impecável! Melhores lutas de todos os tempos.', role: 'Fanboy' }
    ]
  });
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentRole, setCommentRole] = useState('Fanboy');
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'vibe'>('content');
  
  // Vibe Matcher Sentiment AI State
  const [vibeQuery, setVibeQuery] = useState('');
  const [vibeResult, setVibeResult] = useState<string | null>(null);

  const posts = [
    {
      title: 'Death Note: Análise Estrutural e Psicológica do Embate de L e Kira',
      date: '13 Junho, 2026',
      tags: ['Thriller', 'Psicológico', 'Recomendações'],
      readingTime: '5 min de leitura',
      content: `O embate entre Light Yagami (Kira) e L Lawliet em *Death Note* é amplamente considerado um dos duelos intelectuais mais brilhantes da história dos animes. 
Esta obra-prima psicológica transcende o mero entretenimento para deitar luz sobre temas éticos profundos como utilitarismo, megalomania e o limiar da justiça humana.

### A Filosofia de Light vs. A Lógica de L
Light Yagami atua sob uma premissa utilitarista radical: abolir a criminalidade mundial eliminando ativamente os indivíduos nocivos ao bem comum. No entanto, à medida que ganha poder de deus simulado, sua integridade derrete, tornando-se o tirano psicótico que julgara abominável.
Em contrapartida, L representa o método científico e legal em sua essência puramente analítica. L não busca 'vingança', ele quer resolver o enigma.

**Nossa Opinião:** Recomendado com nota máxima de 10/10 para iniciantes e leitores críticos de thrillers!`
    },
    {
      title: 'Neon Genesis Evangelion: Desconstruindo Mechas e Mecanismos de Defesa do Ego',
      date: '10 Junho, 2026',
      tags: ['Sci-Fi', 'Existencial', 'Mente'],
      readingTime: '8 min de leitura',
      content: `Evangelion de Hideaki Anno pegou os preceitos de lutas de robôs gigantes (mechas) dos anos 80 e os demoliu de forma impactante. Shinji Ikari não é o herói corajoso comum; ele representa depressão severa, alienação social, fobia de intimidade (O Dilema do Ouriço de Schopenhauer) e a desolação pós-moderna.

As lutas contra os Anjos tornam-se analogias para as provações mentais dos próprios pilotos. O design de produção e os efeitos acústicos de estúdio elevam Evangelion a patrimônio imaterial da ficção científica mundial.`
    },
    {
      title: 'Fullmetal Alchemist Brotherhood: O Preço da Equivalência de Troca',
      date: '05 Junho, 2026',
      tags: ['Shonen', 'Aventura', 'Fantasia'],
      readingTime: '6 min de leitura',
      content: `FMA Brotherhood equilibra os mundos da alquimia científica e da geopolítica com destreza militar absoluta. Ed e Al são tragados pelas consequências de desrespeitar os limites divinos na tentativa de reviver sua mãe. 

Diferente de Shonens clássicos de batalhas desmedidas, Brotherhood estabelece regras pétreas: para obter qualquer coisa, algo de valor idêntico deve ser ofertado. Uma narrativa brilhante com reviravoltas estonteantes.`
    }
  ];

  const currentPost = posts[selectedPostIdx];

  const handleLike = () => {
    setLikes(prev => ({
      ...prev,
      [selectedPostIdx]: (prev[selectedPostIdx] || 0) + 1
    }));
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;
    const item = { author: commentName, text: commentText, role: commentRole };
    setComments(prev => ({
      ...prev,
      [selectedPostIdx]: [item, ...(prev[selectedPostIdx] || [])]
    }));
    setCommentName('');
    setCommentText('');
  };

  // Simulated AI Vibe sentiment matcher
  const handleVibeMatch = () => {
    if (!vibeQuery) return;
    const textDesc = vibeQuery.toLowerCase();
    let result = '';
    if (textDesc.includes('triste') || textDesc.includes('chora') || textDesc.includes('depre')) {
      result = 'Recomendado para sua Vibe atual: "Neon Genesis Evangelion" - Mergulhe no poço existencial e encontre consolo na psicologia partilhada.';
    } else if (textDesc.includes('inteligente') || textDesc.includes('mente') || textDesc.includes('pensar')) {
      result = 'Recomendado para sua Vibe atual: "Death Note" - Aproveite as manipulações cirúrgicas de mentes astutas.';
    } else if (textDesc.includes('animado') || textDesc.includes('combate') || textDesc.includes('luta')) {
      result = 'Recomendado para sua Vibe atual: "Fullmetal Alchemist" - Batalhas eletrizantes sustentadas por uma filosofia sólida de superação.';
    } else {
      result = 'Procura complexidade? Indicamos "Fullmetal Alchemist Brotherhood" devido ao equilíbrio perfeito de emoção e ação alquímica.';
    }
    setVibeResult(result);
  };

  return (
    <div className="bg-gray-950 border border-emerald-500/20 text-emerald-400 rounded-lg overflow-hidden h-[620px] flex flex-col font-mono text-xs">
      {/* Hacker style header banner */}
      <div className="bg-emerald-500/10 text-emerald-300 py-1 px-3 text-center text-[10px] font-bold border-b border-emerald-500/25 flex items-center justify-between">
        <span>[STATUS: ONLINE] CLI-BLOG_V3</span>
        <span>Módulo Gemini API integrado</span>
      </div>

      {/* Main Core split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side menu posts */}
        <div className="w-64 border-r border-emerald-500/10 bg-gray-900/40 p-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold pb-1 border-b border-emerald-500/10 flex items-center gap-1">
              <Search className="w-3 h-3 text-emerald-500" /> Artigos Disponíveis
            </div>
            <div className="space-y-1">
              {posts.map((post, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedPostIdx(idx); setActiveTab('content'); }}
                  className={`w-full text-left p-2 rounded border transition text-[11px] font-mono cursor-pointer ${
                    selectedPostIdx === idx 
                      ? 'bg-emerald-500/10 border-emerald-450 text-emerald-300' 
                      : 'border-transparent text-gray-500 hover:text-emerald-400 hover:bg-gray-800/40'
                  }`}
                >
                  &gt; {post.title.substring(0, 36)}...
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Matcher Simulator widget */}
          <div className="bg-gray-950 p-2.5 rounded-lg border border-emerald-500/10">
            <span className="text-[9px] text-emerald-300 font-bold block mb-1 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> AI Vibe Matcher
            </span>
            <p className="text-[9px] text-gray-500 leading-normal mb-2">Comente como se sente hoje para a inteligência artificial recomendar o anime ideal.</p>
            <div className="flex gap-1">
              <input 
                type="text" 
                placeholder="Ex: chateado e reflexivo" 
                value={vibeQuery}
                onChange={e => setVibeQuery(e.target.value)}
                className="flex-1 bg-gray-900 border border-emerald-500/20 rounded px-1.5 py-0.5 text-[10px] text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button 
                onClick={handleVibeMatch}
                className="bg-emerald-500 text-black px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer hover:bg-emerald-400"
              >
                Match
              </button>
            </div>
            {vibeResult && (
              <div className="mt-2 p-1.5 bg-emerald-500/10 text-[9px] text-emerald-300 leading-normal border border-emerald-500/20 select-text">
                {vibeResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Side panel detail */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Post Tabs */}
          <div className="bg-gray-900 px-4 py-2 border-b border-emerald-500/15 flex justify-between items-center">
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveTab('content')}
                className={`py-1 px-2.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'content' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                Leitura
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`py-1 px-2.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'comments' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                Comentários IA 
                <span className="bg-emerald-500/20 text-emerald-400 px-1 text-[9px] rounded font-mono">
                  {(comments[selectedPostIdx] || []).length}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 tracking-wider font-mono">{currentPost.readingTime}</span>
              <button 
                onClick={handleLike}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-700/80 rounded cursor-pointer text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[10px]"
              >
                <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> {likes[selectedPostIdx]} Likes
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto text-gray-300 custom-scrollbar select-text selection:bg-emerald-500/30">
            {activeTab === 'content' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 flex gap-2 font-semibold">
                    <span>{currentPost.date}</span> &bull; <span>Autor: Gemini-3.5-Flash</span>
                  </div>
                  <h1 className="text-base font-extrabold text-emerald-300 tracking-tight leading-snug">{currentPost.title}</h1>
                  <div className="flex gap-1.5 pt-1">
                    {currentPost.tags.map(t => (
                      <span key={t} className="bg-gray-800/40 text-emerald-400/80 px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/10">#{t}</span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-emerald-500/10 pt-4 text-[11px] leading-relaxed space-y-3 prose prose-invert font-mono">
                  {currentPost.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('###')) {
                      return <h3 key={pIdx} className="text-emerald-400 font-black text-sm pt-2">{paragraph.replace('###', '').trim()}</h3>;
                    }
                    if (paragraph.startsWith('**')) {
                      return <p key={pIdx} className="bg-emerald-500/5 p-2 rounded.5 border border-emerald-500/10 text-emerald-300">{paragraph}</p>;
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <h3 className="font-bold text-xs text-emerald-300 uppercase">Comentários com Personas da IA</h3>
                  <span className="text-[9px] text-gray-500">Filtrado pelo Clerk + Convex Db</span>
                </div>

                <div className="space-y-3 mb-4">
                  {(comments[selectedPostIdx] || []).map((com, cIdx) => (
                    <div key={cIdx} className="bg-gray-900 border border-emerald-500/10 p-2.5 rounded-lg">
                      <div className="flex justify-between items-center mb-1 text-[10px]/normal font-semibold">
                        <span className="text-emerald-300">&gt; {com.author}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                          com.role === 'Hater' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>{com.role}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal font-sans pt-1 select-text">{com.text}</p>
                    </div>
                  ))}
                </div>

                {/* Comment insertion form */}
                <form onSubmit={submitComment} className="bg-gray-900 p-3.5 rounded-lg border border-emerald-500/10 space-y-3.5">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase block">$ insira seu_comentario</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-500 block mb-1">Nome/Apelido</label>
                      <input 
                        type="text" 
                        placeholder="Nome do usuário" 
                        required
                        value={commentName}
                        onChange={e => setCommentName(e.target.value)}
                        className="w-full bg-gray-950 border border-emerald-500/20 rounded px-2 py-1 text-emerald-400 text-[10px] focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 block mb-1">Escolher Persona IA</label>
                      <select 
                        value={commentRole}
                        onChange={e => setCommentRole(e.target.value)}
                        className="w-full bg-gray-950 border border-emerald-500/20 rounded px-2 py-1 text-emerald-400 text-[10px] focus:outline-none font-mono"
                      >
                        <option value="Fanboy">Fanboy (Entusiasmado)</option>
                        <option value="Hater">Hater (Crítico Sarcástico)</option>
                        <option value="Analista">Analista (Racional Técnico)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">Seu comentário</label>
                    <textarea 
                      placeholder="Digite sua mensagem de feedback para o blog..." 
                      rows={2}
                      required
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="w-full bg-gray-950 border border-emerald-500/20 rounded px-2 py-1 text-emerald-400 text-[10px] focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-emerald-500 text-black font-extrabold px-3 py-1.5 text-[10px] hover:bg-emerald-400 transition rounded flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Enviar Comentário <Send className="w-2.5 h-2.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. TRAVEL PLANNER PREVIEW SIMULATOR
// ============================================================================
const TravelPreview: React.FC<{ files: Record<string, any> }> = ({ files }) => {
  const [activeDay, setActiveDay] = useState<number>(0);
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Olá! Sou o seu assistente de viagens do Gemini AI. Que tal agendarmos algumas experiências extras ou tirar dúvidas sobre o seu itinerário?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const itinerary = [
    {
      day: 'Dia 1: Chegada & Primeiro Contato',
      transport: 'Suporte de Transfer Privado',
      morning: 'Pouso e Check-in no Hotel Boutique centralizado.',
      afternoon: 'Passeio a pé guiado pelo vilarejo histórico de artesãos.',
      evening: 'Jantar de Boas-vindas no charmoso bistrô local gastronômico.',
      places: [
        { name: 'Mirante dos Ventos', dur: '1h', price: 'Gratuito', desc: 'Espaço com vista de 360 graus ideal para registrar o pôr do sol.' },
        { name: 'Bistrô das Oliveiras', dur: '2h', price: 'R$ 140/pessoa', desc: 'Cozinha conceitual de proximidade utilizando legumes sazonais.' }
      ]
    },
    {
      day: 'Dia 2: Exploração Costeira/Natureza',
      transport: 'Carro alugado SUV',
      morning: 'Trilha guiada pelas falésias e vistas cinematográficas de lagunas marinhas.',
      afternoon: 'Sessão fotográfica profissional exclusiva em mirante florestal ao meio-dia.',
      evening: 'Degustação dirigida de peixes grelhados na brasa no deck marítimo.',
      places: [
        { name: 'Recanto das Falésias', dur: '3h', price: 'R$ 45/ingresso', desc: 'Parque ecológico nacional protegido com trilhas demarcadas de baixo impacto.' },
        { name: 'Restaurante da Praia Seca', dur: '1.5h', price: 'R$ 90/pessoa', desc: 'Pescados artesanais pescados no próprio dia pelos nativos.' }
      ]
    },
    {
      day: 'Dia 3: Mistério & Despedida',
      transport: 'Transfer Premium para Aeroporto',
      morning: 'Café da manhã colonial especial no deck panorâmico.',
      afternoon: 'Compras de lembranças e especiarias refinadas no mercado municipal.',
      evening: 'Embarque de retorno para casa com memórias gravadas.',
      places: [
        { name: 'Mercado de Especiarias', dur: '2h', price: 'Livre', desc: 'Mais de 100 quiosques vendendo queijos, licores e cerâmicas modeladas.' }
      ]
    }
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText) return;
    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    // Call actual Gemini API if configured!
    const config = getAIConfig();
    if (config.geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: config.geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Você é um guia de viagens profissional e inteligente especializado no planejamento de roteiros de alta performance. O usuário perguntou sobre um roteiro de viagem: "${userMsg}". Responda de forma sucinta e calorosa, dando 2 dicas de passeios ou gastronomia. Responda em português (pt-BR).`,
        });
        const reply = response.text || 'Desculpe, tive um contratempo para acessar as informações.';
        setMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
      } catch (err: any) {
        console.warn("Gemini guide failure:", err);
        setMessages(prev => [...prev, { sender: 'assistant', text: `Recebi seu roteiro com sucesso! Excelente escolha para sua viagem.` }]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Offline fallback with smart timeout simulation
      setTimeout(() => {
        let reply = 'Adorei a sua colocação! Recomendo fortemente consultar as opções do Mercado Colonial ou esticar um jantar à beira-rio no Bistrô das Oliveiras.';
        if (userMsg.toLowerCase().includes('preço') || userMsg.toLowerCase().includes('custo') || userMsg.toLowerCase().includes('caro')) {
          reply = 'O roteiro foi formatado para oferecer opções democráticas: desde trilhas 100% gratuitas em contato com a flora local, até bistrôs refinados a preço justo.';
        } else if (userMsg.toLowerCase().includes('restaurante') || userMsg.toLowerCase().includes('comer') || userMsg.toLowerCase().includes('fome')) {
          reply = 'Seu roteiro gastronômico conta com o Bistrô das Oliveiras (Dia 1) e o Restaurante da Praia Seca (Dia 2) – ambos referências na curadoria de pratos típicos.';
        }
        setMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
        setIsTyping(false);
      }, 1000);
    }
  };

  return (
    <div className="bg-gray-950 border border-blue-500/20 text-gray-100 rounded-lg overflow-hidden h-[620px] flex flex-col font-sans">
      {/* Travel Assistant header */}
      <div className="bg-blue-500/10 text-blue-300 py-1 px-3 text-center text-xs font-bold border-b border-blue-500/20 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-400" /> GEMINI TRAVEL CO.
        </span>
        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-mono">Noir Glassmorphism</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main daily layout panel */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between custom-scrollbar border-r border-blue-500/5 bg-gray-900/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black flex items-center gap-1.5 text-blue-400">
                <Map className="w-4 h-4" /> ITINERÁRIO SOB MEDIDA
              </h2>
              <span className="text-[10px] text-gray-500 font-mono">Next.js + Convex Core</span>
            </div>

            {/* Day Nav Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-gray-900 p-1 rounded-md border border-gray-800">
              {itinerary.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`py-1 text-center text-[10px] rounded transition font-bold cursor-pointer ${
                    activeDay === idx ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-blue-405 hover:bg-gray-800/40'
                  }`}
                >
                  Dia {idx + 1}
                </button>
              ))}
            </div>

            {/* Active Day Detail Display */}
            <div className="bg-gray-900 p-3.5 rounded-lg border border-gray-800/80 space-y-3 shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800/80 text-[11px]">
                <span className="text-blue-400 font-bold">{itinerary[activeDay].day}</span>
                <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">{itinerary[activeDay].transport}</span>
              </div>

              {/* Day Agenda */}
              <div className="grid grid-cols-3 gap-2.5 text-[10px]/relaxed pt-1 select-text">
                <div className="space-y-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block">Manhã</span>
                  <p className="text-gray-300 leading-normal">{itinerary[activeDay].morning}</p>
                </div>
                <div className="space-y-1 border-l border-gray-800/80 pl-2.5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block">Tarde</span>
                  <p className="text-gray-300 leading-normal">{itinerary[activeDay].afternoon}</p>
                </div>
                <div className="space-y-1 border-l border-gray-800/80 pl-2.5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block">Noite</span>
                  <p className="text-gray-300 leading-normal">{itinerary[activeDay].evening}</p>
                </div>
              </div>
            </div>

            {/* Segment Places Highlight list */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold block">Atividades recomendadas:</span>
              <div className="space-y-1.5">
                {itinerary[activeDay].places.map((place, pIdx) => (
                  <div key={pIdx} className="bg-gray-900/60 p-2 rounded-lg border border-gray-850 flex items-start gap-4 hover:border-blue-500/10 transition">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0 animate-ping"></span>
                    <div className="flex-1 flex justify-between gap-2 overflow-hidden text-[10px]/normal select-text">
                      <div>
                        <div className="font-bold text-gray-200">{place.name}</div>
                        <div className="text-gray-400 text-[9px] leading-relaxed mt-0.5">{place.desc}</div>
                      </div>
                      <div className="flex-shrink-0 text-right font-mono class-accent flex flex-col gap-0.5 text-blue-400 font-bold">
                        <span>{place.dur}</span>
                        <span className="text-[9px] text-green-500">{place.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 pt-3 border-t border-gray-900 flex justify-between items-center">
            <span>Roteiro 100% Modificável</span>
            <span>Estilo: Noir CSS puro</span>
          </div>
        </div>

        {/* Right Side Help chatbot */}
        <div className="w-80 bg-gray-900/50 p-3.5 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold pb-1 border-b border-gray-800 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Consultor IA Integrado
            </span>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 custom-scrollbar">
              {messages.map((msg, mIdx) => (
                <div key={mIdx} className={`max-w-[85%] text-[10px]/relaxed p-2 rounded-lg leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-500 text-black font-semibold ml-auto' 
                    : 'bg-gray-950 border border-gray-850 text-gray-300 mr-auto select-text'
                }`}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-gray-950 border border-gray-850 text-gray-500 text-[10px] p-2 rounded-lg mr-auto italic tracking-wide animate-pulse">
                  Consultor digitando dica do Gemini...
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="pt-2 border-t border-gray-800 flex gap-1.5">
            <input 
              type="text" 
              placeholder="Perguntar sobre hotéis, passeios..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-850 rounded px-2.5 py-1 text-[10px] placeholder-gray-505 focus:outline-none focus:border-blue-500 text-white"
            />
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 text-black px-3.5 py-1 text-[10px] font-bold rounded cursor-pointer"
            >
              Perguntar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
