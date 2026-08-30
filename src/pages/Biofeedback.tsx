import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import { EducationPanel } from '../components/EducationPanel';
import { logSession } from '../lib/storage';
import { formatMMSS } from '../hooks/useTimer';

type CamStatus = 'idle' | 'requesting' | 'measuring' | 'error';

const SAMPLE_WINDOW_MS = 12000; // bufor 12s sygnału
const MIN_SAMPLES_FOR_BPM = 90; // ok. 3s przy 30fps
const MIN_PEAK_DISTANCE_MS = 350; // ogranicza HR do maks. ~170 bpm

interface Sample {
  t: number;
  v: number;
}

type BreathPattern = 'coherent' | 'box' | '478';

const BREATH_PATTERNS: Record<BreathPattern, { name: string; phases: { label: string; ms: number }[] }> = {
  coherent: {
    name: 'Oddech koherentny (5.5/min)',
    phases: [
      { label: 'Wdech', ms: 5500 },
      { label: 'Wydech', ms: 5500 },
    ],
  },
  box: {
    name: 'Oddech pudełkowy (4-4-4-4)',
    phases: [
      { label: 'Wdech', ms: 4000 },
      { label: 'Zatrzymaj', ms: 4000 },
      { label: 'Wydech', ms: 4000 },
      { label: 'Zatrzymaj', ms: 4000 },
    ],
  },
  '478': {
    name: 'Technika 4-7-8',
    phases: [
      { label: 'Wdech', ms: 4000 },
      { label: 'Zatrzymaj', ms: 7000 },
      { label: 'Wydech', ms: 8000 },
    ],
  },
};

