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

export interface AmbientHandle {
  stop: () => void;
  setVolume: (v: number) => void;
}

export type AmbientMood = 'relaks' | 'sen' | 'skupienie' | 'energia';

export interface AmbientTrack {
  id: string;
  name: string;
  mood: AmbientMood;
  description: string;
  chordHz: number[];
  oscType: OscillatorType;
  filterBase: number;
  filterSweepPeriodSec: number;
  noiseTexture?: NoiseColor;
  pulseBpm?: number;
}

/** Biblioteka generatywnych utworów ambientowych — w 100% syntezowane, bez próbek/licencji. */
export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'ocean-depth',
    name: 'Głębia oceanu',
    mood: 'sen',
    description: 'Ciepły, niski akord zawieszony — na sen i głęboki relaks.',
    chordHz: [98.0, 130.81, 146.83, 220.0],
    oscType: 'triangle',
    filterBase: 1200,
    filterSweepPeriodSec: 24,
  },
  {
    id: 'dawn',
    name: 'Świt',
    mood: 'skupienie',
    description: 'Jaśniejszy akord dur — łagodne wybudzenie uwagi bez pobudzenia.',
    chordHz: [130.81, 164.81, 196.0, 261.63],
    oscType: 'sine',
    filterBase: 1800,
    filterSweepPeriodSec: 18,
  },
  {
    id: 'deep-silence',
    name: 'Cisza głębin',
    mood: 'sen',
    description: 'Bardzo niski dron, minimalny ruch — do zasypiania.',
    chordHz: [65.41, 98.0, 130.81],
    oscType: 'sine',
    filterBase: 700,
    filterSweepPeriodSec: 40,
  },
  {
    id: 'golden-ray',
    name: 'Złoty promień',
    mood: 'relaks',
    description: 'Ciepły akord dur z żywszym ruchem filtra — na popołudniowy relaks.',
    chordHz: [110.0, 138.59, 164.81, 220.0],
    oscType: 'triangle',
    filterBase: 1500,
    filterSweepPeriodSec: 14,
  },
  {
    id: 'forest-rain',
    name: 'Deszcz w lesie',
    mood: 'relaks',
    description: 'Pad z delikatną teksturą deszczu w tle.',
    chordHz: [98.0, 123.47, 146.83, 196.0],
    oscType: 'triangle',
    filterBase: 1100,
    filterSweepPeriodSec: 20,
    noiseTexture: 'pink',
  },
  {
    id: 'heart-pulse',
    name: 'Puls serca',
    mood: 'energia',
    description: 'Ciepły pad z delikatnym, powolnym tętnieniem głośności — przyjazne tło do oddechu Wima Hofa.',
    chordHz: [87.31, 110.0, 130.81, 174.61],
    oscType: 'triangle',
    filterBase: 1200,
    filterSweepPeriodSec: 22,
    pulseBpm: 12,
  },
];

export function getAmbientTrack(id: string): AmbientTrack {
  return AMBIENT_TRACKS.find((t) => t.id === id) ?? AMBIENT_TRACKS[0];
}

// Repozytorium prawdziwej muzyki: jeśli dla danego ID utworu istnieje nagrany plik w
// public/audio/music/<id>.mp3, dopisz go tutaj — startAmbientTrack odtworzy go w pętli
// zamiast generować dźwięk syntetycznie. Brak wpisu lub błąd wczytania pliku -> uczciwy
// fallback na syntezę (ten sam wzorzec, co AUDIO_MANIFEST w lib/narration.ts).
const MUSIC_MANIFEST: Record<string, string> = {
  // 'ocean-depth': '/audio/music/ocean-depth.mp3',
};

export function hasRecordedTrack(id: string): boolean {
  return id in MUSIC_MANIFEST;
}

/**
 * Odtwarza wybrany utwór z biblioteki ambientowej: prawdziwe nagranie, jeśli jest dostępne
 * w MUSIC_MANIFEST, w przeciwnym razie w 100% syntezowany pad (patrz startSynthAmbientTrack).
 */
export function startAmbientTrack(trackId: string, volume = 0.35): AmbientHandle {
  const track = getAmbientTrack(trackId);
  const recordedSrc = MUSIC_MANIFEST[trackId];
  if (recordedSrc) {
    return startRecordedAmbientTrack(recordedSrc, volume, () => startSynthAmbientTrack(track, volume));
  }
  return startSynthAmbientTrack(track, volume);
}

