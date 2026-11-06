'use client';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import MatrixLoader from "@/components/MatrixLoader";
import VibeMatcher from "@/components/VibeMatcher";
import AiringWidget from "@/components/AiringWidget";

export default function PostsPage() {
  const posts = useQuery(api.jikan.getPosts);
  const latestGame = useQuery(api.jikan.getLatestGame);
  const promo = useQuery(api.jikan.getPromo);
  const [search, setSearch] = useState("");

  if (posts === undefined) return <MatrixLoader />;

  // Client-side filtering
  const filteredPosts = posts.filter(post => 
      post.title.toLowerCase().includes(search.toLowerCase()) || 
      post.content_markdown.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Blog Posts</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Recomendações & Games.</p>
        </div>
        <Link href="/admin/dashboard" className="btn">Admin Panel</Link>
      </header>

      {/* GRID LAYOUT FOR MAIN CONTENT AND SIDEBAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
        
        {/* MAIN COLUMN */}
        <div>
            {/* SEARCH BAR - MOVED TO TOP */}
            <section style={{ marginBottom: '30px' }}>
                <input 
                    type="text" 
                    placeholder="> Buscar post por título ou conteúdo..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family)',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(138, 255, 138, 0.1)'
                    }}
                />
            </section>

            {/* PROMO VIDEO SECTION */}
            {promo && (
                <section style={{ marginBottom: '40px' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-accent)' }}>
                        <div style={{ background: 'var(--color-accent)', color: 'var(--bg-color)', padding: '5px 15px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>FEATURED_PROMO</span>
                            <span>REC ●</span>
                        </div>
                        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                            <iframe 
                                src={`${promo.embed_url}?autoplay=0`} 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allowFullScreen
                                title={promo.title}
                            />
                        </div>
                        <div style={{ padding: '15px' }}>
                            <h3 style={{ margin: 0 }}>{promo.title}</h3>
                        </div>
                    </div>
                </section>
            )}

            {/* VIBE MATCHER SECTION */}
            <section style={{ marginBottom: '40px' }}>
                <VibeMatcher />
            </section>

            {/* GAME OF THE WEEK SECTION */}
            {latestGame && !search && (
                <section className="card" style={{ marginBottom: '40px', border: '1px solid var(--color-accent)' }}>
                    <h2 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        /// GAME_OF_THE_WEEK_PROTOCOL
                    </h2>
                    <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'start' }}>
                        <img src={latestGame.thumbnail} alt={latestGame.title} style={{ width: '150px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>{latestGame.title}</h3>
                            <div style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--border-color)', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '10px' }}>
                                {latestGame.platform}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{latestGame.short_description}</p>
                            <a href={latestGame.game_url} target="_blank" className="btn" style={{ display: 'inline-block', fontSize: '0.8rem' }}>
                                DATA LINK &rarr;
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* POSTS LIST */}
            <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filteredPosts.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>{search ? `Nenhum resultado para "${search}".` : "Nenhum post encontrado."}</p>
                    <br />
                    {!search && <Link href="/admin/dashboard" style={{ color: 'var(--color-accent)' }}>Vá ao Dashboard para gerar conteúdo &rarr;</Link>}
                </div>
                ) : (
                filteredPosts.map((post) => (
                    <article key={post._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ height: '180px', overflow: 'hidden', borderRadius: '4px 4px 0 0', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                        <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none', borderRadius: 0 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', border: 'none', padding: 0, lineHeight: '1.3' }}>
                            <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', border: 'none' }}>
                                {post.title}
                            </Link>
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{new Date(post.published_date).toLocaleDateString()}</span>
                            <span style={{color: 'var(--color-accent)'}}>♥ {post.likes || 0}</span>
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <Link href={`/posts/${post.slug}`} className="btn" style={{ display: 'block', textAlign: 'center' }}>Ler Post</Link>
                        </div>
                    </div>
                    </article>
                ))
                )}
            </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AiringWidget />
            
            <div className="card">
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>ABOUT_US</h3>
                <p style={{ fontSize: '0.8rem' }}>Blog gerado 100% por IA.</p>
            </div>
        </div>

      </div>
      
      <style jsx>{`
        @media (max-width: 800px) {
            div[style*="grid-template-columns: 1fr 300px"] {
                grid-template-columns: 1fr !important;
            }
        }
      `}</style>
    </div>
  );
}
