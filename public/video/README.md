# Repozytorium filmów instruktażowych

Miejsce na prawdziwe pliki wideo pokazujące, jak wykonywać daną technikę. Każdy moduł ma sekcję
„Po co ta metoda?" (`src/components/EducationPanel.tsx`) z zakładką „Wideo" — dziś zawsze pokazuje
informację, że filmiku brak, bo to środowisko nie potrafi nagrać/wyprodukować wideo. Dodanie
pliku jest w pełni opcjonalne: reszta aplikacji działa bez tego już teraz.

```
public/video/
└── education/   ← filmiki instruktażowe, jeden na moduł
```

## Jak dodać film

1. Nagraj lub zleć krótki filmik instruktażowy (pokazujący wykonanie techniki krok po kroku).
2. Zapisz jako `public/video/education/<id>.mp4`, gdzie `<id>` to jeden z: `wimhof`, `jacobson`,
   `schultz`, `meditation`, `focus`, `light`, `biofeedback`.
3. Dopisz wpis do `LECTURE_VIDEO_MANIFEST` w `src/lib/education.ts`:
   ```ts
   const LECTURE_VIDEO_MANIFEST: Record<string, string> = {
     wimhof: '/video/education/wimhof.mp4',
   };
   ```
4. Gotowe — zakładka „Wideo" w panelu edukacyjnym danego modułu pokaże odtwarzacz `<video>`
   zamiast informacji o braku nagrania.

**Format:** MP4 (H.264), rozsądny rozmiar pliku (kompresja pod web, nie surowy zrzut z kamery) —
duże pliki wideo w `public/` trafiają bezpośrednio do builda i spowalniają pierwsze ładowanie
strony, na której są wypisane w kodzie (choć same pliki wideo ładują się leniwie, dopiero gdy
użytkownik otworzy zakładkę „Wideo").

## Licencja i pochodzenie plików

Tak jak przy muzyce (patrz `public/audio/README.md`) — wrzucaj tu tylko materiały, do których
masz jasne prawo (własne nagranie, zlecenie z przeniesieniem praw). Nie kopiuj filmów z internetu
bez sprawdzenia licencji.
