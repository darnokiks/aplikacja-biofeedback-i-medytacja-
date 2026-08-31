import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button, Card, Pill, ProgressRing, SectionTitle } from '../components/ui';
import { GuidedPlayer, type GuidedPhase } from '../components/GuidedPlayer';
import { EducationPanel } from '../components/EducationPanel';
import { VoiceTestButton } from '../components/VoiceTestButton';
import { MEDITATION_TECHNIQUES, type MeditationTechnique } from '../data/meditations';
import { logSession } from '../lib/storage';
import { playBell, playChime, unlockAudio } from '../lib/audio';
import { formatMMSS } from '../hooks/useTimer';

type Mode = 'guided' | 'silent';

function buildPhases(technique: MeditationTechnique, totalMinutes: number): GuidedPhase[] {
  const introSec = 15;
  const outroSec = 15;
  const contentSec = Math.max(totalMinutes * 60 - introSec - outroSec, technique.script.length * 15);
  const perLine = Math.round(contentSec / technique.script.length);
  return [
    { id: `meditation.${technique.id}.intro`, title: 'Przygotowanie', instruction: technique.intro, durationSec: introSec },
    ...technique.script.map((line, i) => ({
      id: `meditation.${technique.id}.step${i + 1}`,
      title: `Krok ${i + 1}`,
      instruction: line,
      durationSec: perLine,
    })),
    { id: `meditation.${technique.id}.outro`, title: 'Zakończenie', instruction: technique.outro, durationSec: outroSec },
  ];
}

