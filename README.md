# Spokój — medytacja, oddech i biofeedback

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
- **Biofeedback** — eksperymentalny pomiar tętna z kamery (rPPG) oraz pacer oddechowy (koherentny, pudełkowy, 4-7-8).
- **Postępy** — historia sesji, passa dni, statystyki i wykres aktywności.

## Uwagi dotyczące bezpieczeństwa

Aplikacja ma charakter edukacyjno-relaksacyjny i **nie zastępuje porady medycznej**. Moduł biofeedback nie jest
urządzeniem medycznym — pomiar tętna z kamery jest orientacyjny. Techniki oddechowe (zwłaszcza Wim Hof) należy
wykonywać w bezpiecznej pozycji, nigdy w wodzie ani podczas prowadzenia pojazdu.

## Uruchomienie

```bash
npm install
npm run dev       # tryb deweloperski
npm run build     # build produkcyjny
npm run preview   # podgląd builda produkcyjnego
```

## Stos technologiczny

React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7. Dźwięki (dzwonki, tony, binaural beats) generowane są
w locie przez Web Audio API — bez zewnętrznych plików audio. Narracja głosowa korzysta z wbudowanego w przeglądarkę
Web Speech API (`speechSynthesis`).
