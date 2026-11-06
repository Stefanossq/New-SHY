'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToasterContextType {
    message: string | null;
    type: ToastType;
    showToast: (msg: string, type?: ToastType) => void;
    hideToast: () => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

export const useToaster = () => {
    const context = useContext(ToasterContext);
    if (!context) throw new Error("useToaster must be used within ToasterProvider");
    return context;
};

export const ToasterProvider = ({ children }: { children: ReactNode }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<ToastType>('info');

    const showToast = (msg: string, t: ToastType = 'info') => {
        setMessage(msg);
        setType(t);
        setTimeout(() => setMessage(null), 3000);
    };

    const hideToast = () => setMessage(null);

    return (
        <ToasterContext.Provider value={{ message, type, showToast, hideToast }}>
            {children}
        </ToasterContext.Provider>
    );
};