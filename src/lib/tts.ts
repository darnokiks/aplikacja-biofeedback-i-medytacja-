// Prosta narracja głosowa oparta o wbudowany Web Speech API (bez zewnętrznych usług).

let plVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    plVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('pl')) ??
      voices.find((v) => v.default) ??
      voices[0];
    voicesLoaded = true;
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function isTtsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, opts: { rate?: number; pitch?: number; onEnd?: () => void } = {}) {
  if (!isTtsAvailable()) {
    opts.onEnd?.();
    return;
  }
  if (!voicesLoaded) loadVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'pl-PL';
  if (plVoice) utter.voice = plVoice;
  utter.rate = opts.rate ?? 0.92;
  utter.pitch = opts.pitch ?? 1;
  utter.onend = () => opts.onEnd?.();
  utter.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech() {
  if (isTtsAvailable()) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return isTtsAvailable() && window.speechSynthesis.speaking;
}
