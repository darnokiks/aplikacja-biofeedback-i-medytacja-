import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { hasVoices, isTtsAvailable, speak } from '../lib/tts';

type Status = 'idle' | 'speaking' | 'ok' | 'error';

/** Samodzielny test syntezy mowy, niezależny od logiki sesji — pozwala sprawdzić, czy problem
 * z narracją leży w przeglądarce/systemie (brak głosów, wyciszona karta itd.), zanim zacznie się
 * szukać błędu w kodzie modułu. */
export function VoiceTestButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorReason, setErrorReason] = useState('');

  function test() {
    setStatus('speaking');
    setErrorReason('');
    if (!isTtsAvailable()) {
      setStatus('error');
      setErrorReason('Ta przeglądarka nie obsługuje syntezy mowy (Web Speech API).');
      return;
    }
    speak('To jest test głosu narracji. Jeśli to słyszysz, wszystko działa poprawnie.', {
      onEnd: () => setStatus((s) => (s === 'speaking' ? 'ok' : s)),
      onError: (reason) => {
        setStatus('error');
        setErrorReason(reason);
      },
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={test}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 font-medium text-[var(--color-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
      >
        <Volume2 className="h-3.5 w-3.5" aria-hidden />
        Testuj głos
      </button>
      {status === 'speaking' && <span className="text-[var(--color-muted)]">Mówię…</span>}
      {status === 'ok' && <span className="text-[var(--color-primary)]">Dźwięk zadziałał ✓</span>}
      {status === 'error' && (
        <span className="text-rose-300">
          Błąd: {errorReason || 'nieznany'}
          {!hasVoices() && ' — ta przeglądarka nie ma zainstalowanych głosów syntezy mowy.'}
        </span>
      )}
    </span>
  );
}
