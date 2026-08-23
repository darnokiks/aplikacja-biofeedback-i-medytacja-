export interface MuscleGroup {
  id: string;
  name: string;
  tenseInstruction: string;
  relaxInstruction: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'hands',
    name: 'Dłonie i przedramiona',
    tenseInstruction: 'Zaciśnij obie dłonie w pięści i napnij przedramiona najmocniej, jak potrafisz.',
    relaxInstruction: 'Rozluźnij dłonie. Poczuj różnicę między napięciem a rozluźnieniem.',
  },
  {
    id: 'biceps',
    name: 'Ramiona (biceps)',
    tenseInstruction: 'Zegnij ręce w łokciach i napnij bicepsy, jakbyś pokazywał muskuły.',
    relaxInstruction: 'Opuść ręce swobodnie i pozwól im całkowicie zwiotczeć.',
  },
  {
    id: 'forehead',
    name: 'Czoło',
    tenseInstruction: 'Unieś brwi wysoko do góry, marszcząc czoło.',
    relaxInstruction: 'Rozluźnij czoło. Poczuj, jak wygładza się skóra.',
  },
  {
    id: 'eyes',
    name: 'Oczy i policzki',
    tenseInstruction: 'Zmruż mocno oczy i napnij policzki.',
    relaxInstruction: 'Rozluźnij powieki i policzki. Twarz staje się miękka.',
  },
  {
    id: 'jaw',
    name: 'Usta i szczęka',
    tenseInstruction: 'Zaciśnij szczękę i mocno przyciśnij wargi do siebie.',
    relaxInstruction: 'Rozchyl lekko usta i pozwól szczęce opaść.',
  },
  {
    id: 'neck',
    name: 'Szyja',
    tenseInstruction: 'Delikatnie odchyl głowę do tyłu i napnij mięśnie szyi.',
    relaxInstruction: 'Wróć głową do neutralnej pozycji i rozluźnij szyję.',
  },
  {
    id: 'shoulders',
    name: 'Barki',
    tenseInstruction: 'Unieś barki w kierunku uszu i przytrzymaj napięcie.',
    relaxInstruction: 'Opuść barki nisko i swobodnie.',
  },
  {
    id: 'chest',
    name: 'Klatka piersiowa i plecy',
    tenseInstruction: 'Weź głęboki wdech, ściągnij łopatki do siebie i napnij plecy.',
    relaxInstruction: 'Wypuść powietrze powoli i rozluźnij klatkę piersiową.',
  },
  {
    id: 'abdomen',
    name: 'Brzuch',
    tenseInstruction: 'Napnij mięśnie brzucha, jakbyś przygotowywał się na uderzenie.',
    relaxInstruction: 'Rozluźnij brzuch. Oddychaj swobodnie, przeponowo.',
  },
  {
    id: 'glutes',
    name: 'Pośladki',
    tenseInstruction: 'Napnij mocno pośladki, unosząc lekko biodra.',
    relaxInstruction: 'Rozluźnij pośladki i pozwól biodrom opaść.',
  },
  {
    id: 'thighs',
    name: 'Uda',
    tenseInstruction: 'Napnij uda, dociskając kolana do siebie.',
    relaxInstruction: 'Rozluźnij uda całkowicie.',
  },
  {
    id: 'calves',
    name: 'Łydki i stopy',
    tenseInstruction: 'Skieruj palce stóp do siebie, napinając łydki.',
    relaxInstruction: 'Rozluźnij stopy i łydki. Poczuj ciężar nóg.',
  },
];

export const JACOBSON_INTRO =
  'Usiądź lub połóż się wygodnie. Zamknij oczy. Będziemy kolejno napinać i rozluźniać grupy mięśni, aby nauczyć ciało rozpoznawać różnicę między napięciem a relaksem.';

export const JACOBSON_OUTRO =
  'Poświęć chwilę, aby poczuć całkowite rozluźnienie w całym ciele. Kiedy będziesz gotów, powoli otwórz oczy.';
