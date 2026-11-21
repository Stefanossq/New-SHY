import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const Button = ({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) => (
  <button {...props} className={`${variant === 'primary' ? 'btn-cream' : 'btn-ghost'} ${className}`} />
);

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`gp-panel p-6 ${className}`}>{children}</div>
);

export const Notice = ({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'error'; children: ReactNode }) => {
  const styles = {
    info: 'border-lav/60 bg-lav/10 text-cream',
    warning: 'border-warn/60 bg-warn/10 text-cream',
    error: 'border-bad/60 bg-bad/10 text-cream',
  }[tone];
  return <div className={`rounded-2xl border-2 px-4 py-3 text-lg leading-snug ${styles}`}>{children}</div>;
};

/** Título de tela com a pata, como nas telas do site. */
export const ScreenTitle = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div className="flex items-center gap-4">
    <Paw className="h-12 w-12 shrink-0 -rotate-12 text-cream" />
    <div>
      <h1 className="gp-title text-4xl sm:text-5xl">{children}</h1>
      {sub && <p className="mt-1 text-xl text-cream-2">{sub}</p>}
    </div>
  </div>
);

export const Paw = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
    <ellipse cx="32" cy="42" rx="14" ry="12" />
    <ellipse cx="14" cy="26" rx="6" ry="8" transform="rotate(-18 14 26)" />
    <ellipse cx="26" cy="15" rx="6" ry="8.5" transform="rotate(-6 26 15)" />
    <ellipse cx="39" cy="15" rx="6" ry="8.5" transform="rotate(6 39 15)" />
    <ellipse cx="51" cy="26" rx="6" ry="8" transform="rotate(18 51 26)" />
  </svg>
);
