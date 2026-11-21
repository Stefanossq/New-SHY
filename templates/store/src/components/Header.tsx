'use client';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import styles from './Header.module.css';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { ShoppingBag } from 'lucide-react';
import { SITE } from '@/lib/site';

const Header: React.FC = () => {
  const { cartCount } = useCart();
  const isAdmin = useQuery(api.authz.amIAdmin);
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>{SITE.name.toUpperCase()}</Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>Loja</Link>
        <SignedIn><Link href="/orders" className={styles.navLink}>Meus pedidos</Link></SignedIn>
        {isAdmin && <Link href="/admin" className={styles.navLink}>Admin</Link>}

        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartLink} aria-label="Carrinho">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
          </Link>
          <SignedOut>
            <SignInButton mode="modal"><button className={styles.loginBtn}>Entrar</button></SignInButton>
          </SignedOut>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </nav>
    </header>
  );
};
export default Header;
