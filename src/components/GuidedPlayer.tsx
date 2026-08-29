import { useEffect, useRef, useState } from 'react';
import { Button, Pill, ProgressRing } from './ui';
import { playBeep, playChime } from '../lib/audio';
import { speakNarration, stopNarration } from '../lib/narration';

export interface GuidedPhase {
  /** Stabilny identyfikator frazy — pozwala podmienić syntezę mowy na prawdziwe nagranie. */
  id: string;
  title: string;
  instruction: string;
  durationSec: number;
}

export function GuidedPlayer({
  phases,
  voiceOn,
  onComplete,
  onExit,
}: {
  phases: GuidedPhase[];
  voiceOn: boolean;
  onComplete: (totalElapsedSec: number) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0]?.durationSec ?? 0);
  const [paused, setPaused] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const secondsRef = useRef(phases[0]?.durationSec ?? 0);
  const elapsedRef = useRef(0);

  const clear = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  function tick() {
    secondsRef.current -= 1;
    elapsedRef.current += 1;
    setSecondsLeft(secondsRef.current);
    if (secondsRef.current <= 0) {
      clear();
      goToPhase(index + 1);
    }
  }

  function runInterval() {
    clear();
    intervalRef.current = window.setInterval(tick, 1000);
  }

  function goToPhase(i: number) {
    if (i >= phases.length) {
      clear();
      stopNarration();
      playChime();
      onComplete(elapsedRef.current);
      return;
    }
    setIndex(i);
    const dur = phases[i].durationSec;
    secondsRef.current = dur;
    setSecondsLeft(dur);
    playBeep(700, 0.08, 0.16);
    if (voiceOn) speakNarration(phases[i].id, phases[i].instruction);
    runInterval();
  }

  useEffect(() => {
    goToPhase(0);
    return () => {
      clear();
      stopNarration();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePause() {
    if (paused) {
      setPaused(false);
      runInterval();
    } else {
      setPaused(true);
      clear();
      stopNarration();
    }
  }

  function skip() {
    clear();
    stopNarration();
    goToPhase(index + 1);
  }

  const phase = phases[index];
  if (!phase) return null;
  const progress = 1 - secondsLeft / phase.durationSec;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <Pill tone="accent">
        Krok {index + 1} / {phases.length}
      </Pill>
      <ProgressRing progress={progress} size={240}>
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums">{secondsLeft}s</p>
        </div>
      </ProgressRing>
      <div className="max-w-md text-center">
        <h3 className="text-xl font-semibold text-[var(--color-text)]">{phase.title}</h3>
        <p className="mt-2 text-[var(--color-muted)]">{phase.instruction}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onExit}>
          Zakończ
        </Button>
        <Button variant="secondary" onClick={togglePause}>
          {paused ? 'Wznów' : 'Pauza'}
        </Button>
        <Button variant="secondary" onClick={skip}>
          Pomiń
        </Button>
      </div>
    </div>
  );
}
