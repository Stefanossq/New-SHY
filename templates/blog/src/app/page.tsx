'use client';
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from 'next/link';
import TeamCards from "@/components/TeamCards";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  const generateTeam = useAction(api.jikan.generateTeam);
  const mySavedTeam = useQuery(api.jikan.getTeams); // Fetch saved team if logged in

  const [generatedTeam, setGeneratedTeam] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // If user has a saved team and hasn't generated a new one in this session, show saved
  const displayedTeam = generatedTeam || (mySavedTeam && mySavedTeam.length > 0 ? mySavedTeam[0].characters : null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const team = await generateTeam();
        setGeneratedTeam(team);
    } catch (e) {
        alert("Erro ao gerar time: " + e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '30px' }}>
      
      {/* HERO SECTION */}
      <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>BLOG_PESSOAL_AI</h1>
          <p style={{ margin: '0 auto', maxWidth: '600px', color: 'var(--text-secondary)' }}>
            Conectando Neural Net (Gemini) à Jikan API para gerar conteúdo otaku automaticamente.
          </p>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <Link href="/posts" className="btn">ACESSAR BLOG</Link>
        <Link href="/admin/dashboard" className="btn" style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}>ADMIN</Link>
      </div>

      {/* TEAM GENERATOR SECTION */}
      <section className="card" style={{ width: '100%', maxWidth: '800px', marginTop: '20px', border: '1px solid var(--color-accent)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--color-accent)' }}>
            >_ GERADOR DE TIME ALEATÓRIO
        </h2>
        
        <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Recrute 3 personagens aleatórios do multiverso dos animes.
            <SignedOut><br/><span style={{fontSize: '0.8rem'}}>(Faça login para salvar seu time permanentemente)</span></SignedOut>
        </p>

        {displayedTeam ? (
            <div style={{ marginBottom: '20px' }}>
                <TeamCards characters={displayedTeam} />
            </div>
        ) : (
            <div style={{ padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '20px', opacity: 0.5 }}>
                SEM DADOS DE EQUIPE
            </div>
        )}

        <button onClick={handleGenerate} disabled={loading} className="btn" style={{ minWidth: '200px' }}>
            {loading ? "RECRUTANDO..." : "GERAR NOVO TIME"}
        </button>
      </section>

    </div>
  );
}