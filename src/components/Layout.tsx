import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogIn, MoreHorizontal } from 'lucide-react';
import { Logo } from './Logo';
import { ROUTE_ICONS } from '../lib/icons';
import { getCurrentUser, onAuthChange, signOut, type AuthUser } from '../lib/auth';

const PRIMARY_NAV = [
  { to: '/', label: 'Start', end: true },
  { to: '/budzik', label: 'Budzik' },
  { to: '/oddech', label: 'Oddech' },
  { to: '/medytacja', label: 'Medytacja' },
  { to: '/focus', label: 'Focus/Sen' },
  { to: '/gry', label: 'Trening mózgu' },
  { to: '/postepy', label: 'Postępy' },
] as const;

const MORE_NAV = [
  { to: '/jacobson', label: 'Jacobson' },
  { to: '/schultz', label: 'Schultz' },
  { to: '/swiatlo', label: 'Podróż światła' },
  { to: '/muzyka', label: 'Muzyka' },
  { to: '/biofeedback', label: 'Biofeedback' },
  { to: '/urzadzenia', label: 'Urządzenia' },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
      : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
  }`;

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const isMoreActive = MORE_NAV.some((item) => location.pathname === item.to);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isMoreActive || open
            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
        }`}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
        <span className="hidden sm:inline">Więcej</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[var(--color-surface)] py-1.5 shadow-xl shadow-black/40">
          {MORE_NAV.map((item) => {
            const Icon = ROUTE_ICONS[item.to];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:bg-white/5'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccountSlot() {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  useEffect(() => onAuthChange(() => setUser(getCurrentUser())), []);

  if (!user) {
    return (
      <NavLink to="/logowanie" className={navLinkClass}>
        <LogIn className="h-[18px] w-[18px]" aria-hidden />
        <span className="hidden sm:inline">Zaloguj się</span>
      </NavLink>
    );
  }

  return (
    <button
      onClick={signOut}
      title="Kliknij, aby się wylogować"
      className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-semibold text-[var(--color-primary)]">
          {user.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden sm:inline">{user.name}</span>
    </button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b1120]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="shrink-0">
            <Logo />
          </NavLink>
          <div className="flex min-w-0 items-center gap-1">
            <nav className="scrollbar-thin -mx-2 flex min-w-0 items-center gap-1 overflow-x-auto px-2">
              {PRIMARY_NAV.map((item) => {
                const Icon = ROUTE_ICONS[item.to];
                return (
                  <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={navLinkClass}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    <span className="hidden sm:inline">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <MoreMenu />
            <AccountSlot />
          </div>
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
