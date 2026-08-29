import { useMemo, useState } from 'react';
import { Button, Card, SectionTitle } from '../components/ui';
import { GuidedPlayer, type GuidedPhase } from '../components/GuidedPlayer';
import { JACOBSON_INTRO, JACOBSON_OUTRO, MUSCLE_GROUPS } from '../data/jacobson';
import { logSession } from '../lib/storage';
import { unlockAudio } from '../lib/audio';

export default function Jacobson() {
  const [voiceOn, setVoiceOn] = useState(true);
  const [tenseSec, setTenseSec] = useState(7);
  const [relaxSec, setRelaxSec] = useState(20);
  const [running, setRunning] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [done, setDone] = useState(false);

  const phases: GuidedPhase[] = useMemo(() => {
    const list: GuidedPhase[] = [
      { id: 'jacobson.intro', title: 'Przygotowanie', instruction: JACOBSON_INTRO, durationSec: 10 },
    ];
    for (const group of MUSCLE_GROUPS) {
      list.push({
        id: `jacobson.${group.id}.tense`,
        title: `${group.name} — napnij`,
        instruction: group.tenseInstruction,
        durationSec: tenseSec,
      });
      list.push({
        id: `jacobson.${group.id}.relax`,
        title: `${group.name} — rozluźnij`,
        instruction: group.relaxInstruction,
        durationSec: relaxSec,
      });
    }
    list.push({ id: 'jacobson.outro', title: 'Zakończenie', instruction: JACOBSON_OUTRO, durationSec: 12 });
    return list;
  }, [tenseSec, relaxSec]);

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
      category: 'jacobson',
      label: 'Trening Jacobsona — pełna sekwencja',
      durationSec: totalElapsedSec,
      meta: { groups: MUSCLE_GROUPS.length },
    });
  }

  function exit() {
    setRunning(false);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Relaksacja progresywna"
        title="Trening Jacobsona"
        description="Naprzemienne napinanie i rozluźnianie kolejnych grup mięśniowych. Ucz ciało rozpoznawać i uwalniać napięcie."
      />

      {!running && !done && (
        <Card className="mx-auto max-w-xl">
          <h3 className="mb-4 text-lg font-semibold">Ustawienia</h3>
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Czas napięcia</span>
                <span>{tenseSec}s</span>
              </div>
              <input type="range" min={4} max={10} value={tenseSec} onChange={(e) => setTenseSec(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
                <span>Czas rozluźnienia</span>
                <span>{relaxSec}s</span>
              </div>
              <input type="range" min={10} max={30} value={relaxSec} onChange={(e) => setRelaxSec(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-[var(--color-primary)]" />
              Narracja głosowa (PL)
            </label>
            <p className="text-sm text-[var(--color-muted)]">
              Pełna sekwencja obejmuje {MUSCLE_GROUPS.length} grup mięśniowych i potrwa około{' '}
              {Math.round((MUSCLE_GROUPS.length * (tenseSec + relaxSec) + 22) / 60)} min.
            </p>
            <Button className="w-full" onClick={start}>
              Rozpocznij trening
            </Button>
          </div>
        </Card>
      )}

      {running && (
        <GuidedPlayer key={sessionKey} phases={phases} voiceOn={voiceOn} onComplete={handleComplete} onExit={exit} />
      )}

      {done && (
        <Card className="mx-auto max-w-md text-center">
          <p className="text-3xl">🌿</p>
          <p className="mt-2 text-lg font-semibold">Sesja ukończona!</p>
          <p className="mt-1 text-[var(--color-muted)]">Zauważ, jak czuje się teraz Twoje ciało w porównaniu do początku.</p>
          <Button className="mt-5" onClick={() => setDone(false)}>
            Wróć do ustawień
          </Button>
        </Card>
      )}
    </div>
  );
}
