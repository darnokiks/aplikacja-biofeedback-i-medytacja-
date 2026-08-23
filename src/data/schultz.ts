export interface AutogenicFormula {
  id: string;
  name: string;
  text: string;
}

export const SCHULTZ_INTRO =
  'Połóż się lub usiądź wygodnie, dłonie ułóż swobodnie na udach. Zamknij oczy. Powtarzaj w myślach kolejne formuły, obserwując odczucia w ciele — bez wysiłku, jedynie bierną koncentracją.';

export const SCHULTZ_FORMULAS: AutogenicFormula[] = [
  {
    id: 'calm',
    name: 'Spokój',
    text: 'Jestem całkowicie spokojny. Jestem całkowicie spokojny i rozluźniony.',
  },
  {
    id: 'heaviness',
    name: 'Ciężar',
    text: 'Moje ramiona i nogi są całkowicie ciężkie. Całe ciało staje się przyjemnie ciężkie.',
  },
  {
    id: 'warmth',
    name: 'Ciepło',
    text: 'Moje ramiona i nogi są przyjemnie ciepłe. Ciepło rozlewa się po całym ciele.',
  },
  {
    id: 'heart',
    name: 'Serce',
    text: 'Moje serce bije spokojnie i miarowo.',
  },
  {
    id: 'breath',
    name: 'Oddech',
    text: 'Oddycham całkowicie spokojnie. To oddech oddycha mną, bez wysiłku.',
  },
  {
    id: 'abdomen',
    name: 'Splot słoneczny',
    text: 'Moje splot słoneczny, w okolicy brzucha, promieniuje przyjemnym ciepłem.',
  },
  {
    id: 'forehead',
    name: 'Czoło',
    text: 'Moje czoło jest przyjemnie chłodne i lekkie.',
  },
];

export const SCHULTZ_RETURN =
  'Powoli wracamy. Zaciśnij mocno obie pięści, napnij ramiona. Weź głęboki, energiczny wdech. Otwórz oczy, gdy poczujesz się gotowy.';
