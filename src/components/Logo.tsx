export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="logo-halo" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="logo-orb" cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#d4fdf3" />
          <stop offset="32%" stopColor="#5eead4" />
          <stop offset="68%" stopColor="#2fae8e" />
          <stop offset="100%" stopColor="#7c5cf0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="27.5" fill="url(#logo-halo)" />
      <circle cx="32" cy="32" r="18.5" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="32" cy="32" r="15.5" fill="url(#logo-orb)" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap text-[var(--color-text)]">
          Mental Wellness
        </span>
      )}
    </span>
  );
}
