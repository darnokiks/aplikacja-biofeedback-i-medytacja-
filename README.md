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

Biblioteka muzyki ambientowej działa analogicznie: `startAmbientTrack()` w `src/lib/audio.ts` sprawdza
`MUSIC_MANIFEST` i odtwarza prawdziwy plik z `public/audio/music/<id>.mp3`, jeśli jest dostępny, w przeciwnym razie
generuje utwór w 100% syntetycznie. Oba manifesty są dziś puste — folder `public/audio/` to gotowe miejsce na
przyszłe nagrania i muzykę, z pełną listą oczekiwanych nazw plików w `public/audio/README.md`.

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

## Aplikacja mobilna (Android / iOS)

Projekt jest przygotowany jako PWA (instalowalna z przeglądarki, `manifest.webmanifest` + ikony w `public/icons`)
oraz opakowany w [Capacitor](https://capacitorjs.com) do budowy natywnych aplikacji. Szkielety projektów Android
(`android/`) i iOS (`ios/`) są już w repo — **budowanie natywnych binarek wymaga jednak narzędzi, których nie ma w
tym środowisku (sandboxie Claude Code)**: Android Studio + Android SDK dla Androida, oraz macOS + Xcode dla iOS.

Zanim opublikujesz w sklepach, zmień `appId` w `capacitor.config.ts` z placeholdera `com.example.spokoj` na docelowy,
unikalny identyfikator.

**Android** (wymaga [Android Studio](https://developer.android.com/studio) na dowolnym systemie):
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
