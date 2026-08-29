// Warstwa narracji: odtwarza prawdziwe nagranie głosowe, jeśli istnieje dla danego `id`,
// w przeciwnym razie korzysta z syntezy mowy przeglądarki (patrz lib/tts.ts).
//
// Żeby dodać prawdziwe nagranie: wrzuć plik do public/audio/narration/<id>.mp3 (możesz je
// nagrać samodzielnie, zlecić komuś, albo wygenerować np. w ElevenLabs) i dopisz wpis do
// AUDIO_MANIFEST poniżej. Identyfikatory fraz są stabilne i widoczne przy każdym wywołaniu
// speakNarration — to jest umowa nazewnicza między treścią a plikami audio.
import { speak, cancelSpeech } from './tts';

const AUDIO_MANIFEST: Record<string, string> = {
  // 'wimhof.hold-start': '/audio/narration/wimhof.hold-start.mp3',
};

let currentAudio: HTMLAudioElement | null = null;

export interface NarrationOptions {
  rate?: number;
  onEnd?: () => void;
}

export function speakNarration(id: string, text: string, opts: NarrationOptions = {}) {
  stopNarration();
  const src = AUDIO_MANIFEST[id];
  if (!src) {
    speak(text, opts);
    return;
  }
  const audio = new Audio(src);
  audio.onended = () => opts.onEnd?.();
  audio.onerror = () => speak(text, opts); // plik brakuje/uszkodzony -> uczciwy fallback na TTS
  currentAudio = audio;
  audio.play().catch(() => speak(text, opts));
}

export function stopNarration() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  cancelSpeech();
}

export function hasRecordedNarration(id: string): boolean {
  return id in AUDIO_MANIFEST;
}
