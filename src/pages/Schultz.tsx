import { useMemo, useState } from 'react';
import { Button, Card, SectionTitle } from '../components/ui';
import { GuidedPlayer, type GuidedPhase } from '../components/GuidedPlayer';
import { SCHULTZ_FORMULAS, SCHULTZ_INTRO, SCHULTZ_RETURN } from '../data/schultz';
import { logSession } from '../lib/storage';
import { unlockAudio } from '../lib/audio';

export default function Schultz() {
  const [voiceOn, setVoiceOn] = useState(true);
  const [formulaSec, setFormulaSec] = useState(45);
  const [running, setRunning] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [done, setDone] = useState(false);

  const phases: GuidedPhase[] = useMemo(() => {
    const list: GuidedPhase[] = [{ id: 'schultz.intro', title: 'Przygotowanie', instruction: SCHULTZ_INTRO, durationSec: 15 }];
    for (const formula of SCHULTZ_FORMULAS) {
      list.push({ id: `schultz.${formula.id}`, title: formula.name, instruction: formula.text, durationSec: formulaSec });
    }
    list.push({ id: 'schultz.return', title: 'Powrót do czujności', instruction: SCHULTZ_RETURN, durationSec: 15 });
    return list;
  }, [formulaSec]);

  function start() {
    unlockAudio();
    setDone(false);
    setSessionKey((k) => k + 1);
    setRunning(true);
  }

  function handleComplete(totalElapsedSec: number) {
    setRunning(false);
    setDone(true);
    logSession({
      category: 'schultz',
      label: 'Trening autogenny Schultza',
      durationSec: totalElapsedSec,
      meta: { formulas: SCHULTZ_FORMULAS.length },
    });
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Trening autogenny"
        title="Metoda Schultza"
        description="Klasyczne formuły autosugestii: ciężar, ciepło, serce, oddech, splot słoneczny i chłodne czoło. Zawsze kończ sesję fazą powrotu do czujności."
      />

      {!running && !done && (
        <Card className="mx-auto max-w-xl">
          <h3 className="mb-4 text-lg font-semibold">Ustawienia</h3>
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Czas na formułę</span>
                <span>{formulaSec}s</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={formulaSec}
                onChange={(e) => setFormulaSec(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-[var(--color-primary)]" />
              Narracja głosowa (PL)
            </label>
            <p className="text-sm text-[var(--color-muted)]">
              Sesja obejmuje {SCHULTZ_FORMULAS.length} formuł i potrwa około{' '}
              {Math.round((SCHULTZ_FORMULAS.length * formulaSec + 30) / 60)} min.
            </p>
            <Button className="w-full" onClick={start}>
              Rozpocznij trening
            </Button>
          </div>
        </Card>
      )}

      {running && (
        <GuidedPlayer key={sessionKey} phases={phases} voiceOn={voiceOn} onComplete={handleComplete} onExit={() => setRunning(false)} />
      )}

      {done && (
        <Card className="mx-auto max-w-md text-center">
          <p className="text-3xl">🕯️</p>
          <p className="mt-2 text-lg font-semibold">Sesja ukończona!</p>
          <p className="mt-1 text-[var(--color-muted)]">Pamiętaj, aby po treningu wstawać powoli.</p>
          <Button className="mt-5" onClick={() => setDone(false)}>
            Wróć do ustawień
          </Button>
        </Card>
      )}
    </div>
  );
}
