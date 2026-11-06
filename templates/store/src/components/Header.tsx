'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './Header.module.css';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { ShoppingBag } from 'lucide-react';

const Header: React.FC = () => {
  const { cartCount } = useCart();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>MONOCHROME</Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>Shop</Link>
        <Link href="/pricing" className={styles.navLink}>Planos</Link>
        <SignedIn><Link href="/admin" className={styles.navLink}>Admin</Link></SignedIn>
        
        <div className={styles.actions}>
            <Link href="/cart" className={styles.cartLink}>
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
            </Link>
            
            <SignedOut>
                <SignInButton mode="modal"><button className={styles.loginBtn}>Login</button></SignInButton>
            </SignedOut>
            <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>
    </header>
  );
};
export default Header;
