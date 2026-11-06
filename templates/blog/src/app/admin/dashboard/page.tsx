'use client';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function AdminDashboard() {
  const posts = useQuery(api.jikan.getPosts);
  const auditLogs = useQuery(api.jikan.getAuditLogs);
  const deletePost = useMutation(api.mutations.deletePostPublic);
  const updatePost = useMutation(api.mutations.updatePostPublic);
  const generateContent = useAction(api.jikan.generateContent);
  const generateGame = useAction(api.jikan.generateGame);
  const generatePromo = useAction(api.jikan.generatePromoVideo);

  const [loading, setLoading] = useState("");
  const [editingPost, setEditingPost] = useState<any>(null);

  const handleGenerate = async (type: 'posts' | 'game' | 'promo') => {
    setLoading(type);
    try {
        if (type === 'posts') await generateContent();
        if (type === 'game') await generateGame();
        if (type === 'promo') await generatePromo();
        alert("Comando executado com sucesso.");
    } catch (e) {
        alert("Erro na execução: " + e);
    } finally {
        setLoading("");
    }
  };

  const handleEdit = (post: any) => {
      setEditingPost({ ...post });
  };

  const handleSaveUpdate = async () => {
      if (!editingPost) return;
      try {
          await updatePost({
              id: editingPost._id,
              title: editingPost.title,
              slug: editingPost.slug,
              content_markdown: editingPost.content_markdown,
              image_url: editingPost.image_url
          });
          setEditingPost(null);
          alert("Post atualizado com sucesso!");
      } catch (e) {
          alert("Erro ao atualizar: " + e);
      }
  };

  if (!posts) return <div className="container">Carregando painel...</div>;

  return (
    <div className="container">
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: 'var(--color-accent)' }}>ADMIN_MAINFRAME</h1>
            <Link href="/" className="btn">VOLTAR AO SITE</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            {/* ACTION PANEL */}
            <div className="card">
                <h3 style={{ marginBottom: '15px' }}>Comandos de Geração (IA)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleGenerate('posts')} disabled={!!loading} className="btn">
                        {loading === 'posts' ? "PROCESSANDO..." : "GERAR NOVOS POSTS (Jikan + Gemini)"}
                    </button>
                    <button onClick={() => handleGenerate('game')} disabled={!!loading} className="btn">
                        {loading === 'game' ? "PROCESSANDO..." : "GERAR GAME DA SEMANA"}
                    </button>
                    <button onClick={() => handleGenerate('promo')} disabled={!!loading} className="btn">
                         {loading === 'promo' ? "PROCESSANDO..." : "ATUALIZAR VÍDEO PROMO"}
                    </button>
                </div>
            </div>

            {/* AUDIT LOGS */}
            <div className="card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '15px' }}>Logs de Auditoria</h3>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {auditLogs?.map((log, i) => (
                        <div key={i} style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #333' }}>
                            <span style={{ color: log.status === 'SUCCESS' ? 'var(--color-accent)' : 'red' }}>[{log.status}]</span> {log.action}: {log.output_summary}
                        </div>
                    ))}
                    {!auditLogs?.length && "Nenhum log registrado."}
                </div>
            </div>
        </div>

        <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Gerenciar Posts Existentes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid white' }}>
                        <th style={{ textAlign: 'left', padding: '10px' }}>Título</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>Data</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post._id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '10px' }}>{post.title}</td>
                            <td style={{ padding: '10px' }}>{new Date(post.published_date).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleEdit(post)} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    [EDITAR]
                                </button>
                                <button onClick={() => deletePost({ id: post._id })} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    [DELETAR]
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* EDIT MODAL */}
        {editingPost && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-accent)' }}>
                    <h2 style={{ marginBottom: '20px', color: 'var(--color-accent)' }}>Editar Post</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Título</label>
                            <input value={editingPost.title} onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Slug (URL)</label>
                            <input value={editingPost.slug} onChange={(e) => setEditingPost({...editingPost, slug: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Imagem URL</label>
                            <input value={editingPost.image_url} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Conteúdo (Markdown)</label>
                            <textarea 
                                value={editingPost.content_markdown} 
                                onChange={(e) => setEditingPost({...editingPost, content_markdown: e.target.value})} 
                                style={{ height: '200px', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => setEditingPost(null)} className="btn" style={{ borderColor: '#666', color: '#888' }}>Cancelar</button>
                        <button onClick={handleSaveUpdate} className="btn">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        )}

      </SignedIn>
    </div>
  );
}
