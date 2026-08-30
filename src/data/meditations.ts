import { Waves, Scan, ListOrdered, Heart, type LucideIcon } from 'lucide-react';

export interface MeditationTechnique {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  intro: string;
  script: string[];
  outro: string;
}

export const MEDITATION_TECHNIQUES: MeditationTechnique[] = [
  {
    id: 'mindfulness',
    name: 'Uważność oddechu',
    icon: Waves,
    description: 'Obserwuj naturalny oddech, łagodnie wracając uwagą, gdy umysł zaczyna błądzić.',
    intro: 'Usiądź wygodnie z wyprostowanymi plecami. Zamknij oczy lub skieruj wzrok łagodnie w dół.',
    script: [
      'Skieruj uwagę na oddech. Nie zmieniaj go — po prostu obserwuj, jak wchodzi i wychodzi.',
      'Zauważ, gdzie najwyraźniej czujesz oddech: w nozdrzach, klatce piersiowej lub brzuchu.',
      'Jeśli zauważysz, że myśli odpłynęły, delikatnie, bez oceniania, wróć uwagą do oddechu.',
      'Pozwól oddechowi płynąć swoim naturalnym rytmem. Jesteś tylko obserwatorem.',
      'Zauważ przestrzeń pomiędzy wdechem a wydechem — krótką chwilę ciszy.',
    ],
    outro: 'Powoli poszerz uwagę na całe ciało i dźwięki otoczenia. Kiedy będziesz gotów, otwórz oczy.',
  },
  {
    id: 'bodyscan',
    name: 'Skan ciała',
    icon: Scan,
    description: 'Przenoś uwagę kolejno przez części ciała, zauważając odczucia bez ich zmieniania.',
    intro: 'Połóż się lub usiądź wygodnie. Zamknij oczy i weź kilka spokojnych oddechów.',
    script: [
      'Skieruj uwagę na stopy. Zauważ wszelkie odczucia — ciepło, chłód, mrowienie, nacisk.',
      'Przenieś uwagę na łydki i uda. Pozwól im się rozluźnić z każdym wydechem.',
      'Zauważ brzuch i klatkę piersiową unoszące się i opadające z oddechem.',
      'Przenieś uwagę na dłonie, ramiona i barki. Rozluźnij je, jeśli są napięte.',
      'Na koniec zauważ szyję, twarz i czubek głowy. Poczuj całe ciało jako jedną całość.',
    ],
    outro: 'Poczuj ciało jako całość, spoczywające i rozluźnione. Delikatnie poruszaj palcami i otwórz oczy.',
  },
  {
    id: 'counting',
    name: 'Liczenie oddechów',
    icon: ListOrdered,
    description: 'Prosta technika koncentracji — licz kolejne oddechy od jednego do dziesięciu.',
    intro: 'Usiądź wygodnie. Będziemy liczyć oddechy, aby zakotwiczyć uwagę w chwili obecnej.',
    script: [
      'Wdychaj powietrze, a przy wydechu policz w myślach "jeden".',
      'Kontynuuj, licząc każdy kolejny wydech: dwa, trzy, cztery...',
      'Gdy dojdziesz do dziesięciu, zacznij liczenie od nowa, od jednego.',
      'Jeśli stracisz rachubę, to naturalne — po prostu zacznij liczyć od jednego ponownie.',
      'Pozwól liczeniu stać się cichym, spokojnym rytmem w tle.',
    ],
    outro: 'Odpuść liczenie i po prostu posiedź chwilę w ciszy, obserwując oddech.',
  },
  {
    id: 'metta',
    name: 'Życzliwość (metta)',
    icon: Heart,
    description: 'Kieruj ciepłe, życzliwe intencje do siebie, bliskich i wszystkich istot.',
    intro: 'Usiądź wygodnie, połóż dłoń na sercu, jeśli to pomaga poczuć ciepło i troskę.',
    script: [
      'Skieruj do siebie życzenia: "Obym był szczęśliwy. Obym był zdrowy. Obym był spokojny."',
      'Pomyśl o bliskiej osobie i powtórz: "Obyś był szczęśliwy. Obyś był zdrowy. Obyś był spokojny."',
      'Pomyśl o osobie neutralnej, np. sąsiedzie, i skieruj do niej te same życzenia.',
      'Jeśli czujesz się gotów, pomyśl o osobie trudnej i spróbuj skierować do niej odrobinę życzliwości.',
      'Na koniec skieruj życzenia do wszystkich istot: "Obyśmy wszyscy byli szczęśliwi i wolni od cierpienia."',
    ],
    outro: 'Poczuj ciepło życzliwości w klatce piersiowej. Kiedy będziesz gotów, powoli otwórz oczy.',
  },
];
