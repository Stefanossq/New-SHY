import styles from './Footer.module.css';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p>&copy; {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</p>
        <p>{SITE.tagline}</p>
      </div>
    </footer>
  );
}
