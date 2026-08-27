import { useEffect, useState } from 'react';

export interface BreathOrbProps {
  stage: 'in' | 'out';
  inhaleMs: number;
  exhaleMs: number;
  breathIndex: number;
  totalBreaths: number;
  size?: number;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Podświetlana kula oddechowa z falami i pierścieniem postępu — wizualizacja tempa oddechu. */
export function BreathOrb({ stage, inhaleMs, exhaleMs, breathIndex, totalBreaths, size = 280 }: BreathOrbProps) {
  const [ripples, setRipples] = useState<number[]>([]);
  const cycleMs = inhaleMs + exhaleMs;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = Date.now();
    setRipples((r) => [...r.slice(-2), id]);
    const t = setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), cycleMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathIndex]);

  const radius = size / 2 - 16;
  const dots = Array.from({ length: totalBreaths }, (_, i) => {
    const angle = (i / totalBreaths) * Math.PI * 2 - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const filled = i <= breathIndex;
    return (
      <div
        key={i}
        className={`absolute h-1.5 w-1.5 rounded-full transition-colors duration-300 ${filled ? 'bg-[var(--color-primary)]' : 'bg-white/15'}`}
        style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' }}
      />
    );
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {dots}
      {ripples.map((id) => (
        <div
          key={id}
          className="absolute rounded-full border border-[var(--color-primary)]/40"
          style={{ width: size * 0.42, height: size * 0.42, animation: `orb-ripple ${cycleMs}ms ease-out forwards` }}
        />
      ))}
      <div
        key={`${stage}-${breathIndex}`}
        className="absolute rounded-full"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background:
            stage === 'in'
              ? 'radial-gradient(circle at 35% 30%, rgba(110,231,201,0.95), rgba(52,184,149,0.55) 55%, transparent 75%)'
              : 'radial-gradient(circle at 35% 30%, rgba(167,139,250,0.9), rgba(110,231,201,0.4) 55%, transparent 75%)',
          animation: `${stage === 'in' ? 'breathe-in' : 'breathe-out'} ${stage === 'in' ? inhaleMs : exhaleMs}ms ease-in-out forwards`,
          boxShadow: '0 0 70px 12px rgba(110,231,201,0.22)',
        }}
      />
      <div className="relative text-center">
        <p className="text-4xl font-bold tabular-nums">{breathIndex + 1}</p>
        <p className="text-sm text-[var(--color-muted)]">/ {totalBreaths}</p>
      </div>
    </div>
  );
}
