import { Link } from 'react-router-dom';
import { Card, Pill, SectionTitle } from '../components/ui';
import { getStreak, getTotalMinutes, getSessions } from '../lib/storage';

const MODULES = [
  {
    to: '/oddech',
    icon: '🌬️',
    title: 'Oddech Wima Hofa',
    description: 'Rundy głębokich oddechów, zatrzymanie i oddech odzyskujący — zwiększ energię i odporność na stres.',
    tag: 'Oddech',
  },
  {
    to: '/jacobson',
    icon: '🧎',
    title: 'Trening Jacobsona',
    description: 'Progresywna relaksacja mięśni — naprzemienne napinanie i rozluźnianie grup mięśniowych z narracją głosową.',
    tag: 'Relaksacja',
  },
  {
    to: '/schultz',
    icon: '🕯️',
    title: 'Trening autogenny Schultza',
    description: 'Sześć klasycznych formuł: ciężar, ciepło, serce, oddech, brzuch, chłodne czoło.',
    tag: 'Relaksacja',
  },
  {
    to: '/medytacja',
    icon: '🧘',
    title: 'Techniki medytacji',
    description: 'Uważność, skan ciała, liczenie oddechów i życzliwość — z timerem i dzwonkiem interwałowym.',
    tag: 'Medytacja',
  },
  {
    to: '/focus',
    icon: '🎧',
    title: 'Dźwięki koncentracji',
    description: 'Fale binauralne i szum tła do trybów Focus / Relaks / Sen — jak w brain.fm, generowane na żywo.',
    tag: 'Dźwięk',
  },
  {
    to: '/swiatlo',
    icon: '✨',
    title: 'Podróż światła',
    description: 'Łagodnie pulsujące światło w rytmie oddechu, inspirowane light journey (np. Lumenate) — bez migotania.',
    tag: 'Światło',
  },
  {
    to: '/gry',
    icon: '🧠',
    title: 'Trening mózgu',
    description: 'Gry poznawcze w stylu Lumosity: czas reakcji, pamięć i n-back — trenuj koncentrację i pamięć roboczą.',
    tag: 'Kognitywistyka',
  },
  {
    to: '/biofeedback',
    icon: '❤️',
    title: 'Biofeedback',
    description: 'Pomiar tętna z kamery i oddech synchronizowany z rytmem serca — poznaj swój stan fizjologiczny.',
    tag: 'Biofeedback',
  },
  {
    to: '/urzadzenia',
    icon: '🔧',
    title: 'Urządzenia',
    description: 'Sparuj czujnik tętna (np. Polar) lub headset EEG (Muse, OpenBCI Ganglion) przez Bluetooth.',
    tag: 'Sprzęt',
  },
  {
    to: '/postepy',
    icon: '📈',
    title: 'Postępy',
    description: 'Historia sesji, passa dni i statystyki wszystkich modułów w jednym miejscu.',
    tag: 'Statystyki',
  },
];

export default function Home() {
  const streak = getStreak();
  const minutes = getTotalMinutes();
  const sessionsCount = getSessions().length;

  return (
    <div>
      <SectionTitle
        eyebrow="Witaj ponownie"
        title="Twoje centrum spokoju i koncentracji"
        description="Wybierz technikę oddechową, relaksacyjną lub poznawczą. Wszystko działa lokalnie w przeglądarce — Twoje dane zostają na Twoim urządzeniu."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Passa dni</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{streak} 🔥</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Łączny czas praktyki</p>
          <p className="mt-1 text-3xl font-bold">{minutes} min</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Ukończone sesje</p>
          <p className="mt-1 text-3xl font-bold">{sessionsCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="group">
            <Card className="h-full transition group-hover:border-[var(--color-primary)]/40 group-hover:-translate-y-0.5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-3xl">{m.icon}</span>
                <Pill tone="muted">{m.tag}</Pill>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{m.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">{m.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
