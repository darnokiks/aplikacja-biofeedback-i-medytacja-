import { useEffect, useRef, useState } from 'react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import { startAmbientMusic, unlockAudio, type AmbientHandle } from '../lib/audio';
import { logSession } from '../lib/storage';
import { formatMMSS } from '../hooks/useTimer';

type ThemeId = 'depth' | 'dawn';
type Mode = 'gentle' | 'strobe';

const THEMES: Record<ThemeId, { name: string; base: string; glow: string }> = {
  depth: {
    name: 'Głębia (indygo)',
    base: 'radial-gradient(120% 120% at 50% 30%, #241a4a 0%, #120b28 55%, #060312 100%)',
    glow: 'radial-gradient(60% 60% at 50% 45%, rgba(167,139,250,0.9) 0%, rgba(110,231,201,0.35) 45%, transparent 75%)',
  },
  dawn: {
    name: 'Świt (bursztyn)',
    base: 'radial-gradient(120% 120% at 50% 30%, #3a2414 0%, #1c1109 55%, #0a0603 100%)',
    glow: 'radial-gradient(60% 60% at 50% 45%, rgba(251,191,120,0.9) 0%, rgba(244,114,89,0.3) 45%, transparent 75%)',
  },
};

const MAX_STROBE_HZ = 12; // świadomie poniżej najbardziej ryzykownego pasma 15-20 Hz
const MAX_STROBE_MINUTES = 8;

const SCREENING_QUESTIONS = [
  'Nie mam i nigdy nie miałem/-am padaczki ani napadów drgawkowych.',
  'Nikt w mojej najbliższej rodzinie nie choruje na padaczkę.',
  'Nie doświadczam migren wywoływanych migającym światłem.',
  'Jestem trzeźwy/-a, wypoczęty/-a i nie prowadzę dziś pojazdu.',
  'Wiem, że w każdej chwili puszczenie przycisku/spacji natychmiast zatrzyma miganie.',
];

