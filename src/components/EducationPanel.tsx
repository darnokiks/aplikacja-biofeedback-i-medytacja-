import { useState } from 'react';
import { BookOpen, ChevronDown, FileVideo, Mic, type LucideIcon } from 'lucide-react';
import { Card, Pill } from './ui';
import { EDUCATION } from '../data/education';
import { getLectureAudioSrc, getLectureVideoSrc } from '../lib/education';

type Tab = 'text' | 'video' | 'audio';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'text', label: 'Tekst', icon: BookOpen },
  { id: 'video', label: 'Wideo', icon: FileVideo },
  { id: 'audio', label: 'Wykład audio', icon: Mic },
];

function EmptyMediaNote({ kind, moduleId, hint }: { kind: string; moduleId: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
      <p>
        Nie dodano jeszcze {kind} dla modułu <code className="text-[var(--color-text)]">{moduleId}</code>.
      </p>
      <p className="mt-1">{hint}</p>
    </div>
  );
}

export function EducationPanel({ moduleId }: { moduleId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('text');
  const content = EDUCATION[moduleId];
  if (!content) return null;

  const videoSrc = getLectureVideoSrc(moduleId);
  const audioSrc = getLectureAudioSrc(moduleId);

  return (
    <Card className="mb-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          {content.title}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="mt-4">
          <div className="mb-4 flex gap-1.5 border-b border-white/5 pb-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.id ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:bg-white/5'
                }`}
              >
                <t.icon className="h-4 w-4" aria-hidden />
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'text' && (
            <div className="space-y-4 text-sm">
              <p className="text-[var(--color-text)]">{content.whatIsIt}</p>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Dlaczego warto</p>
                <ul className="space-y-2">
                  {content.whyUseIt.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[var(--color-text)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-[var(--color-muted)]">{content.background}</p>
            </div>
          )}

          {tab === 'video' && (
            <div>
              {videoSrc ? (
                <video src={videoSrc} controls className="w-full rounded-xl" />
              ) : (
                <EmptyMediaNote
                  kind="filmiku instruktażowego"
                  moduleId={moduleId}
                  hint={`Dodaj plik do public/video/education/${moduleId}.mp4 i wpisz go do LECTURE_VIDEO_MANIFEST w src/lib/education.ts.`}
                />
              )}
            </div>
          )}

          {tab === 'audio' && (
            <div>
              {audioSrc ? (
                <audio src={audioSrc} controls className="w-full" />
              ) : (
                <EmptyMediaNote
                  kind="nagrania audio z wykładem"
                  moduleId={moduleId}
                  hint={`Dodaj plik do public/audio/lectures/${moduleId}.mp3 i wpisz go do LECTURE_AUDIO_MANIFEST w src/lib/education.ts.`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {!open && (
        <div className="mt-2">
          <Pill tone="muted">Dotknij, aby rozwinąć — czym jest ta metoda i po co jej używać</Pill>
        </div>
      )}
    </Card>
  );
}