export default function Meditation() {
  const [mode, setMode] = useState<Mode>('guided');

  return (
    <div>
      <SectionTitle
        eyebrow="Medytacja"
        title="Techniki medytacji"
        description="Wybierz prowadzoną medytację z narracją lub ciszę z dzwonkiem interwałowym."
      />

      <EducationPanel moduleId="meditation" />

      <div className="mb-6 inline-flex rounded-xl bg-[var(--color-surface-2)] p-1">
        <button
          onClick={() => setMode('guided')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'guided' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Prowadzona
        </button>
        <button
          onClick={() => setMode('silent')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'silent' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Cichy timer
        </button>
      </div>

      {mode === 'guided' ? <GuidedMeditation /> : <SilentTimer />}
    </div>
  );
}

function GuidedMeditation() {
  const [techniqueId, setTechniqueId] = useState(MEDITATION_TECHNIQUES[0].id);
  const [minutes, setMinutes] = useState(10);
  const [voiceOn, setVoiceOn] = useState(true);
  const [running, setRunning] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [done, setDone] = useState(false);

  const technique = MEDITATION_TECHNIQUES.find((t) => t.id === techniqueId)!;

  function start() {
    unlockAudio();
    setDone(false);
    setSessionKey((k) => k + 1);
    setRunning(true);
  }

  function handleComplete(totalElapsedSec: number) {
    setRunning(false);
    setDone(true);
    logSession({
      category: 'meditation',
      label: `Medytacja — ${technique.name}`,
      durationSec: totalElapsedSec,
      meta: { technique: technique.id },
    });
  }

  if (running) {
    return (
      <GuidedPlayer
        key={sessionKey}
        phases={buildPhases(technique, minutes)}
        voiceOn={voiceOn}
        onComplete={handleComplete}
        onExit={() => setRunning(false)}
      />
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <technique.icon className="mx-auto h-8 w-8 text-[var(--color-primary)]" aria-hidden />
        <p className="mt-2 text-lg font-semibold">Medytacja ukończona!</p>
        <p className="mt-1 text-[var(--color-muted)]">Zauważ swój obecny stan umysłu, zanim wrócisz do codziennych zajęć.</p>
        <Button className="mt-5" onClick={() => setDone(false)}>
          Wróć do wyboru
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MEDITATION_TECHNIQUES.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition ${techniqueId === t.id ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : ''}`}
          >
            <button className="text-left w-full" onClick={() => setTechniqueId(t.id)}>
              <div className="mb-2 flex items-center gap-2">
                <t.icon className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
                <h3 className="font-semibold">{t.name}</h3>
              </div>
              <p className="text-sm text-[var(--color-muted)]">{t.description}</p>
            </button>
          </Card>
        ))}
      </div>

      <Card className="mx-auto max-w-xl">
        <h3 className="mb-4 text-lg font-semibold">Ustawienia</h3>
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
              <span>Czas trwania</span>
              <span>{minutes} min</span>
            </div>
            <input type="range" min={5} max={30} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-[var(--color-primary)]" />
              Narracja głosowa (PL)
            </label>
            <VoiceTestButton />
          </div>
          <Button className="w-full" onClick={start}>
            Rozpocznij medytację
          </Button>
        </div>
      </Card>
    </div>
  );
}

type BellInterval = 0 | 5 | 10;

function SilentTimer() {
  const [minutes, setMinutes] = useState(10);
  const [bellInterval, setBellInterval] = useState<BellInterval>(5);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [totalSec, setTotalSec] = useState(minutes * 60);
  const [done, setDone] = useState(false);

  const secondsRef = useRef(minutes * 60);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const clear = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clear(), []);

  function tick() {
    secondsRef.current -= 1;
    elapsedRef.current += 1;
    setSecondsLeft(secondsRef.current);
    if (bellInterval > 0 && secondsRef.current > 0 && elapsedRef.current % (bellInterval * 60) === 0) {
      playBell(0.3);
    }
    if (secondsRef.current <= 0) {
      clear();
      playChime();
      setRunning(false);
      setDone(true);
      logSession({ category: 'meditation', label: 'Cicha medytacja z dzwonkiem', durationSec: elapsedRef.current });
    }
  }

  function start() {
    unlockAudio();
    setDone(false);
    secondsRef.current = minutes * 60;
    elapsedRef.current = 0;
    setSecondsLeft(secondsRef.current);
    setTotalSec(secondsRef.current);
    setRunning(true);
    setPaused(false);
    playBell(0.4);
    clear();
    intervalRef.current = window.setInterval(tick, 1000);
  }

  function togglePause() {
    if (paused) {
      setPaused(false);
      clear();
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      setPaused(true);
      clear();
    }
  }

  function stop() {
    clear();
    setRunning(false);
    if (elapsedRef.current > 10) {
      logSession({ category: 'meditation', label: 'Cicha medytacja (zakończona wcześniej)', durationSec: elapsedRef.current });
    }
  }

  if (running) {
    const progress = 1 - secondsLeft / totalSec;
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <Pill tone="accent">Cicha medytacja</Pill>
        <ProgressRing progress={progress} size={260}>
          <p className="text-5xl font-bold tabular-nums">{formatMMSS(secondsLeft)}</p>
        </ProgressRing>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={stop}>
            Zakończ
          </Button>
          <Button variant="secondary" onClick={togglePause}>
            {paused ? 'Wznów' : 'Pauza'}
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <Bell className="mx-auto h-8 w-8 text-[var(--color-primary)]" aria-hidden />
        <p className="mt-2 text-lg font-semibold">Sesja zakończona!</p>
        <Button className="mt-5" onClick={() => setDone(false)}>
          Wróć do ustawień
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <h3 className="mb-4 text-lg font-semibold">Ustawienia cichego timera</h3>
      <div className="space-y-5">
        <div>
          <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
            <span>Czas trwania</span>
            <span>{minutes} min</span>
          </div>
          <input type="range" min={1} max={60} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
        </div>
        <div>
          <p className="mb-2 text-sm text-[var(--color-muted)]">Dzwonek interwałowy</p>
          <div className="flex gap-2">
            {[0, 5, 10].map((v) => (
              <button
                key={v}
                onClick={() => setBellInterval(v as BellInterval)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  bellInterval === v ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                }`}
              >
                {v === 0 ? 'Brak' : `Co ${v} min`}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full" onClick={start}>
          Rozpocznij ciszę
        </Button>
      </div>
    </Card>
  );
}
