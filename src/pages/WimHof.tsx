import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, PartyPopper, Sparkles } from 'lucide-react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import { BreathOrb } from '../components/BreathOrb';
import { EducationPanel } from '../components/EducationPanel';
import {
  AMBIENT_TRACKS,
  BREATH_TONE_STYLES,
  getBreathToneStyle,
  playBreathTone,
  playChime,
  startAmbientTrack,
  unlockAudio,
  type AmbientHandle,
} from '../lib/audio';
import { speakNarration } from '../lib/narration';
import { logSession } from '../lib/storage';
import { formatMMSS } from '../hooks/useTimer';

type Phase = 'setup' | 'breathing' | 'hold' | 'recovery' | 'roundEnd' | 'done';
type Pace = 'slow' | 'medium' | 'fast';

const PACE_MS: Record<Pace, { inhale: number; exhale: number }> = {
  slow: { inhale: 2000, exhale: 2000 },
  medium: { inhale: 1500, exhale: 1500 },
  fast: { inhale: 1200, exhale: 1200 },
};

export default function WimHof() {
  const [rounds, setRounds] = useState(3);
  const [breathsPerRound, setBreathsPerRound] = useState(30);
  const [pace, setPace] = useState<Pace>('medium');
  const [recoveryHoldSec, setRecoveryHoldSec] = useState(15);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceError, setVoiceError] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [musicTrack, setMusicTrack] = useState('heart-pulse');
  const [breathToneId, setBreathToneId] = useState('classic-tone');

  const [phase, setPhase] = useState<Phase>('setup');
  const [currentRound, setCurrentRound] = useState(1);
  const [breathIndex, setBreathIndex] = useState(0);
  const [breathStage, setBreathStage] = useState<'in' | 'out'>('in');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [recoverySecondsLeft, setRecoverySecondsLeft] = useState(recoveryHoldSec);
  const [bestHold, setBestHold] = useState(0);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const bestHoldRef = useRef(0);
  const holdSecondsRef = useRef(0);
  const musicRef = useRef<AmbientHandle | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };

  useEffect(
    () => () => {
      clearTimers();
      musicRef.current?.stop();
    },
    [],
  );

  const location = useLocation();
  useEffect(() => {
    if ((location.state as { autoStart?: boolean } | null)?.autoStart) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speakIfOn(id: string, text: string) {
    if (!voiceOn) return;
    // Przyciszamy muzykę w tle na czas narracji — niezależnie od tego, czy to poprawia czytelność
    // głosu, czy nie, to i tak dobra praktyka, żeby głos nie musiał "przebijać się" przez pad.
    const restoreVolume = musicVolume;
    musicRef.current?.setVolume(restoreVolume * 0.25);
    speakNarration(id, text, {
      onEnd: () => musicRef.current?.setVolume(restoreVolume),
      onError: () => {
        setVoiceError(true);
        musicRef.current?.setVolume(restoreVolume);
      },
    });
  }

  function startSession() {
    unlockAudio();
    startTimeRef.current = Date.now();
    setCurrentRound(1);
    if (musicOn) {
      musicRef.current?.stop();
      musicRef.current = startAmbientTrack(musicTrack, musicVolume);
    }
    startBreathingRound();
  }

  function startBreathingRound() {
    setPhase('breathing');
    setBreathIndex(0);
    runBreathCycle(0);
  }

  function runBreathCycle(index: number, roundOverride?: number) {
    const round = roundOverride ?? currentRound;
    if (index >= breathsPerRound) {
      // koniec rund oddechowych -> pełny wydech i zatrzymanie
      setPhase('hold');
      setHoldSeconds(0);
      holdSecondsRef.current = 0;
      playChime();
      speakIfOn('wimhof.hold-start', 'Wypuść powietrze i zatrzymaj oddech tak długo, jak czujesz się komfortowo.');
      intervalRef.current = window.setInterval(() => {
        holdSecondsRef.current += 1;
        setHoldSeconds(holdSecondsRef.current);
      }, 1000);
      return;
    }
    setBreathIndex(index);
    setBreathStage('in');
    playBreathTone(getBreathToneStyle(breathToneId), 'in');
    const { inhale, exhale } = PACE_MS[pace];
    timeoutRef.current = window.setTimeout(() => {
      setBreathStage('out');
      playBreathTone(getBreathToneStyle(breathToneId), 'out');
      timeoutRef.current = window.setTimeout(() => runBreathCycle(index + 1, round), exhale);
    }, inhale);
  }

  function endHold() {
    clearTimers();
    bestHoldRef.current = Math.max(bestHoldRef.current, holdSecondsRef.current);
    setBestHold(bestHoldRef.current);
    setPhase('recovery');
    setRecoverySecondsLeft(recoveryHoldSec);
    playBreathTone(getBreathToneStyle(breathToneId), 'in', 0.22);
    speakIfOn('wimhof.recovery-start', 'Weź głęboki wdech i zatrzymaj powietrze.');
    let remaining = recoveryHoldSec;
    intervalRef.current = window.setInterval(() => {
      remaining -= 1;
      setRecoverySecondsLeft(remaining);
      if (remaining <= 0) {
        clearTimers();
        finishRound();
      }
    }, 1000);
  }

  function finishRound() {
    playChime();
    if (currentRound >= rounds) {
      musicRef.current?.stop();
      musicRef.current = null;
      setPhase('done');
      const totalSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      logSession({
        category: 'wimhof',
        label: `Wim Hof — ${rounds} rund × ${breathsPerRound} oddechów`,
        durationSec: totalSec,
        meta: { rounds, breathsPerRound, bestHoldSec: bestHoldRef.current },
      });
    } else {
      setPhase('roundEnd');
    }
  }

  function nextRound() {
    const next = currentRound + 1;
    setCurrentRound(next);
    setPhase('breathing');
    setBreathIndex(0);
    setTimeout(() => runBreathCycle(0, next), 50);
  }

  function stopSession() {
    clearTimers();
    musicRef.current?.stop();
    musicRef.current = null;
    setPhase('setup');
  }

  function onMusicVolumeChange(v: number) {
    setMusicVolume(v);
    musicRef.current?.setVolume(v);
  }

  const paceLabel = { slow: 'Wolne', medium: 'Średnie', fast: 'Szybkie' };

  return (
    <div>
      <SectionTitle
        eyebrow="Technika oddechowa"
        title="Metoda Wima Hofa"
        description="Kontrolowana hiperwentylacja, zatrzymanie oddechu i oddech odzyskujący. Praktykuj w bezpiecznym miejscu, w pozycji siedzącej lub leżącej."
      />

      <EducationPanel moduleId="wimhof" />

      <Card className="mb-6 border-amber-400/20 bg-amber-400/5">
        <p className="text-sm text-amber-200">
          <AlertTriangle className="mr-1 inline-block h-4 w-4 -translate-y-0.5" aria-hidden /> <strong>Nie wykonuj</strong> tej techniki w wodzie, podczas prowadzenia pojazdu ani stojąc. Nie stosuj w ciąży,
          przy epilepsji, chorobach serca lub nadciśnieniu bez konsultacji z lekarzem. Jeśli poczujesz zawroty głowy —
          przerwij i oddychaj normalnie.
        </p>
      </Card>

      {voiceOn && voiceError && (
        <Card className="mb-6 border-amber-400/20 bg-amber-400/5">
          <p className="flex items-start gap-2 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Głos nie działa w tej przeglądarce (brak zainstalowanych głosów syntezy mowy) — kontynuuj z tekstem
              instrukcji na ekranie.
            </span>
          </p>
        </Card>
      )}

      {phase === 'setup' && (
        <Card className="mx-auto max-w-xl">
          <h3 className="mb-4 text-lg font-semibold">Ustawienia sesji</h3>
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Liczba rund</span>
                <span>{rounds}</span>
              </div>
              <input type="range" min={1} max={6} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Oddechów w rundzie</span>
                <span>{breathsPerRound}</span>
              </div>
              <input
                type="range"
                min={15}
                max={40}
                value={breathsPerRound}
                onChange={(e) => setBreathsPerRound(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-[var(--color-muted)]">Tempo oddechu</p>
              <div className="flex gap-2">
                {(Object.keys(PACE_MS) as Pace[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPace(p)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      pace === p ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                    }`}
                  >
                    {paceLabel[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Wdech odzyskujący (sekundy)</span>
                <span>{recoveryHoldSec}s</span>
              </div>
              <input
                type="range"
                min={10}
                max={20}
                value={recoveryHoldSec}
                onChange={(e) => setRecoveryHoldSec(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-[var(--color-primary)]" />
              Narracja głosowa (PL)
            </label>
            <div>
              <p className="mb-2 text-sm text-[var(--color-muted)]">Dźwięk sygnału oddechu — kliknij, aby posłuchać i wybrać</p>
              <div className="scrollbar-thin grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-white/5 bg-[var(--color-surface-2)] p-2 sm:grid-cols-2">
                {BREATH_TONE_STYLES.map((style) => {
                  const selected = style.id === breathToneId;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        unlockAudio();
                        setBreathToneId(style.id);
                        playBreathTone(style, 'in');
                        window.setTimeout(() => playBreathTone(style, 'out'), 400);
                      }}
                      className={`rounded-lg px-3 py-2 text-left text-xs transition ${
                        selected
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40'
                          : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span className="block font-medium">{style.name}</span>
                      <span className="block text-[10px] opacity-80">{style.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <input type="checkbox" checked={musicOn} onChange={(e) => setMusicOn(e.target.checked)} className="accent-[var(--color-primary)]" />
                Muzyka ambientowa w tle
              </label>
              {musicOn && (
                <div className="space-y-2">
                  <select
                    value={musicTrack}
                    onChange={(e) => setMusicTrack(e.target.value)}
                    className="w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    {AMBIENT_TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                    aria-label="Głośność muzyki"
                  />
                </div>
              )}
            </div>
            <Button className="w-full" onClick={startSession}>
              Rozpocznij sesję
            </Button>
          </div>
        </Card>
      )}

      {phase === 'breathing' && (
        <div className="flex flex-col items-center gap-6 py-6">
          <Pill tone="accent">
            Runda {currentRound} / {rounds}
          </Pill>
          <BreathOrb
            stage={breathStage}
            inhaleMs={PACE_MS[pace].inhale}
            exhaleMs={PACE_MS[pace].exhale}
            breathIndex={breathIndex}
            totalBreaths={breathsPerRound}
          />
          <p className="text-xl font-semibold">{breathStage === 'in' ? 'Wdech przez nos' : 'Wydech, luźno'}</p>
          <Button variant="ghost" onClick={stopSession}>
            Zatrzymaj sesję
          </Button>
        </div>
      )}

      {phase === 'hold' && (
        <div className="flex flex-col items-center gap-6 py-10">
          <Pill tone="accent">
            Runda {currentRound} / {rounds} — zatrzymanie oddechu
          </Pill>
          <div className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-[var(--color-accent)]/40">
            <p className="text-5xl font-bold tabular-nums">{formatMMSS(holdSeconds)}</p>
          </div>
          <p className="max-w-sm text-center text-[var(--color-muted)]">
            Trzymaj tak długo, jak jest to komfortowe. Gdy poczujesz silną potrzebę wdechu, naciśnij przycisk.
          </p>
          <Button onClick={endHold}>Wdech — zakończ zatrzymanie</Button>
        </div>
      )}

      {phase === 'recovery' && (
        <div className="flex flex-col items-center gap-6 py-10">
          <Pill tone="accent">Oddech odzyskujący</Pill>
          <div className="flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/30 to-transparent">
            <p className="text-5xl font-bold tabular-nums">{recoverySecondsLeft}s</p>
          </div>
          <p className="max-w-sm text-center text-[var(--color-muted)]">
            Weź głęboki wdech, zatrzymaj powietrze w płucach na {recoveryHoldSec} sekund, następnie swobodnie wypuść.
          </p>
        </div>
      )}

      {phase === 'roundEnd' && (
        <Card className="mx-auto max-w-md text-center">
          <p className="flex items-center justify-center gap-2 text-lg font-semibold">Runda {currentRound} ukończona <PartyPopper className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /></p>
          <p className="mt-1 text-[var(--color-muted)]">Czas zatrzymania: {formatMMSS(holdSeconds)}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="secondary" onClick={stopSession}>
              Zakończ tutaj
            </Button>
            <Button onClick={nextRound}>Następna runda</Button>
          </div>
        </Card>
      )}

      {phase === 'done' && (
        <Card className="mx-auto max-w-md text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--color-primary)]" aria-hidden />
          <p className="mt-2 text-lg font-semibold">Sesja ukończona!</p>
          <p className="mt-1 text-[var(--color-muted)]">
            Ukończono {rounds} {rounds === 1 ? 'rundę' : 'rundy'}. Najdłuższe zatrzymanie: {formatMMSS(bestHold)}.
          </p>
          <Button className="mt-5" onClick={stopSession}>
            Wróć do ustawień
          </Button>
        </Card>
      )}
    </div>
  );
}
