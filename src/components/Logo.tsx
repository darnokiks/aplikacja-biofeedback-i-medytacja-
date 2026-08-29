export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="logo-orb" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#a8f5e0" />
          <stop offset="55%" stopColor="#34b895" />
          <stop offset="100%" stopColor="#5b4bb8" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" stroke="#a78bfa" strokeOpacity="0.28" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="21" stroke="#a78bfa" strokeOpacity="0.4" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="13.5" fill="url(#logo-orb)" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)]">Spokój</span>
      )}
    </span>
  );
}
