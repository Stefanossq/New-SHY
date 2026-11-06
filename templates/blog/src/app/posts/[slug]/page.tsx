'use client';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import MatrixLoader from "@/components/MatrixLoader";

export default function PostView({ params }: { params: { slug: string } }) {
  const post = useQuery(api.jikan.getPostBySlug, { slug: params.slug });
  const likePost = useMutation(api.mutations.likePost);

  if (post === undefined) return <MatrixLoader />;
  if (post === null) return <div className="container"><h1>404 - Post Not Found</h1><Link href="/posts">Voltar</Link></div>;

  return (
    <div className="container">
        <nav style={{ marginBottom: '20px' }}>
            <Link href="/posts">← Voltar para Lista</Link>
        </nav>

        <article className="card">
            <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{post.title}</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Por Kira (AI) | {new Date(post.published_date).toLocaleDateString()}</span>
                    
                    <button 
                        onClick={() => likePost({ id: post._id })}
                        className="btn"
                        style={{ padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>RESPECT</span>
                        <span style={{ background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                            {post.likes || 0}
                        </span>
                    </button>
                </div>
            </header>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img src={post.image_url} alt="Cover" style={{ maxHeight: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', borderRadius: '8px' }} />
            </div>

            <div className="markdown-body">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
            </div>
            
            {/* AI COMMENT SECTION */}
            {post.comments && post.comments.length > 0 && (
                <div style={{ marginTop: '50px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--color-accent)' }}>
                        >_ USER_COMMENTS [SIMULATION]
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {post.comments.map((comment: any, idx: number) => (
                            <div key={idx} style={{ 
                                background: 'var(--bg-color)', 
                                border: '1px solid var(--border-color)', 
                                padding: '15px', 
                                borderRadius: '4px',
                                borderLeft: `3px solid ${
                                    comment.type === 'hater' ? 'var(--error-color)' : 
                                    comment.type === 'fanboy' ? 'var(--color-accent)' : 
                                    '#38bdf8'
                                }`
                            }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>@{comment.user}</span>
                                    <span style={{ 
                                        textTransform: 'uppercase', 
                                        fontSize: '0.65rem', 
                                        opacity: 0.7,
                                        padding: '2px 5px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '3px'
                                    }}>{comment.type}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    </div>
  );
}