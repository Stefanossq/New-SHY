'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Plus, Trash, Edit } from 'lucide-react';
import styles from './page.module.css';

export default function AdminPage() {
    const products = useQuery(api.products.get);
    const deleteProduct = useMutation(api.products.remove);
    const addProduct = useMutation(api.products.add);
    const updateProduct = useMutation(api.products.update);

    const [editing, setEditing] = useState<any>(null);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew) {
            await addProduct(formData);
        } else if (editing) {
            await updateProduct({ id: editing, ...formData });
        }
        setEditing(null);
        setIsNew(false);
        setFormData({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' });
    };

    const handleEdit = (p: any) => {
        setEditing(p._id);
        setIsNew(false);
        setFormData({ name: p.name, price: p.price, stock: p.stock, description: p.description, category: p.category, imageUrl: p.imageUrl });
    };

    if (!products) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <button className="btn" onClick={() => { setIsNew(true); setEditing(null); setFormData({ name: '', price: 0, stock: 0, description: '', category: '', imageUrl: '' }); }}>
                    <Plus size={16} /> Novo Produto
                </button>
            </div>

            {(isNew || editing) && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>{isNew ? 'Novo Produto' : 'Editar Produto'}</h2>
                    <input placeholder="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <input placeholder="Preço" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                    <input placeholder="Estoque" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} required />
                    <input placeholder="Categoria" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                    <input placeholder="URL Imagem" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} required />
                    <textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn">Salvar</button>
                        <button type="button" className="btn" style={{ background: '#333' }} onClick={() => { setIsNew(false); setEditing(null); }}>Cancelar</button>
                    </div>
                </form>
            )}

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p._id}>
                            <td>{p.name}</td>
                            <td>R$ {p.price.toFixed(2)}</td>
                            <td>{p.stock}</td>
                            <td className={styles.actions}>
                                <button onClick={() => handleEdit(p)}><Edit size={16} /></button>
                                <button onClick={() => deleteProduct({ id: p._id })}><Trash size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}