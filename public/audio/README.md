# Repozytorium muzyki i nagrań głosowych

To jest miejsce na prawdziwe pliki audio — nagrania głosowe do medytacji prowadzonych oraz
muzykę do biblioteki ambientowej. Wszystko w aplikacji działa już teraz bez tych plików
(synteza mowy przeglądarki + w 100% generowana muzyka), więc dodawanie ich jest opcjonalne
i bezpieczne: brakujący lub uszkodzony plik zawsze cicho wraca do wersji syntetycznej.

```
public/audio/
├── narration/   ← nagrania głosowe (medytacje prowadzone, instrukcje)
└── music/       ← muzyka (pliki .mp3 dla biblioteki ambientowej)
```

## Jak dodać nagranie głosowe

1. Nagraj lub zleć nagranie frazy (własny głos, lektor, albo płatny TTS jak ElevenLabs —
   to środowisko nie ma do niego dostępu, więc trzeba to zrobić poza nim).
2. Zapisz plik jako `public/audio/narration/<id>.mp3` — dokładna nazwa ma znaczenie, patrz
   pełna lista ID niżej.
3. Dopisz wpis do `AUDIO_MANIFEST` w `src/lib/narration.ts`:
   ```ts
   const AUDIO_MANIFEST: Record<string, string> = {
     'wimhof.hold-start': '/audio/narration/wimhof.hold-start.mp3',
   };
   ```
4. Gotowe — `speakNarration(id, text)` automatycznie odtworzy plik zamiast syntezy mowy.
   Nie trzeba dodawać wszystkich naraz: brakujące ID po prostu nadal korzystają z TTS.

### Pełna lista ID nagrań głosowych

Identyfikatory są stabilne (patrz komentarz w `narration.ts`) — to jest umowa nazewnicza
między treścią a plikami audio, niezależna od tego, jak zmieni się tekst instrukcji.

**Oddech Wima Hofa** (`src/pages/WimHof.tsx`)
- `wimhof.hold-start`
- `wimhof.recovery-start`

**Trening Jacobsona** (`src/data/jacobson.ts`) — wzorzec `jacobson.<grupa>.tense` / `.relax`
dla każdej z 12 grup mięśniowych, plus wstęp i zakończenie:
- `jacobson.intro`, `jacobson.outro`
- `jacobson.hands.tense`, `jacobson.hands.relax`
- `jacobson.biceps.tense`, `jacobson.biceps.relax`
- `jacobson.forehead.tense`, `jacobson.forehead.relax`
- `jacobson.eyes.tense`, `jacobson.eyes.relax`
- `jacobson.jaw.tense`, `jacobson.jaw.relax`
- `jacobson.neck.tense`, `jacobson.neck.relax`
- `jacobson.shoulders.tense`, `jacobson.shoulders.relax`
- `jacobson.chest.tense`, `jacobson.chest.relax`
- `jacobson.abdomen.tense`, `jacobson.abdomen.relax`
- `jacobson.glutes.tense`, `jacobson.glutes.relax`
- `jacobson.thighs.tense`, `jacobson.thighs.relax`
- `jacobson.calves.tense`, `jacobson.calves.relax`

**Trening autogenny Schultza** (`src/data/schultz.ts`):
- `schultz.intro`, `schultz.return`
- `schultz.calm`, `schultz.heaviness`, `schultz.warmth`, `schultz.heart`, `schultz.breath`,
  `schultz.abdomen`, `schultz.forehead`

**Techniki medytacji** (`src/data/meditations.ts`) — wzorzec `meditation.<technika>.intro`,
`.step1`…`.step5`, `.outro` dla każdej z 4 technik:
- `meditation.mindfulness.intro` / `.step1`…`.step5` / `.outro`
- `meditation.bodyscan.intro` / `.step1`…`.step5` / `.outro`
- `meditation.counting.intro` / `.step1`…`.step5` / `.outro`
- `meditation.metta.intro` / `.step1`…`.step5` / `.outro`

Jeśli dodasz nową technikę/grupę/formułę w danych źródłowych, jej ID nagrania powstaje
automatycznie wg tego samego wzorca — nie trzeba nic dodatkowo konfigurować.

**Format:** MP3, głos wyraźny i spokojny, tempo dopasowane do czasu trwania danej fazy
(zobacz `durationSec` w komponentach — zbyt długie nagranie zostanie ucięte końcem fazy).
Znormalizuj głośność między plikami, żeby przejścia między frazami nie "skakały".

## Jak dodać muzykę

1. Przygotuj plik audio (własna kompozycja, nagranie z jasną licencją na użycie komercyjne,
   albo zamówiona kompozycja — **nie wrzucaj tu niczego bez pewności co do licencji**).
2. Zapisz jako `public/audio/music/<id>.mp3`, gdzie `<id>` to ID utworu z `AMBIENT_TRACKS`
   w `src/lib/audio.ts`:
   - `ocean-depth` — Głębia oceanu
   - `dawn` — Świt
   - `deep-silence` — Cisza głębin
   - `golden-ray` — Złoty promień
   - `forest-rain` — Deszcz w lesie
   - `heart-pulse` — Puls serca
3. Dopisz wpis do `MUSIC_MANIFEST` w `src/lib/audio.ts`:
   ```ts
   const MUSIC_MANIFEST: Record<string, string> = {
     'ocean-depth': '/audio/music/ocean-depth.mp3',
   };
   ```
4. Gotowe — `startAmbientTrack(id)` odtworzy nagranie w pętli zamiast generować pad
   syntetycznie. Używane jest na stronach „Biblioteka muzyki" (`/muzyka`) i jako muzyka tła
   w module Wim Hof. Plik powinien się bezszwowo zapętlać (dopasuj początek/koniec).

Nowy utwór, którego nie ma jeszcze w `AMBIENT_TRACKS`, wymaga dopisania go tam jako osobnego
wpisu (z `id`, `name`, `mood`, opisem i parametrami syntezy — te ostatnie są używane tylko,
gdy nagranie akurat nie jest dostępne, więc mogą być przybliżone).

## Licencja i pochodzenie plików

Ta aplikacja celowo zaczęła jako w 100% syntetyczna (bez próbek/licencji), żeby uniknąć
problemów prawnych. Każdy plik wrzucony tutaj musi mieć jasne, udokumentowane prawo do
użycia w aplikacji (własna twórczość, zlecenie z przeniesieniem praw, albo licencja
wprost dopuszczająca użycie komercyjne/dystrybucję w apce mobilnej). Nie kopiuj muzyki ani
nagrań z internetu bez sprawdzenia licencji.
