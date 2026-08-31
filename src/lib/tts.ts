// Prosta narracja głosowa oparta o wbudowany Web Speech API (bez zewnętrznych usług).

let plVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

// Web Speech API zwykle udostępnia zarówno głosy lokalne (offline, syntetyczne, np. espeak) jak
// i sieciowe/neuronowe (np. głosy Google w Chrome) — te drugie brzmią ładniej, ale wymagają
// żywego połączenia z serwerem dostawcy w chwili mówienia; jeśli to połączenie jest zablokowane
// (firewall, blokada reklam/prywatności, ograniczenia sieci) synteza cichnie bez żadnego błędu —
// dokładnie taki objaw zgłaszano w tej aplikacji. Dlatego celowo PREFERUJEMY głosy lokalne
// (localService: true) — mniej ładne, ale nie zależą od niczego poza samą przeglądarką.
function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  if (v.localService) score += 3;
  if (/natural|neural|enhanced|premium/i.test(v.name)) score += 1;
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

// Udokumentowany błąd Chrome: speechSynthesis.speak() wywołane od razu po cancel() bywa po cichu
// ignorowane. Anulujemy tylko, gdy coś faktycznie mówi/czeka w kolejce (unika niepotrzebnego
// cancel() w typowym przypadku, gdy poprzednia fraza już dawno się skończyła), a jeśli faktycznie
// anulujemy, odkładamy kolejne wywołanie o jeden tick.
const SPEAK_AFTER_CANCEL_DELAY_MS = 80;

// Drugi, najbardziej podstępny udokumentowany błąd: przeglądarki (głównie Chromium) NIE
// utrzymują same silnej referencji do obiektu SpeechSynthesisUtterance podczas mówienia — jeśli
// nic w JS-ie go nie trzyma, silnik JS może go zebrać (garbage collection) w trakcie wypowiedzi.
// Utrzymujemy więc jawną referencję do aktualnie mówionego `utterance`, dopóki się nie zakończy.
let currentUtterance: SpeechSynthesisUtterance | null = null;

type SpeakOpts = { rate?: number; pitch?: number; onEnd?: () => void; onError?: (reason: string) => void };

// Jeśli mowa nie wystartuje w tym czasie (kolejka "utknęła" bez żadnego zdarzenia — np. wybrany
// głos sieciowy nie odpowiada), uznajemy próbę za nieudaną i próbujemy raz jeszcze z domyślnym
// głosem przeglądarki zamiast czekać w nieskończoność w ciszy.
const START_WATCHDOG_MS = 1500;

function attemptSpeak(text: string, opts: SpeakOpts, voice: SpeechSynthesisVoice | null, allowFallback: boolean) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'pl-PL';
  if (voice) utter.voice = voice;
  utter.rate = opts.rate ?? 0.92;
  utter.pitch = opts.pitch ?? 1;
  currentUtterance = utter;

  let started = false;
  let fellBack = false;
  const fallbackToDefault = (reason: string) => {
    if (fellBack || !allowFallback) return false;
    fellBack = true;
    console.warn('[tts] ' + reason + ' — próbuję ponownie z domyślnym głosem przeglądarki zamiast', voice?.name ?? '(brak)');
    attemptSpeak(text, opts, null, false);
    return true;
  };

  const watchdog = allowFallback
    ? window.setTimeout(() => {
        if (started) return;
        if (fallbackToDefault(`mowa nie wystartowała w ${START_WATCHDOG_MS}ms`)) return;
      }, START_WATCHDOG_MS)
    : null;

  utter.onstart = () => {
    started = true;
    if (watchdog !== null) window.clearTimeout(watchdog);
    console.info('[tts] onstart, głos:', voice?.name ?? '(domyślny)');
  };
  utter.onend = () => {
    if (watchdog !== null) window.clearTimeout(watchdog);
    console.info('[tts] onend');
    if (currentUtterance === utter) currentUtterance = null;
    opts.onEnd?.();
  };
  utter.onerror = (e) => {
    if (watchdog !== null) window.clearTimeout(watchdog);
    if (fallbackToDefault(`onerror: ${e.error}`)) return;
    console.warn('[tts] onerror (bez dalszego fallbacku):', e.error);
    if (currentUtterance === utter) currentUtterance = null;
    opts.onError?.(e.error || 'unknown');
    opts.onEnd?.();
  };
  window.speechSynthesis.speak(utter);
  console.info('[tts] speechSynthesis.speak() wywołane, głos:', voice?.name ?? '(domyślny)', 'speaking:', window.speechSynthesis.speaking, 'pending:', window.speechSynthesis.pending);
}

export function speak(text: string, opts: SpeakOpts = {}) {
  if (!isTtsAvailable()) {
    console.warn('[tts] speechSynthesis niedostępne w tej przeglądarce');
    opts.onError?.('unsupported');
    opts.onEnd?.();
    return;
  }
  if (!voicesLoaded) loadVoices();

  const wasActive = window.speechSynthesis.speaking || window.speechSynthesis.pending;
  if (wasActive) window.speechSynthesis.cancel();
  console.info('[tts] speak() zaplanowane:', JSON.stringify(text.slice(0, 40)), 'głos:', plVoice?.name ?? '(domyślny)', 'anulowano poprzednią:', wasActive);

  window.setTimeout(
    () => attemptSpeak(text, opts, plVoice, true),
    wasActive ? SPEAK_AFTER_CANCEL_DELAY_MS : 0,
  );
}

export function cancelSpeech() {
  if (isTtsAvailable() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isTtsAvailable() && window.speechSynthesis.speaking;
}