/** Odtwarza nagrany plik muzyczny w pętli przez Web Audio, z tym samym fade-in/out co synteza. */
function startRecordedAmbientTrack(src: string, volume: number, fallback: () => AmbientHandle): AmbientHandle {
  const c = getCtx();
  const el = new Audio(src);
  el.loop = true;
  const source = c.createMediaElementSource(el);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  source.connect(gain).connect(c.destination);

  let active: AmbientHandle = {
    stop: () => {
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => {
        el.pause();
        source.disconnect();
        gain.disconnect();
      }, 1300);
    },
    setVolume: (v: number) => gain.gain.setTargetAtTime(v, c.currentTime, 0.2),
  };
  let switchedToFallback = false;

  function useFallback() {
    if (switchedToFallback) return;
    switchedToFallback = true;
    source.disconnect();
    gain.disconnect();
    active = fallback();
  }

  el.onerror = useFallback; // plik brakuje/uszkodzony
  el.play()
    .then(() => gain.gain.linearRampToValueAtTime(volume, c.currentTime + 2.5))
    .catch(useFallback); // np. przeglądarka zablokowała autoplay bez wcześniejszego gestu

  return {
    stop: () => active.stop(),
    setVolume: (v: number) => active.setVolume(v),
  };
}

/**
 * Generuje wybrany utwór z biblioteki ambientowej w 100% syntetycznie (bez próbek/licencji).
 * Warstwy detunowanych fal z wolnym LFO na głośności, dającym wrażenie "oddychającego" pada.
 */
function startSynthAmbientTrack(track: AmbientTrack, volume: number): AmbientHandle {
  const c = getCtx();
  const now = c.currentTime;

  const master = c.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(volume, now + 2.5);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = track.filterBase;
  filter.connect(master);
  master.connect(c.destination);

  const stoppable: { stop: () => void }[] = [];

  track.chordHz.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = track.oscType;
    osc.frequency.value = freq;
    osc.detune.value = (i % 2 === 0 ? -1 : 1) * (4 + i * 2);

    const voiceGain = c.createGain();
    voiceGain.gain.value = 0.16;

    // wolne, niesynchroniczne wahanie głośności każdego głosu ("oddech" pada)
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + i * 0.017;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(voiceGain.gain);

    osc.connect(voiceGain).connect(filter);
    osc.start(now);
    lfo.start(now);
    stoppable.push({ stop: () => { osc.stop(); lfo.stop(); } });
  });

  // wolny, cykliczny sweep filtru dla ruchu w tle (LFO zamiast jednorazowej rampy)
  const filterLfo = c.createOscillator();
  filterLfo.type = 'sine';
  filterLfo.frequency.value = 1 / track.filterSweepPeriodSec;
  const filterLfoGain = c.createGain();
  filterLfoGain.gain.value = track.filterBase * 0.3;
  filterLfo.connect(filterLfoGain).connect(filter.frequency);
  filterLfo.start(now);
  stoppable.push({ stop: () => filterLfo.stop() });

  if (track.noiseTexture) {
    const noiseSource = c.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(c, track.noiseTexture);
    noiseSource.loop = true;
    const noiseGain = c.createGain();
    noiseGain.gain.value = 0.06;
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 3000;
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
    noiseSource.start(now);
    stoppable.push({ stop: () => noiseSource.stop() });
  }

  if (track.pulseBpm) {
    // powolna, rytmiczna pulsacja głośności całego pada — "tętno" w tle
    const pulseLfo = c.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = track.pulseBpm / 60;
    const pulseGain = c.createGain();
    pulseGain.gain.value = volume * 0.1;
    pulseLfo.connect(pulseGain).connect(master.gain);
    pulseLfo.start(now);
    stoppable.push({ stop: () => pulseLfo.stop() });
  }

  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => stoppable.forEach((n) => n.stop()), 1300);
    },
    setVolume: (v: number) => {
      master.gain.setTargetAtTime(v, c.currentTime, 0.2);
    },
  };
}

export interface AlarmToneHandle {
  stop: () => void;
}

/**
 * Pętla tonu budzika — łagodnie narastająca głośność, dwa naprzemienne tony, żeby budzić
 * skutecznie, ale bez ostrego, nieprzyjemnego pisku.
 */
export function startAlarmTone(volume = 0.5): AlarmToneHandle {
  const c = getCtx();
  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(volume, c.currentTime + 3);
  master.connect(c.destination);

  let stopped = false;
  let timeoutId: number | null = null;

  function ping() {
    if (stopped) return;
    const now = c.currentTime;
    [880, 1046.5].forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = c.createGain();
      const start = now + i * 0.22;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.5, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(g).connect(master);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    timeoutId = window.setTimeout(ping, 900);
  }
  ping();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      const t = c.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.4);
      setTimeout(() => master.disconnect(), 500);
    },
  };
}
