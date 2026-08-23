// Lekki silnik audio oparty o Web Audio API.
// Wszystkie dźwięki są syntezowane w locie — brak zewnętrznych plików/licencji.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Odblokowuje AudioContext w odpowiedzi na gest użytkownika (wymagane przez przeglądarki). */
export function unlockAudio() {
  getCtx();
}

/** Krótki, miękki dźwięk dzwonka (jak miska tybetańska). */
export function playBell(volume = 0.5) {
  const c = getCtx();
  const now = c.currentTime;
  const partials = [1, 2.4, 3.8, 5.4];
  const gains = [1, 0.45, 0.25, 0.12];
  const master = c.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(volume, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
  master.connect(c.destination);

  partials.forEach((mult, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220 * mult;
    const g = c.createGain();
    g.gain.value = gains[i];
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 4.6);
  });
}

/** Krótki sygnał "beep" — do odliczania / zmiany fazy. */
export function playBeep(freq = 880, duration = 0.12, volume = 0.3) {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Sygnał końca ćwiczenia — dwa tony. */
export function playChime() {
  playBeep(660, 0.18, 0.28);
  setTimeout(() => playBeep(880, 0.28, 0.28), 180);
}

export type NoiseColor = 'white' | 'pink' | 'brown';
export type FocusMode = 'focus' | 'relax' | 'sleep';

export interface FocusSessionHandle {
  stop: () => void;
  setVolume: (v: number) => void;
}

const MODE_CONFIG: Record<FocusMode, { base: number; beat: number; noise: NoiseColor; noiseLevel: number }> = {
  // Focus: beta/low-gamma range binaural beat wspierający koncentrację
  focus: { base: 200, beat: 16, noise: 'pink', noiseLevel: 0.12 },
  // Relax: alpha range
  relax: { base: 180, beat: 9, noise: 'pink', noiseLevel: 0.15 },
  // Sleep: delta range
  sleep: { base: 140, beat: 3, noise: 'brown', noiseLevel: 0.2 },
};

function createNoiseBuffer(c: AudioContext, color: NoiseColor): AudioBuffer {
  const bufferSize = 2 * c.sampleRate;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (color === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }
  } else {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }
  return buffer;
}

/**
 * Uruchamia sesję dźwięków koncentracji: binaural beat (dwa tony w osobnych kanałach,
 * różnica częstotliwości = "beat") + szum tła. Wymaga słuchawek dla efektu binauralnego.
 */
export function startFocusSession(mode: FocusMode, volume = 0.5): FocusSessionHandle {
  const c = getCtx();
  const cfg = MODE_CONFIG[mode];
  const now = c.currentTime;

  const master = c.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(volume, now + 1.2);
  master.connect(c.destination);

  const merger = c.createChannelMerger(2);
  merger.connect(master);

  const leftOsc = c.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = cfg.base;
  const leftGain = c.createGain();
  leftGain.gain.value = 0.5;
  leftOsc.connect(leftGain).connect(merger, 0, 0);

  const rightOsc = c.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = cfg.base + cfg.beat;
  const rightGain = c.createGain();
  rightGain.gain.value = 0.5;
  rightOsc.connect(rightGain).connect(merger, 0, 1);

  leftOsc.start();
  rightOsc.start();

  const noiseSource = c.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(c, cfg.noise);
  noiseSource.loop = true;
  const noiseGain = c.createGain();
  noiseGain.gain.value = cfg.noiseLevel;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = mode === 'sleep' ? 800 : 4000;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();

  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.8);
      setTimeout(() => {
        leftOsc.stop();
        rightOsc.stop();
        noiseSource.stop();
      }, 900);
    },
    setVolume: (v: number) => {
      master.gain.setTargetAtTime(v, c.currentTime, 0.1);
    },
  };
}
