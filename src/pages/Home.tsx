import { Link } from 'react-router-dom';
import { Card, Pill, SectionTitle } from '../components/ui';
import { LogoMark } from '../components/Logo';
import { getStreak, getTotalMinutes, getSessions } from '../lib/storage';

interface ModuleDef {
  to: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
}

const CATEGORIES: { name: string; modules: ModuleDef[] }[] = [
  {
    name: 'Rutyna dnia',
    modules: [
      {
        to: '/budzik',
        icon: '⏰',
        title: 'Budzik i przypomnienia',
        description: 'Zaplanuj poranne wstawanie z automatycznym startem oddechu, albo ustaw przypomnienie o zadaniu.',
        tag: 'Rutyna',
      },
    ],
  },
  {
    name: 'Oddech i relaksacja',
    modules: [
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
    ],
  },
  {
    name: 'Medytacja i dźwięk',
    modules: [
      {
        to: '/medytacja',
        icon: '🧘',
        title: 'Techniki medytacji',
        description: 'Uważność, skan ciała, liczenie oddechów i życzliwość — z timerem i dzwonkiem interwałowym.',
        tag: 'Medytacja',
      },
      {
        to: '/muzyka',
        icon: '🎵',
        title: 'Biblioteka muzyki',
        description: 'Sześć generatywnych utworów ambientowych na relaks, sen, skupienie i energię.',
        tag: 'Dźwięk',
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
        description: 'Łagodnie pulsujące światło w rytmie oddechu, inspirowane light journey — plus tryb stroboskopu z zabezpieczeniami.',
        tag: 'Światło',
      },
    ],
  },
  {
    name: 'Trening poznawczy',
    modules: [
      {
        to: '/gry',
        icon: '🧠',
        title: 'Trening mózgu',
        description: 'Gry poznawcze w stylu Lumosity: czas reakcji, pamięć i n-back — trenuj koncentrację i pamięć roboczą.',
        tag: 'Kognitywistyka',
      },
    ],
  },
  {
    name: 'Biofeedback i sprzęt',
    modules: [
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
    ],
  },
  {
    name: 'Twój rozwój',
    modules: [
      {
        to: '/postepy',
        icon: '📈',
        title: 'Postępy',
        description: 'Historia sesji, passa dni i statystyki wszystkich modułów w jednym miejscu.',
        tag: 'Statystyki',
      },
    ],
  },
];

function ModuleCard({ m }: { m: ModuleDef }) {
  return (
    <Link to={m.to} className="group">
      <Card className="h-full transition group-hover:border-[var(--color-primary)]/40 group-hover:-translate-y-0.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 text-xl">
            {m.icon}
          </span>
          <Pill tone="muted">{m.tag}</Pill>
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">{m.title}</h3>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">{m.description}</p>
      </Card>
    </Link>
  );
}

export default function Home() {
  const streak = getStreak();
  const minutes = getTotalMinutes();
  const sessionsCount = getSessions().length;

  return (
    <div>
      <div className="relative mb-10 overflow-hidden">
        <div className="pointer-events-none absolute -left-10 -top-16 opacity-70 blur-[2px]">
          <LogoMark size={220} />
        </div>
        <div className="relative">
          <SectionTitle
            eyebrow="Witaj ponownie"
            title="Twoje centrum spokoju i koncentracji"
            description="Wybierz technikę oddechową, relaksacyjną lub poznawczą. Wszystko działa lokalnie w przeglądarce — Twoje dane zostają na Twoim urządzeniu."
          />
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat.name}>
            <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">{cat.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.modules.map((m) => (
                <ModuleCard key={m.to} m={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
