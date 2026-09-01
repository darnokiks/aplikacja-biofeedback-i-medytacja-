# Mental Wellness — medytacja, oddech i biofeedback

Aplikacja webowa (React + TypeScript + Vite) łącząca techniki relaksacyjne, oddechowe i medytacyjne z treningiem
poznawczym oraz prostym biofeedbackiem. Działa w całości w przeglądarce — bez backendu, bez kont użytkowników.
Dane (historia sesji, wyniki gier) zapisywane są lokalnie w `localStorage`.

## Moduły

- **Oddech Wima Hofa** — rundy głębokich oddechów, zatrzymanie oddechu i oddech odzyskujący, z konfigurowalną
  liczbą rund, tempem i narracją głosową.
- **Trening Jacobsona** — progresywna relaksacja mięśni: naprzemienne napinanie i rozluźnianie 12 grup mięśniowych.
- **Trening autogenny Schultza** — sześć klasycznych formuł autosugestii (ciężar, ciepło, serce, oddech, splot
  słoneczny, czoło) z fazą powrotu do czujności.
- **Techniki medytacji** — uważność oddechu, skan ciała, liczenie oddechów, życzliwość (metta) w wersji prowadzonej
  z narracją lub jako cichy timer z dzwonkiem interwałowym.
- **Focus / Relaks / Sen** — dźwięki koncentracji w stylu brain.fm: fale binauralne i szum tła generowane na żywo
  przez Web Audio API (wymagane słuchawki).
- **Trening mózgu** — gry poznawcze w stylu Lumosity: czas reakcji, sekwencje pamięciowe i N-back.
- **Podróż światła** — pulsujące światło w rytmie oddechu (tryb łagodny) oraz opcjonalny tryb stroboskopu z
  ograniczoną częstotliwością i zabezpieczeniami (patrz niżej), inspirowane light-journey (np. Lumenate).
- **Biofeedback** — eksperymentalny pomiar tętna z kamery (rPPG) oraz pacer oddechowy (koherentny, pudełkowy, 4-7-8).
- **Urządzenia** — parowanie prawdziwego sprzętu przez Web Bluetooth: dowolny czujnik tętna zgodny ze standardową
  usługą „Heart Rate" (np. Polar H10), headset EEG Muse 2/S (przez bibliotekę `muse-js`) oraz OpenBCI Ganglion
  (własna implementacja — patrz zastrzeżenie niżej). Wymaga Chrome/Edge na komputerze lub Androidzie; **nie działa
  w Safari na iOS ani w Firefoksie**, bo te przeglądarki nie implementują Web Bluetooth.
- **Biblioteka muzyki** — sześć generatywnych utworów ambientowych (relaks/sen/skupienie/energia), w 100%
  syntezowanych przez Web Audio API; wybór utworu jest też dostępny jako tło w Wim Hof i Podróży światła.
- **Budzik i przypomnienia** — alarmy (jednorazowe lub cykliczne, wybrane dni tygodnia) z opcjonalnym
  auto-startem porannej rutyny (np. oddechu Wima Hofa) po wyłączeniu, oraz osobne przypomnienia (jednorazowe/
  codzienne/tygodniowe). Patrz zastrzeżenie niżej — **niezawodne działanie z zablokowanym telefonem wymaga
  natywnej apki**, nie samej przeglądarki.
- **Postępy** — historia sesji, passa dni, statystyki i wykres aktywności.

## Budzik — dwie warstwy, świadomie

Żadna przeglądarka (w tym PWA) nie ma API pozwalającego niezawodnie „obudzić się o tej godzinie" przy zamkniętej
karcie czy zablokowanym ekranie — to fundamentalne ograniczenie platformy webowej, nie luka w tej implementacji.
Dlatego budzik działa w dwóch warstwach:

1. **`src/components/AlarmEngine.tsx`** — silnik pierwszoplanowy: sprawdza alarmy/przypomnienia co ~15s, działa
   tylko, gdy ta karta jest otwarta (i urządzenie nie śpi). Ma 10-minutowe okno tolerancji (a nie wymóg trafienia
   dokładnie w tę samą minutę), żeby przeładowanie strony czy chwilowe uśpienie karty nie powodowały przegapienia
   wyzwalacza. To jedyna warstwa aktywna w przeglądarce i w podglądzie Artifact.
