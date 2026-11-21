'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Plus, Trash, Edit } from 'lucide-react';
import { Product, ORDER_STATUS_LABEL, formatBRL } from '@/types';
import styles from './page.module.css';
import { SITE } from '@/lib/site';

const EMPTY = { name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '', attributes: {} as Record<string, string | number> };

export default function AdminPage() {
  const isAdmin = useQuery(api.authz.amIAdmin);
  const products = useQuery(api.products.get);
  const orders = useQuery(api.orders.all, isAdmin ? {} : 'skip');
  const deleteProduct = useMutation(api.products.remove);
  const addProduct = useMutation(api.products.add);
  const updateProduct = useMutation(api.products.update);

  const [editing, setEditing] = useState<Id<'products'> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin === undefined || products === undefined) return <div className={styles.container}>Carregando...</div>;
  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <h1>Acesso restrito</h1>
        <p>Somente administradores (variável ADMIN_USER_IDS no Convex) acessam este painel.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isNew) await addProduct(formData);
      else if (editing) await updateProduct({ id: editing, ...formData });
      setEditing(null);
      setIsNew(false);
      setFormData(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  };

  const handleEdit = (p: Product) => {
    setEditing(p._id);
    setIsNew(false);
    setFormData({ name: p.name, price: p.price, stock: p.stock, description: p.description, category: p.category, imageUrl: p.imageUrl, attributes: p.attributes ?? {} });
  };

  const handleDelete = async (p: Product) => {
    if (confirm(`Excluir "${p.name}"?`)) await deleteProduct({ id: p._id });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Painel admin</h1>
        <button className="btn" onClick={() => { setIsNew(true); setEditing(null); setFormData(EMPTY); }}>
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {(isNew || editing) && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{isNew ? 'Novo produto' : 'Editar produto'}</h2>
          <input placeholder="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input placeholder="Preço" type="number" step="0.01" min="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
          <input placeholder="Estoque" type="number" min="0" step="1" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} required />
          <input placeholder="Categoria" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
          <input placeholder="URL da imagem" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          {SITE.productFields.map((field) => (
            <input
              key={field.key}
              placeholder={field.unit ? `${field.label} (${field.unit})` : field.label}
              type={field.type === 'number' ? 'number' : 'text'}
              step="any"
              value={formData.attributes[field.key] ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                const value = field.type === 'number' && raw !== '' ? Number(raw) : raw;
                setFormData({ ...formData, attributes: { ...formData.attributes, [field.key]: value } });
              }}
            />
          ))}
          <textarea placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn">Salvar</button>
            <button type="button" className="btn" style={{ background: '#333' }} onClick={() => { setIsNew(false); setEditing(null); }}>Cancelar</button>
          </div>
        </form>
      )}

      <h2>Produtos</h2>
      <table className={styles.table}>
        <thead>
          <tr><th>Nome</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{formatBRL(p.price)}</td>
              <td>{p.stock}</td>
              <td className={styles.actions}>
                <button onClick={() => handleEdit(p)} aria-label="Editar"><Edit size={16} /></button>
                <button onClick={() => handleDelete(p)} aria-label="Excluir"><Trash size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '3rem' }}>Pedidos recentes</h2>
      <table className={styles.table}>
        <thead>
          <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {(orders ?? []).map((o) => (
            <tr key={o._id}>
              <td>#{o._id.substring(0, 8)} · {new Date(o._creationTime).toLocaleDateString('pt-BR')}</td>
              <td>{o.shippingAddress.fullName}</td>
              <td>{formatBRL(o.total)}</td>
              <td>{ORDER_STATUS_LABEL[o.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
