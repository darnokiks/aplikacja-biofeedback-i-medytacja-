import { useEffect, useRef, useState } from 'react';
import { Card, Pill, SectionTitle } from '../components/ui';
import { AMBIENT_TRACKS, startAmbientTrack, unlockAudio, type AmbientHandle, type AmbientMood } from '../lib/audio';

const MOOD_LABELS: Record<AmbientMood, string> = {
  relaks: 'Relaks',
  sen: 'Sen',
  skupienie: 'Skupienie',
  energia: 'Energia',
};

export default function Music() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const handleRef = useRef<AmbientHandle | null>(null);

  useEffect(() => () => handleRef.current?.stop(), []);

  function toggle(id: string) {
    unlockAudio();
    if (playingId === id) {
      handleRef.current?.stop();
      handleRef.current = null;
      setPlayingId(null);
      return;
    }
    handleRef.current?.stop();
    handleRef.current = startAmbientTrack(id, volume);
    setPlayingId(id);
  }

  function onVolumeChange(v: number) {
    setVolume(v);
    handleRef.current?.setVolume(v);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Dźwięk"
        title="Biblioteka muzyki"
        description="Generatywne, ambientowe utwory tworzone na żywo przez Web Audio API — bez próbek i licencji. Możesz ich używać samodzielnie albo jako tło w treningu oddechowym i podróży światła."
      />

      <Card className="mb-6 max-w-sm">
        <div className="mb-1 flex justify-between text-sm text-[var(--color-muted)]">
          <span>Głośność podglądu</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AMBIENT_TRACKS.map((track) => {
          const isPlaying = playingId === track.id;
          return (
            <Card key={track.id} className={isPlaying ? 'border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/40' : ''}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{track.name}</h3>
                <Pill tone={isPlaying ? 'accent' : 'muted'}>{MOOD_LABELS[track.mood]}</Pill>
              </div>
              <p className="mb-4 text-sm text-[var(--color-muted)]">{track.description}</p>
              <button
                onClick={() => toggle(track.id)}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isPlaying ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-white/10'
                }`}
              >
                {isPlaying ? '⏸ Zatrzymaj' : '▶ Odtwórz podgląd'}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
