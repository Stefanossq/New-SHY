'use client';
import { useToaster } from '@/context/ToasterContext';
import styles from './Toaster.module.css';

export default function Toaster() {
    const { message, type } = useToaster();
    if (!message) return null;
    
    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            {message}
        </div>
    );
}