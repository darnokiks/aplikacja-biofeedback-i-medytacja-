import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-[var(--color-surface)] p-5 shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none';
  const variants: Record<string, string> = {
    primary: 'bg-[var(--color-primary)] text-[#04140f] hover:bg-[var(--color-primary-dark)]',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-white/10',
    ghost: 'bg-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5',
    danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones: Record<string, string> = {
    default: 'bg-white/5 text-[var(--color-text)]',
    accent: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
    muted: 'bg-white/5 text-[var(--color-muted)]',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function ProgressRing({
  progress,
  size = 220,
  strokeWidth = 10,
  children,
  color = 'var(--color-primary)',
}: {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">{eyebrow}</p>}
      <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[var(--color-muted)]">{description}</p>}
    </div>
  );
}
