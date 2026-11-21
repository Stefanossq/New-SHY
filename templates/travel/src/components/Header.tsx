'use client';
import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Plane } from 'lucide-react';
import { SITE } from '@/lib/site';

export default function Header() {
  return (
    <header className="header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plane size={24} />
          <span className="logo">{SITE.name}</span>
        </Link>

        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Planejar</Link>
          <Link href="/my-trips" className="nav-link">Meus roteiros</Link>
          {SITE.features.payments && <Link href="/premium" className="nav-link">Premium</Link>}
        </nav>

        <div>
          <SignedIn><UserButton /></SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
                <button className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>LOGIN</button>
            </SignInButton>
          </SignedOut>
        </div>
    </header>
  );
}
