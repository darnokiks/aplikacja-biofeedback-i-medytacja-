import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Puzzle } from 'lucide-react';
import { Button, Card, Pill, SectionTitle } from '../../components/ui';
import { playBeep, playChime, unlockAudio } from '../../lib/audio';
import { getBestScore, logGameScore, logSession } from '../../lib/storage';

const GRID_SIZE = 9; // siatka 3x3
const TILE_FREQS = [523, 587, 659, 698, 784, 880, 988, 1046, 1175];
const SHOW_DELAY_MS = 650;
const GAP_MS = 250;

type Phase = 'idle' | 'showing' | 'input' | 'gameover';

export default function MemoryGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userIndex, setUserIndex] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [flashError, setFlashError] = useState<number | null>(null);

  const timeoutsRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimeouts(), []);

  function schedule(fn: () => void, delay: number) {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }

  function startGame() {
    unlockAudio();
    startTimeRef.current = Date.now();
    const first = Math.floor(Math.random() * GRID_SIZE);
    setSequence([first]);
    setUserIndex(0);
    playSequence([first]);
  }

  function playSequence(seq: number[]) {
    clearTimeouts();
    setPhase('showing');
    seq.forEach((tile, i) => {
      schedule(() => {
        setActiveTile(tile);
        playBeep(TILE_FREQS[tile], 0.25, 0.22);
      }, i * (SHOW_DELAY_MS + GAP_MS));
      schedule(() => setActiveTile(null), i * (SHOW_DELAY_MS + GAP_MS) + SHOW_DELAY_MS);
    });
    schedule(() => setPhase('input'), seq.length * (SHOW_DELAY_MS + GAP_MS));
  }

  function handleTileClick(tile: number) {
    if (phase !== 'input') return;
    playBeep(TILE_FREQS[tile], 0.15, 0.2);
    if (sequence[userIndex] === tile) {
      if (userIndex + 1 === sequence.length) {
        // runda ukończona -> dodaj kolejny element
        const next = [...sequence, Math.floor(Math.random() * GRID_SIZE)];
        setSequence(next);
        setUserIndex(0);
        schedule(() => playSequence(next), 500);
      } else {
        setUserIndex(userIndex + 1);
      }
    } else {
      setFlashError(tile);
      schedule(() => setFlashError(null), 400);
      endGame();
    }
  }

  function endGame() {
    clearTimeouts();
    playChime();
    setPhase('gameover');
    const score = sequence.length - 1;
    logGameScore('memory', score);
    logSession({
      category: 'game',
      label: 'Sekwencje pamięciowe',
      durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      meta: { score },
    });
  }

  const bestOverall = getBestScore('memory', 'max');

  return (
    <div>
      <Link to="/gry" className="mb-4 inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← Wróć do gier
      </Link>
      <SectionTitle
        eyebrow="Trening poznawczy"
        title="Sekwencje pamięciowe"
        description="Zapamiętaj kolejność podświetlanych pól i powtórz ją, klikając w tej samej kolejności. Każda runda dodaje jedno pole."
      />

      <div className="flex flex-col items-center gap-6">
        {phase !== 'idle' && <Pill tone="accent">Runda {sequence.length}</Pill>}

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              disabled={phase !== 'input'}
              className={`h-24 w-24 rounded-2xl border border-white/10 transition sm:h-28 sm:w-28 ${
                activeTile === i
                  ? 'bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30'
                  : flashError === i
                    ? 'bg-rose-500'
                    : 'bg-[var(--color-surface-2)] hover:bg-white/10 disabled:hover:bg-[var(--color-surface-2)]'
              }`}
            />
          ))}
        </div>

        {phase === 'idle' && (
          <Card className="max-w-md text-center">
            {bestOverall !== null && <p className="mb-2 text-sm text-[var(--color-muted)]">Twój rekord: {bestOverall} pól</p>}
            <Button onClick={startGame}>Rozpocznij grę</Button>
          </Card>
        )}

        {phase === 'showing' && <p className="text-[var(--color-muted)]">Obserwuj sekwencję...</p>}
        {phase === 'input' && <p className="text-[var(--color-muted)]">Twoja kolej — powtórz sekwencję.</p>}

        {phase === 'gameover' && (
          <Card className="max-w-md text-center">
            <Puzzle className="mx-auto h-8 w-8 text-[var(--color-primary)]" aria-hidden />
            <p className="mt-2 text-lg font-semibold">Koniec gry! Wynik: {sequence.length - 1} pól</p>
            <Button className="mt-4" onClick={startGame}>
              Zagraj ponownie
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
