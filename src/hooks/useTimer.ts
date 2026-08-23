import { useCallback, useEffect, useRef, useState } from 'react';

/** Odliczanie w dół (sekundy) sterowane przez start/pause/reset. */
export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onDoneRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          onDoneRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = useCallback((onDone?: () => void) => {
    onDoneRef.current = onDone;
    setRunning(true);
  }, []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((seconds = initialSeconds) => {
    setRunning(false);
    setSecondsLeft(seconds);
  }, [initialSeconds]);

  return { secondsLeft, running, start, pause, reset, setSecondsLeft };
}

/** Sekundomierz w górę, w milisekundach (do pomiaru czasu reakcji itp.). */
export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    setElapsedMs(performance.now() - startRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startRef.current = performance.now() - elapsedMs;
    setRunning(true);
    frameRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const stop = useCallback(() => {
    setRunning(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setElapsedMs(0);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  return { elapsedMs, running, start, stop, reset };
}

export function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