export default function LightJourney() {
  const [mode, setMode] = useState<Mode>('gentle');
  const [acknowledged, setAcknowledged] = useState(false);
  const [screeningChecks, setScreeningChecks] = useState<boolean[]>(() => SCREENING_QUESTIONS.map(() => false));

  const [theme, setTheme] = useState<ThemeId>('depth');
  const [cycleSec, setCycleSec] = useState(10);
  const [minutes, setMinutes] = useState(10);
  const [strobeHz, setStrobeHz] = useState(6);
  const [strobeMinutes, setStrobeMinutes] = useState(5);
  const [musicOn, setMusicOn] = useState(true);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [breathLabel, setBreathLabel] = useState<'Wdech' | 'Wydech'>('Wdech');
  const [holding, setHolding] = useState(false);

  const musicRef = useRef<AmbientHandle | null>(null);
  const intervalRef = useRef<number | null>(null);
  const breathTimeoutRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const modeRef = useRef<Mode>('gentle');

  const clearAll = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (breathTimeoutRef.current) window.clearTimeout(breathTimeoutRef.current);
    musicRef.current?.stop();
    musicRef.current = null;
  };

  useEffect(() => () => clearAll(), []);

  // wyłącznik martwej ręki dla trybu stroboskopu: spacja lub Escape
  useEffect(() => {
    if (!running || modeRef.current !== 'strobe') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setHolding(true);
      }
      if (e.code === 'Escape') {
        stop();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') setHolding(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function runBreathLabel(showInhale: boolean) {
    setBreathLabel(showInhale ? 'Wdech' : 'Wydech');
    breathTimeoutRef.current = window.setTimeout(() => runBreathLabel(!showInhale), (cycleSec * 1000) / 2);
  }

  function startGentle() {
    unlockAudio();
    modeRef.current = 'gentle';
    setDone(false);
    elapsedRef.current = 0;
    setElapsedSec(0);
    setRunning(true);
    if (musicOn) musicRef.current = startAmbientMusic(0.3);
    runBreathLabel(true);
    intervalRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
      if (elapsedRef.current >= minutes * 60) finish();
    }, 1000);
  }

  function startStrobe() {
    unlockAudio();
    modeRef.current = 'strobe';
    setDone(false);
    setHolding(false);
    elapsedRef.current = 0;
    setElapsedSec(0);
    setRunning(true);
    if (musicOn) musicRef.current = startAmbientMusic(0.25);
    intervalRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
      if (elapsedRef.current >= strobeMinutes * 60) finish();
    }, 1000);
  }

  function finish() {
    clearAll();
    setRunning(false);
    setHolding(false);
    setDone(true);
    logSession({
      category: 'light',
      label: modeRef.current === 'strobe' ? `Stroboskop — ${strobeHz} Hz` : `Podróż światła — ${THEMES[theme].name}`,
      durationSec: elapsedRef.current,
      meta: modeRef.current === 'strobe' ? { mode: 'strobe', hz: strobeHz } : { mode: 'gentle', theme, cycleSec },
    });
  }

  function stop() {
    clearAll();
    setRunning(false);
    setHolding(false);
    if (elapsedRef.current > 5) {
      logSession({
        category: 'light',
        label: modeRef.current === 'strobe' ? 'Stroboskop (zakończony wcześniej)' : 'Podróż światła (zakończona wcześniej)',
        durationSec: elapsedRef.current,
        meta: modeRef.current === 'strobe' ? { mode: 'strobe', hz: strobeHz } : { mode: 'gentle', theme, cycleSec },
      });
    }
  }

  const allScreeningChecked = screeningChecks.every(Boolean);

  if (running && modeRef.current === 'strobe') {
    const periodMs = Math.round(1000 / strobeHz);
    return (
      <div className="flex flex-col items-center gap-5">
        <div
          className="relative w-full select-none overflow-hidden rounded-3xl"
          style={{ background: '#150f28', height: 'min(70vh, 560px)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 70% at 50% 50%, rgba(196,181,253,0.95) 0%, rgba(110,231,201,0.5) 55%, transparent 78%)',
              animationName: 'strobe-flicker',
              animationDuration: `${periodMs}ms`,
              animationTimingFunction: 'steps(1, jump-none)',
              animationIterationCount: 'infinite',
              animationPlayState: holding ? 'running' : 'paused',
              opacity: holding ? undefined : 0.18,
            }}
          />
          <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="tabular-nums text-white/60">{formatMMSS(Math.max(strobeMinutes * 60 - elapsedSec, 0))}</p>
            <button
              onPointerDown={() => setHolding(true)}
              onPointerUp={() => setHolding(false)}
              onPointerLeave={() => setHolding(false)}
              onPointerCancel={() => setHolding(false)}
              className="rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 text-lg font-semibold text-white/90 backdrop-blur active:bg-white/20"
            >
              {holding ? 'Miga — puść, aby zatrzymać' : 'Przytrzymaj, aby migać'}
            </button>
            <p className="text-sm text-white/50">albo przytrzymaj spację · Esc = zakończ sesję</p>
          </div>
        </div>
        <p className="max-w-md text-center text-sm text-[var(--color-muted)]">
          {strobeHz} Hz. Jeśli poczujesz zawroty głowy, mdłości, dezorientację lub jakikolwiek dyskomfort — puść od razu.
        </p>
        <Button variant="secondary" onClick={stop}>
          Zakończ sesję
        </Button>
      </div>
    );
  }

  if (running) {
    const t = THEMES[theme];
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-full overflow-hidden rounded-3xl" style={{ background: t.base, height: 'min(70vh, 560px)' }}>
          <div
            className="light-pulse-overlay absolute inset-0"
            style={{ background: t.glow, animation: `light-pulse ${cycleSec}s ease-in-out infinite` }}
          />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-2xl font-medium text-white/90 drop-shadow">{breathLabel}</p>
            <p className="tabular-nums text-white/50">{formatMMSS(elapsedSec)}</p>
          </div>
        </div>
        <p className="max-w-md text-center text-sm text-[var(--color-muted)]">
          Możesz zamknąć oczy, jeśli czujesz się z tym komfortowo, lub patrzeć łagodnie na światło. Jeśli poczujesz
          dyskomfort — otwórz oczy i przerwij.
        </p>
        <Button variant="secondary" onClick={stop}>
          Zakończ
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-3xl">✨</p>
        <p className="mt-2 text-lg font-semibold">Sesja zakończona</p>
        <p className="mt-1 text-[var(--color-muted)]">
          {modeRef.current === 'strobe'
            ? 'Zrób sobie przerwę przed kolejną sesją stroboskopu.'
            : 'Usiądź chwilę w ciszy, zanim wrócisz do codziennych aktywności.'}
        </p>
        <Button className="mt-5" onClick={() => setDone(false)}>
          Wróć do ustawień
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Światło i oddech"
        title="Podróż światła"
        description="Pulsujące światło w rytmie oddechu (łagodne) lub prawdziwy stroboskop z zabezpieczeniami, inspirowane doświadczeniami typu light journey (np. Lumenate)."
      />

      <div className="mb-6 inline-flex rounded-xl bg-[var(--color-surface-2)] p-1">
        <button
          onClick={() => setMode('gentle')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'gentle' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Łagodne pulsowanie
        </button>
        <button
          onClick={() => setMode('strobe')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'strobe' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Stroboskop
        </button>
      </div>

      {mode === 'gentle' ? (
        <>
          <Card className="mb-6 border-rose-400/25 bg-rose-400/5">
            <p className="text-sm text-rose-200">
              🚫 <strong>Nie używaj, jeśli masz padaczkę światłoczułą, migreny wywoływane światłem lub inne schorzenia
              neurologiczne wrażliwe na bodźce wizualne.</strong> Światło pulsuje bardzo wolno (pełny cykl trwa {cycleSec}s).
              Jeśli poczujesz zawroty głowy, mdłości lub dyskomfort — natychmiast zakończ sesję.
            </p>
          </Card>

          {!acknowledged ? (
            <Card className="mx-auto max-w-xl text-center">
              <label className="flex items-start gap-3 text-left text-sm text-[var(--color-muted)]">
                <input type="checkbox" className="mt-1 accent-[var(--color-primary)]" onChange={(e) => setAcknowledged(e.target.checked)} />
                <span>Przeczytałem/-am ostrzeżenie powyżej i potwierdzam, że nie mam padaczki światłoczułej ani innych przeciwwskazań.</span>
              </label>
            </Card>
          ) : (
            <Card className="mx-auto max-w-xl">
              <h3 className="mb-4 text-lg font-semibold">Ustawienia</h3>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm text-[var(--color-muted)]">Motyw światła</p>
                  <div className="flex gap-2">
                    {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          theme === id ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                        }`}
                      >
                        {THEMES[id].name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                    <span>Tempo pulsowania (długość cyklu)</span>
                    <span>{cycleSec}s</span>
                  </div>
                  <input type="range" min={6} max={14} value={cycleSec} onChange={(e) => setCycleSec(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                    <span>Czas trwania</span>
                    <span>{minutes} min</span>
                  </div>
                  <input type="range" min={5} max={20} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <input type="checkbox" checked={musicOn} onChange={(e) => setMusicOn(e.target.checked)} className="accent-[var(--color-primary)]" />
                  Muzyka ambientowa w tle
                </label>
                <Button className="w-full" onClick={startGentle}>
                  Rozpocznij podróż
                </Button>
              </div>
            </Card>
          )}

          <div className="mt-6 flex justify-center">
            <Pill tone="muted">Cykl światła jest zawsze wolniejszy niż 3 pulsy/sekundę — daleko poniżej progów bezpieczeństwa dla światłoczułości.</Pill>
          </div>
        </>
      ) : (
        <>
          <Card className="mb-6 border-rose-400/30 bg-rose-500/10">
            <p className="text-sm text-rose-200">
              🚫 <strong>Prawdziwe miganie światła — realne ryzyko napadu padaczki światłoczułej.</strong> Nie używaj przy
              padaczce (własnej lub w rodzinie), migrenach świetlnych, ciąży ani pod wpływem alkoholu/substancji. Nie
              używaj przy prowadzeniu pojazdu ani obsłudze maszyn. Częstotliwość ograniczona do {MAX_STROBE_HZ} Hz
              (poniżej najbardziej ryzykownego pasma 15–20 Hz), a sesja działa tylko, gdy przytrzymujesz przycisk lub
              spację — puszczenie natychmiast zatrzymuje miganie.
            </p>
          </Card>

          {!allScreeningChecked ? (
            <Card className="mx-auto max-w-xl">
              <h3 className="mb-4 text-lg font-semibold">Krótki skrining bezpieczeństwa</h3>
              <div className="space-y-3">
                {SCREENING_QUESTIONS.map((q, i) => (
                  <label key={i} className="flex items-start gap-3 text-left text-sm text-[var(--color-muted)]">
                    <input
                      type="checkbox"
                      className="mt-1 accent-[var(--color-primary)]"
                      checked={screeningChecks[i]}
                      onChange={(e) =>
                        setScreeningChecks((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                      }
                    />
                    <span>{q}</span>
                  </label>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="mx-auto max-w-xl">
              <h3 className="mb-4 text-lg font-semibold">Ustawienia stroboskopu</h3>
              <div className="space-y-5">
                <div>
                  <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                    <span>Częstotliwość migania</span>
                    <span>{strobeHz} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={MAX_STROBE_HZ}
                    value={strobeHz}
                    onChange={(e) => setStrobeHz(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Maksymalnie {MAX_STROBE_HZ} Hz — celowo poniżej pasma najwyższego ryzyka.</p>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                    <span>Maksymalny czas sesji</span>
                    <span>{strobeMinutes} min</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={MAX_STROBE_MINUTES}
                    value={strobeMinutes}
                    onChange={(e) => setStrobeMinutes(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <input type="checkbox" checked={musicOn} onChange={(e) => setMusicOn(e.target.checked)} className="accent-[var(--color-primary)]" />
                  Muzyka ambientowa w tle
                </label>
                <Button className="w-full" onClick={startStrobe}>
                  Rozpocznij (przytrzymaj, aby migać)
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
