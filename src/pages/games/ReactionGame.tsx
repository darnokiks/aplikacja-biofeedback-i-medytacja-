import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { Button, Card, SectionTitle } from '../../components/ui';
import { logGameScore, logSession, getBestScore } from '../../lib/storage';

type Stage = 'idle' | 'waiting' | 'ready' | 'tooSoon' | 'result';

const TRIALS = 5;

export default function ReactionGame() {
  const [stage, setStage] = useState<Stage>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const readyAtRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  function startTrial() {
    setStage('waiting');
    const delay = 1200 + Math.random() * 2800;
    timeoutRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      setStage('ready');
    }, delay);
  }

  function startGame() {
    setTimes([]);
    startTimeRef.current = Date.now();
    startTrial();
  }

  function handleClick() {
    if (stage === 'waiting') {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setStage('tooSoon');
      return;
    }
    if (stage === 'ready') {
      const reaction = Math.round(performance.now() - readyAtRef.current);
      setLastTime(reaction);
      const nextTimes = [...times, reaction];
      setTimes(nextTimes);
      if (nextTimes.length >= TRIALS) {
        finishGame(nextTimes);
      } else {
        setStage('result');
      }
      return;
    }
    if (stage === 'tooSoon') {
      startTrial();
      return;
    }
    if (stage === 'result') {
      startTrial();
    }
  }

  function finishGame(finalTimes: number[]) {
    setStage('idle');
    const best = Math.min(...finalTimes);
    const avg = Math.round(finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length);
    logGameScore('reaction', best);
    logSession({
      category: 'game',
      label: 'Czas reakcji',
      durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      meta: { bestMs: best, avgMs: avg },
    });
    setTimes(finalTimes);
    setLastTime(avg);
    setStage('result');
  }

  const isFinalResult = times.length >= TRIALS;
  const bestOverall = getBestScore('reaction', 'min');

  return (
    <div>
      <Link to="/gry" className="mb-4 inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← Wróć do gier
      </Link>
      <SectionTitle eyebrow="Trening poznawczy" title="Czas reakcji" description={`Wykonaj ${TRIALS} prób. Kliknij ekran, gdy tylko zmieni kolor na zielony.`} />

      {stage === 'idle' && times.length === 0 && (
        <Card className="mx-auto max-w-md text-center">
          {bestOverall !== null && <p className="mb-2 text-sm text-[var(--color-muted)]">Twój rekord: {bestOverall} ms</p>}
          <Button onClick={startGame}>Rozpocznij test</Button>
        </Card>
      )}

      {(stage === 'waiting' || stage === 'ready' || stage === 'tooSoon') && (
        <button
          onClick={handleClick}
          className={`mx-auto flex h-72 w-full max-w-xl select-none flex-col items-center justify-center rounded-2xl text-xl font-bold text-white transition-colors ${
            stage === 'ready' ? 'bg-emerald-500' : stage === 'tooSoon' ? 'bg-rose-500' : 'bg-slate-600'
          }`}
        >
          {stage === 'waiting' && 'Czekaj na zielony...'}
          {stage === 'ready' && 'KLIKNIJ TERAZ!'}
          {stage === 'tooSoon' && 'Za wcześnie! Kliknij, aby spróbować ponownie.'}
        </button>
      )}

      {stage === 'result' && (
        <Card className="mx-auto max-w-md text-center">
          {isFinalResult ? (
            <>
              <Flag className="mx-auto h-8 w-8 text-[var(--color-primary)]" aria-hidden />
              <p className="mt-2 text-lg font-semibold">Wynik: średnio {lastTime} ms</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Najlepsza próba: {Math.min(...times)} ms</p>
              <Button className="mt-5" onClick={startGame}>
                Zagraj ponownie
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Próba {times.length}/{TRIALS}: {lastTime} ms</p>
              <Button className="mt-4" onClick={startTrial}>
                Następna próba
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
