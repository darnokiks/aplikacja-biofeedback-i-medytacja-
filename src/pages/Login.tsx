import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, SectionTitle } from '../components/ui';
import { GoogleIcon, FacebookIcon, XIcon } from '../components/BrandIcons';
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
  GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
  type AuthProvider,
} from '../lib/auth';

function ProviderButton({
  icon,
  label,
  onClick,
  loading,
  configured,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  configured: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[var(--color-surface-2)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      <span>{loading ? 'Łączenie...' : label}</span>
      {!configured && (
        <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          wymaga konfiguracji
        </span>
      )}
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  async function handle(provider: AuthProvider) {
    setError('');
    setLoading(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else if (provider === 'facebook') await signInWithFacebook();
      else signInWithTwitter();
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zalogować.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <SectionTitle
        eyebrow="Konto"
        title="Zaloguj się"
        description="Logowanie służy tylko do personalizacji interfejsu (imię, awatar) w tej przeglądarce. Twoje dane treningowe zawsze zostają lokalnie na tym urządzeniu — ta aplikacja nie ma backendu ani chmury."
      />
      <Card className="space-y-3">
        <ProviderButton
          icon={<GoogleIcon />}
          label="Kontynuuj z Google"
          onClick={() => handle('google')}
          loading={loading === 'google'}
          configured={!!GOOGLE_CLIENT_ID}
        />
        <ProviderButton
          icon={<FacebookIcon />}
          label="Kontynuuj z Facebookiem"
          onClick={() => handle('facebook')}
          loading={loading === 'facebook'}
          configured={!!FACEBOOK_APP_ID}
        />
        <ProviderButton
          icon={<XIcon />}
          label="Kontynuuj z X"
          onClick={() => handle('twitter')}
          loading={loading === 'twitter'}
          configured={false}
        />

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <p className="flex items-start gap-2 pt-1 text-xs text-[var(--color-muted)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Przyciski oznaczone „wymaga konfiguracji” potrzebują własnego klucza dostawcy (Client
            ID/App ID) wklejonego w <code className="text-[var(--color-text)]">src/lib/auth.ts</code> — instrukcje w
            README.
          </span>
        </p>
      </Card>
    </div>
  );
}
