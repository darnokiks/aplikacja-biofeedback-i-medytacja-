// Logowanie przez zewnętrznych dostawców — wyłącznie po stronie klienta, zgodnie z architekturą
// całej aplikacji (bez backendu, bez własnych kont, patrz README). Zalogowanie służy TYLKO do
// personalizacji interfejsu (imię, awatar) w tej przeglądarce — nie ma tu żadnej weryfikacji
// serwerowej tożsamości ani synchronizacji danych w chmurze. Historia sesji, streak i wyniki gier
// nadal żyją wyłącznie w localStorage tego urządzenia, dokładnie tak jak reszta aplikacji.

// Włączenie logowania Google: https://console.cloud.google.com/apis/credentials -> "Create
// credentials" -> "OAuth client ID" -> typ "Web application" -> dodaj domenę, pod którą działa
// apka, do "Authorized JavaScript origins" -> wklej Client ID poniżej.
export const GOOGLE_CLIENT_ID = '';

// Włączenie logowania Facebook: https://developers.facebook.com/apps -> utwórz aplikację -> dodaj
// produkt "Facebook Login" -> w ustawieniach dodaj domenę apki do "Valid OAuth Redirect URIs" /
// "App Domains" -> wklej App ID poniżej.
export const FACEBOOK_APP_ID = '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (cb: (resp: { authResponse?: { accessToken: string } }) => void, opts: { scope: string }) => void;
      api: (path: string, params: { fields: string }, cb: (profile: FacebookProfile) => void) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FacebookProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

export type AuthProvider = 'google' | 'facebook' | 'twitter';

export interface AuthUser {
  provider: AuthProvider;
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

const USER_KEY = 'spokoj.auth.user.v1';
const AUTH_EVENT = 'spokoj:auth-change';

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user: AuthUser | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Subskrybuje zmiany stanu logowania (w tej i innych kartach). Zwraca funkcję czyszczącą. */
export function onAuthChange(cb: () => void): () => void {
  window.addEventListener(AUTH_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(AUTH_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function signOut() {
  setCurrentUser(null);
}

function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Nie udało się wczytać skryptu: ${src}`));
    document.head.appendChild(script);
  });
}

/** Dekoduje payload tokenu JWT bez weryfikacji podpisu — wystarczające do lokalnej personalizacji
 * interfejsu, ale to NIE jest bezpieczna weryfikacja tożsamości (do tego potrzebny byłby backend
 * sprawdzający podpis tokenu po stronie serwera). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

// --- Google: w pełni działające logowanie klient-klient, wystarczy wkleić Client ID powyżej. ---
export async function signInWithGoogle(): Promise<AuthUser> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Logowanie Google nie jest skonfigurowane — dodaj GOOGLE_CLIENT_ID w src/lib/auth.ts (patrz README).');
  }
  await loadScript('google-identity-script', 'https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    window.google!.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        try {
          const payload = decodeJwtPayload(response.credential);
          const user: AuthUser = {
            provider: 'google',
            id: String(payload.sub),
            name: String(payload.name ?? payload.email ?? 'Użytkownik Google'),
            email: payload.email ? String(payload.email) : undefined,
            avatarUrl: payload.picture ? String(payload.picture) : undefined,
          };
          setCurrentUser(user);
          resolve(user);
        } catch {
          reject(new Error('Nie udało się odczytać danych konta Google.'));
        }
      },
    });
    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error('Okno logowania Google zostało zablokowane albo pominięte. Spróbuj ponownie.'));
      }
    });
  });
}

// --- Facebook: w pełni działające logowanie klient-klient, wystarczy wkleić App ID powyżej. ---
export async function signInWithFacebook(): Promise<AuthUser> {
  if (!FACEBOOK_APP_ID) {
    throw new Error('Logowanie Facebook nie jest skonfigurowane — dodaj FACEBOOK_APP_ID w src/lib/auth.ts (patrz README).');
  }
  await new Promise<void>((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
      resolve();
    };
    loadScript('facebook-jssdk', 'https://connect.facebook.net/pl_PL/sdk.js').catch(reject);
  });
  return new Promise((resolve, reject) => {
    window.FB!.login((response) => {
      if (!response.authResponse) {
        reject(new Error('Logowanie Facebook zostało anulowane.'));
        return;
      }
      window.FB!.api('/me', { fields: 'name,email,picture' }, (profile) => {
        const user: AuthUser = {
          provider: 'facebook',
          id: profile.id,
          name: profile.name ?? 'Użytkownik Facebook',
          email: profile.email,
          avatarUrl: profile.picture?.data?.url,
        };
        setCurrentUser(user);
        resolve(user);
      });
    }, { scope: 'public_profile,email' });
  });
}

// --- X / Twitter ---
// Prawdziwe OAuth 2.0 (PKCE) dla X wymaga wymiany kodu autoryzacji na token przez endpoint
// api.twitter.com/2/oauth2/token, który nie wysyła nagłówków CORS pozwalających wywołać go
// bezpośrednio z przeglądarki — musi to zrobić backend. Ta aplikacja celowo go nie ma (patrz
// README), więc tego przycisku nie da się uczciwie podłączyć bez dodania choćby minimalnej
// funkcji serwerowej do samej wymiany tokenu. Zostawiamy go w interfejsie jako gotowe miejsce.
export function signInWithTwitter(): never {
  throw new Error(
    'Logowanie przez X wymaga backendu do wymiany tokenu (ograniczenie CORS po stronie X, nie tej aplikacji) — patrz README.',
  );
}
