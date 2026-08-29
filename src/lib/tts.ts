// Prosta narracja głosowa oparta o wbudowany Web Speech API (bez zewnętrznych usług).

let plVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

// Web Speech API zwykle udostępnia zarówno głosy lokalne (offline, syntetyczne, np. espeak) jak
// i sieciowe/neuronowe (np. głosy Google w Chrome, "Microsoft ... Natural" w Edge) — te drugie
// brzmią wyraźnie bardziej naturalnie. `localService: false` i nazwy z "Natural"/"Neural"/"Enhanced"
// to najlepsze dostępne w przeglądarce sygnały jakości głosu, więc preferujemy je w tej kolejności.
function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  if (!v.localService) score += 2;
  if (/natural|neural|enhanced|premium/i.test(v.name)) score += 2;
  if (v.default) score += 1;
  return score;
}

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const polish = voices.filter((v) => v.lang.toLowerCase().startsWith('pl'));
    const pool = polish.length > 0 ? polish : voices;
    plVoice = [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
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
