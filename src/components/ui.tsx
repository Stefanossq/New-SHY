import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const Button = ({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
      variant === 'primary'
        ? 'bg-cyan-400 text-black hover:bg-cyan-300'
        : 'border border-line bg-panel text-gray-200 hover:border-gray-600'
    } ${className}`}
  />
);

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-line bg-panel p-6 ${className}`}>{children}</div>
);

export const Notice = ({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'error'; children: ReactNode }) => {
  const styles = {
    info: 'border-cyan-900 bg-cyan-950/40 text-cyan-100',
    warning: 'border-amber-800 bg-amber-950/40 text-amber-100',
    error: 'border-red-800 bg-red-950/40 text-red-100',
  }[tone];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
};
