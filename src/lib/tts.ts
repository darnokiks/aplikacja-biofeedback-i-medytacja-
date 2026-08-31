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

export function hasVoices(): boolean {
  return isTtsAvailable() && window.speechSynthesis.getVoices().length > 0;
}

// Chrome ma udokumentowany błąd: speechSynthesis.speak() wywołane od razu po cancel() bywa po
// cichu ignorowane (utterance nigdy się nie zaczyna, bez błędu). Odkładamy właściwe wywołanie
// o jeden tick, żeby dać przeglądarce czas na faktyczne wyczyszczenie kolejki.
const SPEAK_AFTER_CANCEL_DELAY_MS = 60;

// Drugi udokumentowany błąd Chrome: speechSynthesis usypia/przerywa mowę po ~15s bezczynności
// (np. długi tekst bez przerw), jeśli nikt nie "budzi" go wywołaniem resume(). Odświeżamy co 5s,
// dopóki dana wypowiedź trwa.
const RESUME_HEARTBEAT_MS = 5000;

// Trzeci, najbardziej podstępny udokumentowany błąd: przeglądarki (głównie Chromium) NIE
// utrzymują same silnej referencji do obiektu SpeechSynthesisUtterance podczas mówienia — jeśli
// nic w JS-ie go nie trzyma, silnik JS może go zebrać (garbage collection) w trakcie wypowiedzi,
// ucinając ją bez żadnego zdarzenia error. Krótki, izolowany test (np. jedno kliknięcie od razu
// po wejściu na stronę) rzadko na to trafia; długa sesja z dużym ruchem pamięci (timery, Web
// Audio) trafia na to prawie zawsze — dokładnie tak to wyglądało w tej aplikacji: przycisk
// testowy działał, a narracja w trakcie sesji Wima Hofa/Jacobsona milczała bez śladu błędu.
// Utrzymujemy więc jawną referencję do aktualnie mówionego `utterance`, dopóki się nie zakończy.
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(
  text: string,
  opts: { rate?: number; pitch?: number; onEnd?: () => void; onError?: (reason: string) => void } = {},
) {
  if (!isTtsAvailable()) {
    opts.onError?.('unsupported');
    opts.onEnd?.();
    return;
  }
  if (!voicesLoaded) loadVoices();

  window.setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pl-PL';
    if (plVoice) utter.voice = plVoice;
    utter.rate = opts.rate ?? 0.92;
    utter.pitch = opts.pitch ?? 1;
    currentUtterance = utter;

    let heartbeat: number | null = null;
    const clearHeartbeat = () => {
      if (heartbeat !== null) {
        window.clearInterval(heartbeat);
        heartbeat = null;
      }
    };
    utter.onstart = () => {
      heartbeat = window.setInterval(() => window.speechSynthesis.resume(), RESUME_HEARTBEAT_MS);
    };
    utter.onend = () => {
      clearHeartbeat();
      if (currentUtterance === utter) currentUtterance = null;
      opts.onEnd?.();
    };
    utter.onerror = (e) => {
      clearHeartbeat();
      if (currentUtterance === utter) currentUtterance = null;
      opts.onError?.(e.error || 'unknown');
      opts.onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  }, SPEAK_AFTER_CANCEL_DELAY_MS);
}

export function cancelSpeech() {
  if (isTtsAvailable()) window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isTtsAvailable() && window.speechSynthesis.speaking;
}
