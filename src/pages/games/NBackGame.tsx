import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Pill, SectionTitle } from '../../components/ui';
import { playBeep, playChime, unlockAudio } from '../../lib/audio';
import { getBestScore, logGameScore, logSession } from '../../lib/storage';

const GRID_SIZE = 9;
const TRIAL_MS = 2500;
const STIMULUS_VISIBLE_MS = 1800;
const TRIALS_COUNT = 20;
const MATCH_PROBABILITY = 0.35;

type Phase = 'setup' | 'playing' | 'result';

function generateSequence(n: number, length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= n && Math.random() < MATCH_PROBABILITY) {
      seq.push(seq[i - n]);
    } else {
      let pos: number;
      do {
        pos = Math.floor(Math.random() * GRID_SIZE);
      } while (i >= n && pos === seq[i - n] && Math.random() < 0.7);
      seq.push(pos);
    }
  }
  return seq;
}

export default function NBackGame() {
  const [n, setN] = useState(2);
  const [phase, setPhase] = useState<Phase>('setup');
  const [trialIndex, setTrialIndex] = useState(-1);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [responded, setResponded] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [accuracy, setAccuracy] = useState(0);

  const sequenceRef = useRef<number[]>([]);
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
  const respondedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };
  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  };

  useEffect(() => () => clearTimeouts(), []);

  function isMatchAt(index: number) {
    return index >= n && sequenceRef.current[index] === sequenceRef.current[index - n];
  }

  function startGame() {
    unlockAudio();
    startTimeRef.current = Date.now();
    sequenceRef.current = generateSequence(n, TRIALS_COUNT);
    statsRef.current = { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
    setPhase('playing');
    runTrial(0);
  }

  function runTrial(index: number) {
    if (index >= TRIALS_COUNT) {
      finishGame();
      return;
    }
    setTrialIndex(index);
    setActiveTile(sequenceRef.current[index]);
    setResponded(false);
    respondedRef.current = false;
    setFeedback(null);

    schedule(() => setActiveTile(null), STIMULUS_VISIBLE_MS);
    schedule(() => {
      // zamknięcie okna odpowiedzi dla tej próby
      if (index >= n) {
        const match = isMatchAt(index);
        if (match && !respondedRef.current) statsRef.current.misses += 1;
        if (!match && !respondedRef.current) statsRef.current.correctRejections += 1;
      }
      runTrial(index + 1);
    }, TRIAL_MS);
  }

  function handleMatchPress() {
    if (phase !== 'playing' || respondedRef.current || trialIndex < n) return;
    respondedRef.current = true;
    setResponded(true);
    const match = isMatchAt(trialIndex);
    if (match) {
      statsRef.current.hits += 1;
      setFeedback('correct');
      playBeep(880, 0.1, 0.2);
    } else {
      statsRef.current.falseAlarms += 1;
      setFeedback('wrong');
      playBeep(220, 0.15, 0.2);
    }
  }

  function finishGame() {
    clearTimeouts();
    playChime();
    const { hits, correctRejections, misses, falseAlarms } = statsRef.current;
    const total = hits + correctRejections + misses + falseAlarms;
    const acc = total > 0 ? Math.round(((hits + correctRejections) / total) * 100) : 0;
    setAccuracy(acc);
    setPhase('result');
    logGameScore('nback', acc);
    logSession({
      category: 'game',
      label: `N-Back (N=${n})`,
      durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      meta: { n, accuracy: acc },
    });
  }

  const bestOverall = getBestScore('nback', 'max');

  return (
    <div>
      <Link to="/gry" className="mb-4 inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← Wróć do gier
      </Link>
      <SectionTitle
        eyebrow="Trening poznawczy"
        title="N-Back"
        description="Podświetlane pole pojawia się co chwilę w siatce 3x3. Naciśnij „To samo miejsce”, gdy obecna pozycja pokrywa się z tą sprzed N kroków."
      />

      {phase === 'setup' && (
        <Card className="mx-auto max-w-md text-center">
          <p className="mb-3 text-sm text-[var(--color-muted)]">Poziom trudności (N)</p>
          <div className="mb-5 flex justify-center gap-2">
            {[1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => setN(v)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${n === v ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'}`}
              >
                {v}-back
              </button>
            ))}
          </div>
          {bestOverall !== null && <p className="mb-3 text-sm text-[var(--color-muted)]">Twój rekord: {bestOverall}% trafień</p>}
          <Button onClick={startGame}>Rozpocznij</Button>
        </Card>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col items-center gap-6">
          <Pill tone="accent">
            Próba {Math.max(trialIndex + 1, 1)} / {TRIALS_COUNT}
          </Pill>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                className={`h-24 w-24 rounded-2xl border border-white/10 transition sm:h-28 sm:w-28 ${
                  activeTile === i ? 'bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30' : 'bg-[var(--color-surface-2)]'
                }`}
              />
            ))}
          </div>
          <Button
            onClick={handleMatchPress}
            disabled={trialIndex < n || responded}
            variant={feedback === 'correct' ? 'primary' : feedback === 'wrong' ? 'danger' : 'secondary'}
            className="w-56"
          >
            To samo miejsce co {n} kroki temu
          </Button>
        </div>
      )}

      {phase === 'result' && (
        <Card className="mx-auto max-w-md text-center">
          <p className="text-3xl">🔁</p>
          <p className="mt-2 text-lg font-semibold">Trafność: {accuracy}%</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Poziom: {n}-back</p>
          <Button className="mt-5" onClick={startGame}>
            Zagraj ponownie
          </Button>
        </Card>
      )}
    </div>
  );
}
