'use client';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <p>&copy; 2024 Monochrome Store. Todos os direitos reservados.</p>
                <div className={styles.links}>
                    <a href="#">Termos</a>
                    <a href="#">Privacidade</a>
                    <a href="#">Contato</a>
                </div>
            </div>
        </footer>
    );
}