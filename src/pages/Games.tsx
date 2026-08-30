import { Link } from 'react-router-dom';
import { Zap, Puzzle, Repeat, type LucideIcon } from 'lucide-react';
import { Card, Pill, SectionTitle } from '../components/ui';
import { getBestScore } from '../lib/storage';

const GAMES: {
  to: string;
  icon: LucideIcon;
  name: string;
  description: string;
  scoreKey: string;
  scoreLabel: (v: number) => string;
  lowerIsBetter: boolean;
}[] = [
  {
    to: '/gry/reakcja',
    icon: Zap,
    name: 'Czas reakcji',
    description: 'Kliknij, gdy tylko ekran zmieni kolor na zielony. Mierzymy Twój czas reakcji w milisekundach.',
    scoreKey: 'reaction',
    scoreLabel: (v: number) => `${v} ms (najlepszy)`,
    lowerIsBetter: true,
  },
  {
    to: '/gry/pamiec',
    icon: Puzzle,
    name: 'Sekwencje pamięciowe',
    description: 'Zapamiętaj i powtórz coraz dłuższą sekwencję podświetlanych pól — trening pamięci roboczej.',
    scoreKey: 'memory',
    scoreLabel: (v: number) => `${v} pól (rekord)`,
    lowerIsBetter: false,
  },
  {
    to: '/gry/nback',
    icon: Repeat,
    name: 'N-Back',
    description: 'Klasyczny trening pamięci roboczej — wskaż, gdy obecna pozycja powtarza się sprzed N kroków.',
    scoreKey: 'nback',
    scoreLabel: (v: number) => `${v}% trafień (rekord)`,
    lowerIsBetter: false,
  },
];

export default function Games() {
  return (
    <div>
      <SectionTitle
        eyebrow="Trening poznawczy"
        title="Gry treningu mózgu"
        description="Krótkie, naukowo inspirowane ćwiczenia poznawcze w stylu Lumosity — koncentracja, pamięć robocza i szybkość reakcji."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const best = getBestScore(g.scoreKey, g.lowerIsBetter ? 'min' : 'max');
          return (
            <Link key={g.to} to={g.to} className="group">
              <Card className="h-full transition group-hover:border-[var(--color-primary)]/40 group-hover:-translate-y-0.5">
                <div className="mb-3 flex items-center justify-between">
                  <g.icon className="h-7 w-7 text-[var(--color-primary)]" aria-hidden />
                  {best !== null && <Pill tone="accent">{g.scoreLabel(best)}</Pill>}
                </div>
                <h3 className="text-lg font-semibold">{g.name}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-muted)]">{g.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
