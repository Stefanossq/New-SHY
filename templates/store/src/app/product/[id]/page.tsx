'use client';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Star, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from './page.module.css';
import { useUser, SignInButton } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function ProductDetailsPage() {
    // No Next.js 15+, usar params como prop pode causar problemas de tipagem com Promises em Client Components.
    // Usar o hook useParams() é a forma recomendada e type-safe.
    const params = useParams();
    const productId = params?.id as Id<"products">;

    const product = useQuery(api.products.getById, productId ? { id: productId } : "skip");
    const reviews = useQuery(api.reviews.getByProduct, productId ? { productId } : "skip");
    const addReview = useMutation(api.reviews.add);
    const { addToCart } = useCart();
    const { isSignedIn } = useUser();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    if (!product) return <div className={styles.loading}>Carregando...</div>;

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return;
        setSubmittingReview(true);
        try {
            await addReview({ productId, rating, comment });
            setComment("");
            alert("Avaliação enviada com sucesso!");
        } catch(e) {
            alert("Erro ao enviar avaliação.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const avgRating = reviews && reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : "N/A";

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}><ArrowLeft size={16}/> Voltar</Link>
            
            <div className={styles.productGrid}>
                <div className={styles.imageWrapper}>
                    <img src={product.imageUrl} alt={product.name} />
                </div>
                <div className={styles.details}>
                    <div className={styles.category}>{product.category}</div>
                    <h1 className={styles.title}>{product.name}</h1>
                    <div className={styles.price}>R$ {product.price.toFixed(2)}</div>
                    <p className={styles.description}>{product.description}</p>
                    
                    <button onClick={() => addToCart(productId)} className="btn" style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <ShoppingBag size={18} /> Adicionar ao Carrinho
                    </button>

                    <div className={styles.meta}>
                        <span>Estoque: {product.stock} unidades</span>
                        <span>Avaliação: {avgRating} ★ ({reviews?.length || 0})</span>
                    </div>
                </div>
            </div>

            <div className={styles.reviewsSection}>
                <h2>Avaliações dos Clientes</h2>
                
                <div className={styles.reviewList}>
                    {reviews?.map(r => (
                        <div key={r._id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <span className={styles.reviewerName}>{r.userName}</span>
                                <div className={styles.stars}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "#fff" : "none"} stroke="#fff"/>)}</div>
                            </div>
                            <p className={styles.reviewComment}>{r.comment}</p>
                            <span className={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {reviews?.length === 0 && <p style={{color: 'var(--text-muted)'}}>Nenhuma avaliação ainda. Seja o primeiro!</p>}
                </div>

                {isSignedIn ? (
                    <form onSubmit={handleAddReview} className={styles.reviewForm}>
                        <h3>Deixe sua avaliação</h3>
                        <div className={styles.ratingInput}>
                            {[1,2,3,4,5].map(star => (
                                <button type="button" key={star} onClick={() => setRating(star)} className={styles.starBtn}>
                                    <Star fill={star <= rating ? "#fff" : "none"} stroke="#fff" size={24} />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={comment} 
                            onChange={e => setComment(e.target.value)} 
                            placeholder="Escreva sua opinião sobre o produto..."
                            required
                        />
                        <button type="submit" className="btn" disabled={submittingReview}>
                            {submittingReview ? "Enviando..." : "Publicar Avaliação"}
                        </button>
                    </form>
                ) : (
                    <div className={styles.loginPrompt}>
                        <SignInButton mode="modal">
                            <button className="btn">Faça Login para Avaliar</button>
                        </SignInButton>
                    </div>
                )}
            </div>
        </div>
    );
}
