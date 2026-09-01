import { Card, SectionTitle } from '../components/ui';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        eyebrow="Prawne"
        title="Polityka prywatności"
        description="Ostatnia aktualizacja: wrzesień 2026. Ta aplikacja nie ma własnego serwera ani backendu — wszystko poniżej wynika bezpośrednio z tego, jak działa kod, a nie z osobnej infrastruktury zbierającej dane."
      />

      <div className="space-y-6 text-sm text-[var(--color-text)]">
        <Card>
          <h2 className="mb-2 font-semibold">Dane przechowywane na Twoim urządzeniu</h2>
          <p className="text-[var(--color-muted)]">
            Historia sesji, passa dni, wyniki gier, budziki i przypomnienia oraz ustawienia (np. wybrany dźwięk,
            głośność) są zapisywane wyłącznie lokalnie w pamięci przeglądarki (<code>localStorage</code>) na Twoim
            urządzeniu. Nigdy nie są wysyłane na żaden serwer — aplikacja go po prostu nie ma. Możesz je usunąć w
            dowolnym momencie przyciskiem „Wyczyść historię” na stronie Postępy albo czyszcząc dane strony w
            ustawieniach przeglądarki.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Kamera (moduł Biofeedback)</h2>
          <p className="text-[var(--color-muted)]">
            Moduł pomiaru tętna z kamery przetwarza obraz w czasie rzeczywistym wyłącznie lokalnie, w przeglądarce.
            Obraz z kamery nigdy nie jest zapisywany na dysk ani wysyłany nigdzie poza Twoje urządzenie. Dostęp do
            kamery wymaga Twojej wyraźnej zgody (systemowe okno przeglądarki) i możesz go cofnąć w dowolnym momencie.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Bluetooth (moduł Urządzenia)</h2>
          <p className="text-[var(--color-muted)]">
            Parowanie z czujnikiem tętna lub headsetem EEG (Muse, OpenBCI Ganglion) odbywa się bezpośrednio między
            Twoją przeglądarką a urządzeniem przez Web Bluetooth. Odczyty fizjologiczne są przetwarzane lokalnie i
            nigdzie nie wysyłane.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Logowanie (Google / Facebook)</h2>
          <p className="text-[var(--color-muted)]">
            Logowanie jest opcjonalne i służy wyłącznie do personalizacji interfejsu (wyświetlenie imienia i
            awatara). Dane konta (imię, e-mail, zdjęcie profilowe) pochodzą bezpośrednio od Google lub Facebooka i są
            zapisywane tylko lokalnie w Twojej przeglądarce — ta aplikacja nie ma serwera, na który mogłyby trafić.
            Samo logowanie przechodzi przez systemy Google/Facebook, które mają własne polityki prywatności:{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] underline"
            >
              polityka Google
            </a>
            ,{' '}
            <a
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] underline"
            >
              polityka Facebooka
            </a>
            . Możesz się wylogować w dowolnym momencie (kliknij swój awatar w nagłówku) — usuwa to lokalnie zapisane
            dane konta.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Powiadomienia</h2>
          <p className="text-[var(--color-muted)]">
            Powiadomienia budzika/przypomnień (w wersji natywnej, po instalacji ze sklepu) są planowane i wyświetlane
            wyłącznie lokalnie na Twoim urządzeniu — nie ma serwera wysyłającego powiadomienia push.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Czego nie robimy</h2>
          <p className="text-[var(--color-muted)]">
            Aplikacja nie zawiera analityki, trackerów reklamowych ani zewnętrznych skryptów śledzących. Nie
            sprzedajemy ani nie udostępniamy żadnych danych stronom trzecim — nie mamy do tego infrastruktury, bo
            wszystko działa lokalnie w Twojej przeglądarce.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Kontakt</h2>
          <p className="text-[var(--color-muted)]">
            Pytania dotyczące prywatności: [TODO — uzupełnij adres e-mail kontaktowy przed publikacją w sklepie].
          </p>
        </Card>
      </div>
    </div>
  );
}