2. **`src/lib/nativeAlarms.ts`** — po zbudowaniu natywnej apki (patrz sekcja "Aplikacja mobilna" niżej) budzik
   automatycznie przełącza się na `@capacitor/local-notifications`, czyli prawdziwe powiadomienia systemowe
   Androida/iOS, które działają nawet przy zablokowanym ekranie. Strona `/budzik` planuje powiadomienia w obu
   warstwach jednocześnie — na wersji webowej realnie działa tylko silnik pierwszoplanowy, na natywnej przejmują
   powiadomienia systemowe.

Auto-start porannej rutyny po wyłączeniu budzika jest obecnie podpięty tylko pod **Oddech Wima Hofa**
(`useLocation().state?.autoStart` w `src/pages/WimHof.tsx`) — dodanie tego do kolejnych modułów wymaga tej samej,
prostej zmiany w danym komponencie.

## Głos, narracja i muzyka

Narracja korzysta z `src/lib/narration.ts`, który dla każdej frazy sprawdza najpierw, czy istnieje prawdziwe
nagranie w `AUDIO_MANIFEST` (plik w `public/audio/narration/<id>.mp3`) — jeśli tak, odtwarza je; jeśli nie, korzysta
z syntezy mowy przeglądarki (`src/lib/tts.ts`, z heurystyką preferującą głosy sieciowe/neuronowe, gdy dostępne).
Identyfikatory fraz są stabilne (np. `jacobson.hands.tense`, `schultz.calm`, `wimhof.hold-start`) — żeby dodać
prawdziwe nagranie, wrzuć plik audio pod odpowiednią nazwą i dopisz wpis do `AUDIO_MANIFEST`. Ta aplikacja **nie
generuje ani nie zawiera nagrań prawdziwego ludzkiego głosu** — to wymaga albo nagrania własnego, albo płatnego
serwisu TTS (np. ElevenLabs), do którego to środowisko nie ma dostępu.

`speak()` w `src/lib/tts.ts` ma dwa obejścia udokumentowanych błędów Chrome, które potrafią sprawić, że synteza mowy
po cichu nic nie mówi: (1) `speechSynthesis.speak()` wywołane od razu po `cancel()` bywa zignorowane — każde
wywołanie jest teraz odłożone o ~60ms; (2) długie wypowiedzi bywają usypiane po ~15s bezczynności — w trakcie mowy
działa heartbeat co 5s wywołujący `resume()`. Jeśli mimo to synteza się nie powiedzie (np. przeglądarka nie ma
zainstalowanych żadnych głosów — zdarza się na minimalnych instalacjach Linuksa bez pakietu mowy), moduły z narracją
(Jacobson, Schultz, medytacja, Wim Hof) pokazują widoczny komunikat zamiast ciszy bez wyjaśnienia.

Biblioteka muzyki ambientowej działa analogicznie: `startAmbientTrack()` w `src/lib/audio.ts` sprawdza
`MUSIC_MANIFEST` i odtwarza prawdziwy plik z `public/audio/music/<id>.mp3`, jeśli jest dostępny, w przeciwnym razie
generuje utwór w 100% syntetycznie. Oba manifesty są dziś puste — folder `public/audio/` to gotowe miejsce na
przyszłe nagrania i muzykę, z pełną listą oczekiwanych nazw plików w `public/audio/README.md`.

## Treści edukacyjne ("po co dana metoda")

Każdy moduł (Wim Hof, Jacobson, Schultz, medytacja, Focus, Podróż światła, Biofeedback) ma teraz rozwijaną sekcję
„Po co ta metoda?" (`src/components/EducationPanel.tsx`, treści w `src/data/education.ts`) wyjaśniającą, czym jest
dana technika, skąd się wzięła i jakie są jej potencjalne korzyści — z odpowiednio ostrożnymi zastrzeżeniami tam,
gdzie dowody naukowe są ograniczone. Sekcja ma trzy zakładki:

- **Tekst** — gotowy od razu, napisany wprost w kodzie.
- **Wideo** i **Wykład audio** — miejsca na prawdziwe nagrania (`public/video/education/<id>.mp4` i
  `public/audio/lectures/<id>.mp3`), dziś puste; instrukcja dodania własnych plików jest w
  `public/video/README.md` i w sekcji „Jak dodać wykład audio" w `public/audio/README.md`. Bez tych plików
  zakładki po prostu pokazują informację, że nagrania jeszcze brak — reszta aplikacji działa bez zmian.

## Logowanie (Google / Facebook / X)

Strona `/logowanie` (i przycisk konta w nagłówku) obsługuje logowanie przez trzech dostawców, w całości po stronie
klienta — zgodnie z resztą aplikacji, **bez backendu i bez własnych kont**. Zalogowanie służy wyłącznie do
personalizacji interfejsu (imię, awatar w nagłówku); nie synchronizuje żadnych danych w chmurze — historia sesji,
streak i wyniki gier nadal żyją tylko w `localStorage` tego urządzenia.

- **Google i Facebook działają w pełni**, ale wymagają własnego klucza dostawcy — bez niego przycisk pokazuje
  „wymaga konfiguracji” i po kliknięciu zwraca czytelny błąd zamiast fałszywie udawać, że coś się dzieje:
  - Google: [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → „Create
    credentials” → „OAuth client ID” (typ „Web application”) → dodaj domenę do „Authorized JavaScript origins” →
    wklej Client ID do `GOOGLE_CLIENT_ID` w `src/lib/auth.ts`.
  - Facebook: [developers.facebook.com/apps](https://developers.facebook.com/apps) → nowa aplikacja → dodaj produkt
    „Facebook Login” → wklej App ID do `FACEBOOK_APP_ID` w `src/lib/auth.ts`.
  - Tożsamość z obu dostawców jest odczytywana wyłącznie po stronie przeglądarki (token Google jest dekodowany
    lokalnie, bez weryfikacji podpisu) — to świadomy kompromis pasujący do architektury „wszystko lokalnie”, a nie
    bezpieczne uwierzytelnienie serwerowe.
- **X (Twitter) nie jest podłączony i nie może być bez backendu.** Prawdziwe logowanie OAuth 2.0 wymaga wymiany
  kodu autoryzacji na token przez `api.twitter.com/2/oauth2/token`, który nie wysyła nagłówków CORS pozwalających
  wywołać go bezpośrednio z przeglądarki — to ograniczenie samego X, nie tej aplikacji. Przycisk zostaje w
  interfejsie jako gotowe miejsce do podłączenia, gdyby w przyszłości doszła choćby minimalna funkcja serwerowa do
  samej wymiany tokenu.

## Uwagi dotyczące bezpieczeństwa

Aplikacja ma charakter edukacyjno-relaksacyjny i **nie zastępuje porady medycznej**. Nie opisuj jej ani jej modułów
jako "leczniczych" czy terapeutycznych w treściach marketingowych — to nieprawdziwe twierdzenie medyczne. Moduł
biofeedback nie jest urządzeniem medycznym — pomiar tętna z kamery jest orientacyjny. Techniki oddechowe (zwłaszcza
Wim Hof) należy wykonywać w bezpiecznej pozycji, nigdy w wodzie ani podczas prowadzenia pojazdu.

**Moduł "Podróż światła" — tryb stroboskopu.** Ten tryb generuje prawdziwie migające światło (2–12 Hz) i celowo
ogranicza częstotliwość poniżej najbardziej ryzykownego dla padaczki światłoczułej pasma 15–20 Hz. Zawiera skrining
(kilka pytań przesiewowych zamiast jednego checkboxa), wyłącznik działający tylko przy przytrzymaniu (puszczenie
natychmiast zatrzymuje miganie), limit długości sesji i unikanie czerwieni/pełnego kontrastu. **To nie eliminuje
ryzyka, tylko je ogranicza.** Przed publicznym udostępnieniem tej funkcji (App Store/Google Play, szeroka publika)
warto:
- skonsultować treść ostrzeżeń i mechanizm zgody z prawnikiem (odpowiedzialność za treści migające różni się
  jurysdykcyjnie),
- sprawdzić aktualne wytyczne Apple App Review i Google Play dotyczące treści z migającym światłem — recenzenci
  sklepów czasem wymagają dodatkowych zabezpieczeń lub odrzucają taką funkcję,
- rozważyć niezależny przegląd/testy (np. zgodność z wytycznymi Harding FPA używanymi w telewizji).

**Moduł "Urządzenia" — OpenBCI Ganglion.** Oficjalne SDK OpenBCI dla Ganglion (`@openbci/ganglion`) to biblioteka
Node.js oparta o natywny Bluetooth i nie działa w przeglądarce, więc `src/lib/devices/ganglionEeg.ts` to własna
implementacja połączenia BLE. Warstwa połączenia, komendy start/stop i pakiety nieskompresowane/akcelerometr są
zaimplementowane pewnie na podstawie udokumentowanych, stabilnych faktów (UUID usługi/charakterystyk). Format
**skompresowanych** próbek EEG (18-bitowa kompresja delta) jest bitowo znacznie bardziej złożony i **nie został
zweryfikowany na prawdziwym urządzeniu** — takie pakiety są celowo zliczane jako „niezdekodowane", zamiast zgadywać
algorytm i prezentować niepewne dane jako pewny sygnał. Do dopracowania z fizycznym Ganglionem w ręku.

## Uruchomienie

```bash
npm install
npm run dev       # tryb deweloperski
npm run build     # build produkcyjny
npm run preview   # podgląd builda produkcyjnego
```

## Stały publiczny adres (GitHub Pages)

Aplikacja jest automatycznie budowana i publikowana pod stałym adresem przy każdym pushu do gałęzi
`claude/meditation-feedback-app-ctir2u` — patrz `.github/workflows/deploy-pages.yml` (build przez Vite +
`actions/deploy-pages`). Dzięki temu można ją otworzyć na telefonie i przetestować realne funkcje, których nie da
się sprawdzić w podglądzie Artifact: logowanie Google/Facebook (wymaga prawdziwej domeny w konfiguracji OAuth),
Web Bluetooth, kamerę i **budzik** (trzymając kartę otwartą w tle telefonu, patrz sekcja „Budzik" wyżej).

Jednorazowa czynność po stronie repo (nie da się tego zrobić z tej sesji): w ustawieniach repozytorium na GitHubie
wejdź w **Settings → Pages** i ustaw **Source: GitHub Actions**. Po wykonaniu tego kroku i pierwszym udanym
przebiegu workflow adres aplikacji pojawi się w zakładce **Actions** (w podsumowaniu przebiegu `deploy`) oraz w
**Settings → Pages** — zwykle ma postać `https://<nazwa-użytkownika>.github.io/<nazwa-repo>/`.

`base: './'` w `vite.config.ts` sprawia, że ta sama paczka działa poprawnie zarówno pod tym adresem (dowolna
głębokość ścieżki), jak i lokalnie oraz w WebView Capacitora — nie trzeba nic przestrajać między środowiskami.

## Aplikacja mobilna (Android / iOS)

Projekt jest przygotowany jako PWA (instalowalna z przeglądarki, `manifest.webmanifest` + ikony w `public/icons`)
oraz opakowany w [Capacitor](https://capacitorjs.com) do budowy natywnych aplikacji. Szkielety projektów Android
(`android/`) i iOS (`ios/`) są już w repo — **budowanie natywnych binarek wymaga jednak narzędzi, których nie ma w
tym środowisku (sandboxie Claude Code)**: Android Studio + Android SDK dla Androida, oraz macOS + Xcode dla iOS.

Zanim opublikujesz w sklepach, zmień `appId` w `capacitor.config.ts` z placeholdera `com.example.mentalwellness` na
docelowy, unikalny identyfikator, którym faktycznie chcesz się posługiwać w sklepie (reverse-DNS, np.
`com.twojafirma.mentalwellness`) — po pierwszej publikacji zmiana `appId` oznacza w praktyce nową aplikację, nie
aktualizację istniejącej.

### Publikacja w Google Play — checklist

To, co może zrobić Claude Code w tym środowisku (kod, konfiguracja, treści) jest już gotowe. Reszta wymaga Twojego
komputera i kont, do których to środowisko nie ma dostępu:

1. **Konto Google Play Console** — [play.google.com/console](https://play.google.com/console), jednorazowa opłata
   25 USD, weryfikacja tożsamości (może potrwać kilka dni).
2. **Android Studio** na Twoim komputerze — [developer.android.com/studio](https://developer.android.com/studio).
   `npm run android:open` buduje web app, synchronizuje z Capacitor i otwiera projekt.
3. **Docelowy `appId`** w `capacitor.config.ts` (patrz wyżej) — ustaw go raz, przed pierwszą publikacją.
4. **Podpisany klucz (keystore)** — w Android Studio: `Build > Generate Signed App Bundle/APK`. **Zapisz plik
   keystore i hasło w bezpiecznym miejscu (menedżer haseł, nie tylko dysk) — jego utrata oznacza, że nigdy więcej
   nie zaktualizujesz tej aplikacji pod tym samym wpisem w sklepie.**
5. **Polityka prywatności** — strona `/prywatnosc` w apce (`src/pages/Privacy.tsx`) jest gotowa i opisuje uczciwie,
   że wszystko działa lokalnie (bez backendu, bez analityki). Google Play wymaga publicznego URL-a do niej w
   ustawieniach wpisu — musisz najpierw wystawić apkę pod stałym adresem (patrz niżej), a przedtem uzupełnić
   placeholder adresu kontaktowego w tym pliku.
6. **Formularz "Data safety"** w Play Console — zadeklaruj zbierane dane zgodnie z tym, co faktycznie się dzieje:
   kamera (biofeedback, przetwarzana lokalnie), Bluetooth (dane fizjologiczne z czujnika/EEG, lokalnie), opcjonalne
   logowanie (imię/e-mail/awatar z Google/Facebook, zapisywane tylko lokalnie) — bez serwera, bez sprzedaży danych.
7. **Materiały do wpisu w sklepie** — ikona (już wygenerowana, `public/icons/`), zrzuty ekranu z różnych rozmiarów
   ekranu, grafika promocyjna, opis krótki/pełny, kategoria aplikacji.
8. **Ankieta oceny treści** (content rating) w Play Console — moduł stroboskopu (patrz uwaga niżej) może wymagać
   dodatkowej uwagi przy odpowiadaniu na pytania o migające/pulsujące światło.
9. Zbuduj podpisany **Android App Bundle (.aab)**, wgraj do Play Console, wypełnij wpis, wyślij do recenzji.

**Android**:
```bash
npm run android:open   # buduje web app, synchronizuje z Capacitor, otwiera Android Studio
# w Android Studio: Build > Generate Signed App Bundle/APK
```

**iOS** (wymaga Maca z zainstalowanym Xcode; opcjonalnie CI w chmurze jak Codemagic/EAS/GitHub Actions macOS, jeśli
nie masz Maca):
```bash
npm run ios:open       # buduje web app, synchronizuje z Capacitor, otwiera Xcode
# w Xcode: podpisz zespołem deweloperskim (Apple Developer Program, 99$/rok) i zarchiwizuj do App Store Connect
```

Po każdej zmianie w `src/` przed testowaniem na urządzeniu/emulatorze uruchom `npm run cap:sync`, żeby przekopiować
świeży build do natywnych projektów.

**Uwaga do publikacji:** oba sklepy (Apple App Store, Google Play) mają zasady dotyczące treści mogących wywołać
napady u osób światłoczułych — przed wysłaniem do recenzji sprawdź aktualne wytyczne obu platform dla modułu
stroboskopu (patrz sekcja bezpieczeństwa wyżej).

## Stos technologiczny

React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7. Dźwięki (dzwonki, tony, binaural beats) generowane są
w locie przez Web Audio API — bez zewnętrznych plików audio. Narracja głosowa korzysta z wbudowanego w przeglądarkę
Web Speech API (`speechSynthesis`).
