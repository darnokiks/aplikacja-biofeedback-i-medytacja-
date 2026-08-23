import { useEffect, useRef, useState } from 'react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import { startFocusSession, unlockAudio, type FocusMode, type FocusSessionHandle } from '../lib/audio';
import { logSession } from '../lib/storage';
import { formatMMSS } from '../hooks/useTimer';

const MODES: { id: FocusMode; name: string; icon: string; description: string }[] = [
  { id: 'focus', name: 'Focus', icon: '🎯', description: 'Fale beta (16 Hz) — koncentracja przy nauce i pracy.' },
  { id: 'relax', name: 'Relaks', icon: '🌿', description: 'Fale alfa (9 Hz) — wyciszenie i redukcja stresu.' },
  { id: 'sleep', name: 'Sen', icon: '🌙', description: 'Fale delta (3 Hz) — głęboki relaks przed snem.' },
];

export default function Focus() {
  const [mode, setMode] = useState<FocusMode>('focus');
  const [volume, setVolume] = useState(0.5);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationMin, setDurationMin] = useState(25);

  const handleRef = useRef<FocusSessionHandle | null>(null);
  const intervalRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const clear = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clear();
      handleRef.current?.stop();
    },
    [],
  );

  function start() {
    unlockAudio();
    handleRef.current?.stop();
    handleRef.current = startFocusSession(mode, volume);
    elapsedRef.current = 0;
    setElapsedSec(0);
    setRunning(true);
    clear();
    intervalRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
      if (elapsedRef.current >= durationMin * 60) {
        stop();
      }
    }, 1000);
  }

  function stop() {
    clear();
    handleRef.current?.stop();
    handleRef.current = null;
    setRunning(false);
    if (elapsedRef.current > 5) {
      const modeInfo = MODES.find((m) => m.id === mode)!;
      logSession({
        category: 'focus',
        label: `Dźwięki koncentracji — ${modeInfo.name}`,
        durationSec: elapsedRef.current,
        meta: { mode },
      });
    }
  }

  function onVolumeChange(v: number) {
    setVolume(v);
    handleRef.current?.setVolume(v);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Dźwięk i koncentracja"
        title="Focus / Relaks / Sen"
        description="Fale binauralne generowane na żywo w przeglądarce, wspierające koncentrację, relaks lub zasypianie. Używaj słuchawek, aby usłyszeć efekt binauralny."
      />

      <Card className="mb-6 border-sky-400/20 bg-sky-400/5">
        <p className="text-sm text-sky-200">
          🎧 Efekt fal binauralnych wymaga słuchawek — każde ucho odbiera nieco inną częstotliwość, a mózg
          &bdquo;słyszy&rdquo; różnicę między nimi. Nie stosuj przy epilepsji reagującej na dźwięki rytmiczne.
        </p>
      </Card>

      {!running ? (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MODES.map((m) => (
              <Card
                key={m.id}
                className={`cursor-pointer transition ${mode === m.id ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : ''}`}
              >
                <button className="w-full text-left" onClick={() => setMode(m.id)}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{m.icon}</span>
                    <h3 className="font-semibold">{m.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{m.description}</p>
                </button>
              </Card>
            ))}
          </div>

          <Card className="mx-auto max-w-xl">
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                  <span>Głośność</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                  <span>Czas sesji</span>
                  <span>{durationMin} min</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
              <Button className="w-full" onClick={start}>
                Rozpocznij dźwięk
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-10">
          <Pill tone="accent">{MODES.find((m) => m.id === mode)!.name}</Pill>
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/20">
            <div className="absolute inset-6 rounded-full border border-[var(--color-primary)]/30" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />
            <p className="text-4xl font-bold tabular-nums">{formatMMSS(elapsedSec)}</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
              <span>Głośność</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
          </div>
          <Button variant="secondary" onClick={stop}>
            Zatrzymaj
          </Button>
        </div>
      )}
    </div>
  );
}
