import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Start', icon: '🏠', end: true },
  { to: '/oddech', label: 'Wim Hof', icon: '🌬️' },
  { to: '/jacobson', label: 'Jacobson', icon: '🧎' },
  { to: '/schultz', label: 'Schultz', icon: '🕯️' },
  { to: '/medytacja', label: 'Medytacja', icon: '🧘' },
  { to: '/focus', label: 'Focus/Sen', icon: '🎧' },
  { to: '/swiatlo', label: 'Światło', icon: '✨' },
  { to: '/gry', label: 'Trening mózgu', icon: '🧠' },
  { to: '/biofeedback', label: 'Biofeedback', icon: '❤️' },
  { to: '/urzadzenia', label: 'Urządzenia', icon: '🔧' },
  { to: '/postepy', label: 'Postępy', icon: '📈' },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b1120]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
            <span className="text-2xl">🧘</span>
            <span>Spokój</span>
          </NavLink>
          <nav className="scrollbar-thin -mx-2 flex max-w-full gap-1 overflow-x-auto px-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                      : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                  }`
                }
              >
                <span aria-hidden>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-[var(--color-muted)] sm:px-6">
        Aplikacja ma charakter edukacyjno-relaksacyjny i nie zastępuje porady medycznej. Pomiary biofeedback nie są
        urządzeniem medycznym.
      </footer>
    </div>
  );
}