export default function Biofeedback() {
  const [status, setStatus] = useState<CamStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [bpm, setBpm] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<'brak' | 'słaby' | 'dobry'>('brak');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [avgBpmHistory, setAvgBpmHistory] = useState<number[]>([]);

  const [breathOn, setBreathOn] = useState(false);
  const [pattern, setPattern] = useState<BreathPattern>('coherent');
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const startTimeRef = useRef(0);
  const bpmIntervalRef = useRef<number | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);
  const breathTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (bpmIntervalRef.current) window.clearInterval(bpmIntervalRef.current);
    if (elapsedIntervalRef.current) window.clearInterval(elapsedIntervalRef.current);
    if (breathTimeoutRef.current) window.clearTimeout(breathTimeoutRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setStatus('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      samplesRef.current = [];
      startTimeRef.current = Date.now();
      setElapsedSec(0);
      setBpm(null);
      setAvgBpmHistory([]);
      setStatus('measuring');

      sampleLoop();
      bpmIntervalRef.current = window.setInterval(computeBpm, 1500);
      elapsedIntervalRef.current = window.setInterval(() => {
        setElapsedSec(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setStatus('error');
      setErrorMsg('Brak dostępu do kamery. Zezwól na dostęp w przeglądarce i spróbuj ponownie (wymagane HTTPS).');
    }
  }

  function sampleLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(w * 0.35, h * 0.35, w * 0.3, h * 0.3);
        let sum = 0;
        for (let i = 0; i < frame.data.length; i += 4) sum += frame.data[i]; // kanał czerwony
        const avg = sum / (frame.data.length / 4);
        const now = performance.now();
        samplesRef.current.push({ t: now, v: avg });
        const cutoff = now - SAMPLE_WINDOW_MS;
        while (samplesRef.current.length && samplesRef.current[0].t < cutoff) samplesRef.current.shift();
      }
    }
    rafRef.current = requestAnimationFrame(sampleLoop);
  }

  function computeBpm() {
    const samples = samplesRef.current;
    if (samples.length < MIN_SAMPLES_FOR_BPM) {
      setSignalQuality('brak');
      return;
    }
    // wygładzenie ruchomą średnią
    const smoothed: Sample[] = [];
    const windowSize = 5;
    for (let i = 0; i < samples.length; i++) {
      const start = Math.max(0, i - windowSize);
      const slice = samples.slice(start, i + 1);
      const avg = slice.reduce((s, x) => s + x.v, 0) / slice.length;
      smoothed.push({ t: samples[i].t, v: avg });
    }

    const values = smoothed.map((s) => s.v);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 0.15) {
      setSignalQuality('brak');
      setBpm(null);
      return;
    }

    // detekcja szczytów powyżej średniej z minimalnym odstępem czasowym
    const peaks: number[] = [];
    let lastPeakT = -Infinity;
    for (let i = 1; i < smoothed.length - 1; i++) {
      const p = smoothed[i];
      if (p.v > mean + stdDev * 0.3 && p.v >= smoothed[i - 1].v && p.v >= smoothed[i + 1].v) {
        if (p.t - lastPeakT > MIN_PEAK_DISTANCE_MS) {
          peaks.push(p.t);
          lastPeakT = p.t;
        }
      }
    }

    if (peaks.length < 3) {
      setSignalQuality('słaby');
      return;
    }

    const intervals = [];
    for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1]);
    const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const estimatedBpm = Math.round(60000 / avgIntervalMs);

    if (estimatedBpm >= 40 && estimatedBpm <= 180) {
      setBpm(estimatedBpm);
      setSignalQuality(peaks.length >= 6 ? 'dobry' : 'słaby');
      setAvgBpmHistory((h) => [...h.slice(-30), estimatedBpm]);
    } else {
      setSignalQuality('słaby');
    }
  }

  function stop() {
    stopAll();
    setStatus('idle');
    setBreathOn(false);
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (elapsed > 10) {
      const avg = avgBpmHistory.length
        ? Math.round(avgBpmHistory.reduce((a, b) => a + b, 0) / avgBpmHistory.length)
        : undefined;
      logSession({
        category: 'biofeedback',
        label: 'Biofeedback — tętno z kamery',
        durationSec: elapsed,
        meta: avg ? { avgBpm: avg } : undefined,
      });
    }
  }

  // pacer oddechowy
  function toggleBreath() {
    if (breathOn) {
      if (breathTimeoutRef.current) window.clearTimeout(breathTimeoutRef.current);
      setBreathOn(false);
    } else {
      setBreathOn(true);
      setBreathPhaseIndex(0);
      runBreathPhase(0);
    }
  }

  function runBreathPhase(index: number) {
    const phases = BREATH_PATTERNS[pattern].phases;
    const i = index % phases.length;
    setBreathPhaseIndex(i);
    breathTimeoutRef.current = window.setTimeout(() => runBreathPhase(index + 1), phases[i].ms);
  }

  const currentPhase = BREATH_PATTERNS[pattern].phases[breathPhaseIndex];

  return (
    <div>
      <SectionTitle
        eyebrow="Biofeedback"
        title="Tętno z kamery i oddech"
        description="Eksperymentalny pomiar tętna metodą fotopletyzmografii (rPPG) z kamery oraz pacer oddechowy do obserwacji, jak oddech wpływa na Twoje samopoczucie."
      />

      <EducationPanel moduleId="biofeedback" />

      <Card className="mb-6 border-amber-400/20 bg-amber-400/5">
        <p className="flex items-start gap-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            To <strong>nie jest urządzenie medyczne</strong>. Pomiar jest orientacyjny i wrażliwy na ruch oraz oświetlenie.
            Dla najlepszego sygnału zasłoń obiektyw kamery opuszkiem palca i pozostań nieruchomo, lub usiądź nieruchomo
            przodem do kamery w dobrym, równym świetle.
          </span>
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Pomiar tętna</h3>
          <video ref={videoRef} muted playsInline className="mb-4 w-full rounded-xl bg-black/40" style={{ maxHeight: 220, objectFit: 'cover' }} />
          <canvas ref={canvasRef} width={160} height={120} className="hidden" />

          {status === 'idle' && <Button onClick={start}>Rozpocznij pomiar</Button>}
          {status === 'requesting' && <p className="text-[var(--color-muted)]">Proszę o dostęp do kamery...</p>}
          {status === 'error' && (
            <div>
              <p className="mb-3 text-sm text-rose-300">{errorMsg}</p>
              <Button onClick={start}>Spróbuj ponownie</Button>
            </div>
          )}
          {status === 'measuring' && (
            <div>
              <div className="mb-4 flex items-center gap-4">
                <div>
                  <p className="text-4xl font-bold tabular-nums">{bpm ?? '--'}</p>
                  <p className="text-sm text-[var(--color-muted)]">uderzeń / min</p>
                </div>
                <Pill tone={signalQuality === 'dobry' ? 'accent' : 'muted'}>Sygnał: {signalQuality}</Pill>
              </div>
              <p className="mb-4 text-sm text-[var(--color-muted)]">Czas pomiaru: {formatMMSS(elapsedSec)}</p>
              <Button variant="secondary" onClick={stop}>
                Zakończ pomiar
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Pacer oddechowy</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(BREATH_PATTERNS) as BreathPattern[]).map((p) => (
              <button
                key={p}
                onClick={() => setPattern(p)}
                disabled={breathOn}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  pattern === p ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                }`}
              >
                {BREATH_PATTERNS[p].name}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex h-48 w-48 items-center justify-center">
              <div
                key={breathOn ? breathPhaseIndex : 'idle'}
                className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-accent)]/40 to-[var(--color-primary)]/30"
                style={
                  breathOn && currentPhase
                    ? {
                        animation: `${currentPhase.label === 'Wdech' ? 'breathe-in' : currentPhase.label === 'Wydech' ? 'breathe-out' : ''} ${currentPhase.ms}ms ease-in-out forwards`,
                      }
                    : undefined
                }
              />
              <p className="relative text-lg font-semibold">{breathOn ? currentPhase?.label : 'Gotowy'}</p>
            </div>
            <Button variant="secondary" onClick={toggleBreath}>
              {breathOn ? 'Zatrzymaj oddech' : 'Rozpocznij pacer'}
            </Button>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Obserwuj, jak Twoje tętno reaguje na spokojny, miarowy oddech — to podstawa treningu biofeedback.
          </p>
        </Card>
      </div>
    </div>
  );
}
