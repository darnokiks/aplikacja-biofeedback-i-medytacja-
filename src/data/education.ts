// Treści edukacyjne "po co i dlaczego" dla każdego modułu — czym jest dana metoda, skąd się
// wzięła i jakie są jej potencjalne korzyści. Teksty poniżej są gotowe od razu; miejsca na
// wideo/audio z wykładami są opcjonalne — patrz lib/education.ts i public/audio/README.md /
// public/video/README.md po instrukcję dodania własnych nagrań.

export interface EducationContent {
  /** Musi odpowiadać SessionCategory z lib/storage.ts oraz kluczom w manifestach wideo/audio. */
  id: string;
  title: string;
  whatIsIt: string;
  whyUseIt: string[];
  background: string;
}

export const EDUCATION: Record<string, EducationContent> = {
  wimhof: {
    id: 'wimhof',
    title: 'Po co oddech Wima Hofa?',
    whatIsIt:
      'To rytmiczna hiperwentylacja (rundy głębokich, szybkich oddechów) naprzemiennie z zatrzymaniem oddechu na wydechu i krótkim oddechem odzyskującym. Metodę spopularyzował Holender Wim Hof, ale podobne techniki oddechowe znane są od dawna w różnych tradycjach.',
    whyUseIt: [
      'Uczy świadomej kontroli nad oddechem i reakcją organizmu na stres.',
      'Krótkotrwała hiperwentylacja zmienia poziom CO2 we krwi, co część osób odczuwa jako przypływ energii i jasności umysłu.',
      'Rundy z zatrzymaniem oddechu trenują tolerancję na dyskomfort — podobnie jak trening fizyczny, ale w warstwie oddechowej.',
      'Badanie Kox i wsp. (2014, PNAS) pokazało, że osoby wytrenowane w tej metodzie potrafiły częściowo wpływać na odpowiedź swojego układu odpornościowego i nerwowego na wywołany eksperymentalnie stan zapalny — to wstępny, ale interesujący dowód na to, że technika ma mierzalny wpływ fizjologiczny.',
    ],
    background:
      'To nie jest terapia medyczna ani zamiennik leczenia. Efekty różnią się między osobami, a badań na dużą skalę wciąż jest niewiele. Zawsze wykonuj tę technikę siedząc lub leżąc, nigdy w wodzie ani podczas prowadzenia pojazdu.',
  },
  jacobson: {
    id: 'jacobson',
    title: 'Po co trening Jacobsona?',
    whatIsIt:
      'Progresywna relaksacja mięśni opracowana w latach 20. i 30. XX wieku przez amerykańskiego lekarza Edmunda Jacobsona. Polega na kolejnym, świadomym napinaniu i rozluźnianiu poszczególnych grup mięśniowych całego ciała.',
    whyUseIt: [
      'Uczy ciało rozpoznawać różnicę między napięciem a rozluźnieniem — wiele osób chronicznie spiętych nawet tego nie zauważa.',
      'To jedna z najlepiej przebadanych technik relaksacyjnych — stosowana klinicznie pomocniczo przy lęku, bezsenności i napięciowych bólach głowy.',
      'Nie wymaga wyobraźni ani wizualizacji jak medytacja — działa przez konkretne, fizyczne doznanie, co bywa łatwiejsze dla początkujących.',
      'Regularna praktyka obniża podstawowy poziom napięcia mięśniowego z czasem, nie tylko podczas samej sesji.',
    ],
    background:
      'Jacobson sam nazywał to podejście "relaksacją naukową" — jego oryginalny protokół trwał tygodnie i obejmował dziesiątki sesji. Skrócone, popularne wersje (jak ta w aplikacji) są łatwiejsze do wdrożenia, ale efekt narasta z regularnością, nie z jedną sesją.',
  },
  schultz: {
    id: 'schultz',
    title: 'Po co trening autogenny Schultza?',
    whatIsIt:
      'Metoda samosugestii opracowana przez niemieckiego psychiatrę Johannesa Heinricha Schultza w latach 30. XX wieku, inspirowana obserwacjami stanu hipnotycznego. Sześć formuł (ciężar, ciepło, serce, oddech, brzuch, chłodne czoło) powtarza się w myślach, biernie obserwując reakcję ciała.',
    whyUseIt: [
      'Aktywuje tzw. reakcję relaksacyjną — fizjologiczne przeciwieństwo reakcji "walcz lub uciekaj".',
      'W przeciwieństwie do Jacobsona nie wymaga ruchu ani napinania mięśni — dobra opcja, gdy chcesz ćwiczyć leżąc w łóżku albo w miejscu, gdzie nie możesz się ruszać.',
      'Bywa stosowany pomocniczo przy stresie, problemach ze snem i migrenach — zawsze jako uzupełnienie, nie zamiennik leczenia.',
      'Formuła "biernej koncentracji" (obserwuj, nie forsuj) to umiejętność przenosząca się też na inne obszary życia — mniej walki z własnym umysłem.',
    ],
    background:
      'Trening autogenny bywa nauczany w programach medycyny behawioralnej w wielu krajach europejskich. Pełne opanowanie metody (wg Schultza) zajmuje miesiące regularnej praktyki — kilka sesji w aplikacji to dopiero wprowadzenie do techniki.',
  },
  meditation: {
    id: 'meditation',
    title: 'Po co medytować?',
    whatIsIt:
      'W aplikacji znajdziesz cztery klasyczne, świeckie techniki: uważność oddechu, skan ciała, liczenie oddechów i życzliwość (metta) — każda pochodzi z tradycji kontemplacyjnych, ale jest tu prowadzona bez kontekstu religijnego.',
    whyUseIt: [
      'Program MBSR (Mindfulness-Based Stress Reduction) Jona Kabat-Zinna, oparty na podobnych technikach, jest jednym z najlepiej przebadanych programów redukcji stresu i bywa refundowany w części systemów opieki zdrowotnej.',
      'Regularna praktyka uważności wiąże się w badaniach z lepszą regulacją emocji i mniejszą reaktywnością na stresory.',
      'Skan ciała uczy zauważania sygnałów z ciała, zanim napięcie przerodzi się w ból czy wyczerpanie.',
      'Metta (życzliwość) w badaniach psychologii pozytywnej wiąże się ze zwiększonym poczuciem połączenia z innymi i mniejszą samokrytyką.',
    ],
    background:
      'Efekty medytacji budują się z regularnością — pojedyncza sesja rzadko daje trwałą zmianę, ale nawet krótkie, codzienne praktykowanie (5–10 minut) daje mierzalne efekty w badaniach po kilku tygodniach.',
  },
  focus: {
    id: 'focus',
    title: 'Po co dźwięki koncentracji i fale binauralne?',
    whatIsIt:
      'Gdy każde ucho słyszy nieco inną częstotliwość dźwięku (np. 200 Hz i 210 Hz), mózg "słyszy" trzeci, pulsujący ton odpowiadający różnicy między nimi (tu: 10 Hz) — to zjawisko fali binauralnej. Aplikacja generuje je na żywo dla trybów Focus, Relaks i Sen.',
    whyUseIt: [
      'Częstotliwość "dudnienia" dobrana jest tak, by odpowiadać pasmom fal mózgowych kojarzonym z danym stanem: beta (koncentracja), alfa (wyciszenie), delta (głęboki relaks/sen).',
      'Część osób zgłasza subiektywną poprawę koncentracji lub łatwiejsze wyciszenie przy używaniu tła dźwiękowego podczas pracy czy nauki — niezależnie od mechanizmu, stały szum/dźwięk w tle bywa po prostu pomocny w maskowaniu rozpraszających bodźców.',
      'Dowody naukowe na same fale binauralne są mieszane i częściowo kwestionowane — traktuj to jako przyjemne, bezpieczne narzędzie wspomagające, a nie potwierdzoną naukowo interwencję.',
    ],
    background:
      'Efekt binauralny wymaga słuchawek (każde ucho musi usłyszeć osobny sygnał). Nie używaj przy epilepsji reagującej na dźwięki rytmiczne.',
  },
  light: {
    id: 'light',
    title: 'Po co podróż światłem?',
    whatIsIt:
      'Łagodnie pulsujące światło w rytmie oddechu (tryb spokojny) albo prawdziwie migające światło w niskiej częstotliwości (tryb stroboskopu), inspirowane komercyjnymi aplikacjami "light journey". Rytmiczna stymulacja wzrokowa jest wykorzystywana w praktykach kontemplacyjnych i eksperymentach nad świadomością od dziesięcioleci.',
    whyUseIt: [
      'Tryb spokojny to przede wszystkim wizualny odpowiednik oddechu — pomaga skupić uwagę na tempie oddychania bez potrzeby liczenia.',
      'Rytmiczna stymulacja światłem w niskich częstotliwościach bywa opisywana jako wywołująca subiektywne wrażenie zmienionego stanu uwagi — mechanizm nie jest w pełni poznany, a dowody naukowe są ograniczone.',
      'To narzędzie do eksploracji własnej percepcji, nie zweryfikowana metoda terapeutyczna.',
    ],
    background:
      'Tryb stroboskopu niesie realne ryzyko wywołania napadu u osób z padaczką światłoczułą — ma wbudowane zabezpieczenia (limit częstotliwości, skrining, wyłącznik) opisane bezpośrednio na stronie modułu. Nie używaj przy migrenach świetlnych, w ciąży ani pod wpływem alkoholu/substancji.',
  },
  biofeedback: {
    id: 'biofeedback',
    title: 'Po co biofeedback?',
    whatIsIt:
      'Biofeedback to obserwowanie własnych sygnałów fizjologicznych (tu: tętna z kamery telefonu) w czasie rzeczywistym, żeby świadomie na nie wpływać — np. spowalniając oddech i patrząc, jak reaguje tętno.',
    whyUseIt: [
      'Pozwala zobaczyć na własne oczy, jak oddech wpływa na tętno — zjawisko nazywane zatokową arytmią oddechową (RSA): tętno rośnie przy wdechu i spada przy wydechu.',
      'Trening HRV (zmienności rytmu serca) oparty na podobnej zasadzie bywa stosowany pomocniczo w pracy nad regulacją stresu.',
      'Natychmiastowa informacja zwrotna ("widzę, że to działa") bywa silniejszym motywatorem do praktyki niż samo "zaufaj, że to pomaga".',
    ],
    background:
      'To nie jest urządzenie medyczne — pomiar z kamery telefonu jest orientacyjny i wrażliwy na ruch oraz oświetlenie. Do precyzyjnych pomiarów HRV służą dedykowane czujniki piersiowe (patrz moduł Urządzenia).',
  },
};
