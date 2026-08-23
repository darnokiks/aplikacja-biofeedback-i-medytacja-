import { useState } from 'react';
import { Button, Card, SectionTitle } from '../components/ui';
import { clearSessions, getCategoryTotals, getSessions, getSessionsByDay, getStreak, getTotalMinutes } from '../lib/storage';

const CATEGORY_LABELS: Record<string, { name: string; icon: string }> = {
  wimhof: { name: 'Wim Hof', icon: '🌬️' },
  jacobson: { name: 'Jacobson', icon: '🧎' },
  schultz: { name: 'Schultz', icon: '🕯️' },
  meditation: { name: 'Medytacja', icon: '🧘' },
  focus: { name: 'Focus/Sen', icon: '🎧' },
  biofeedback: { name: 'Biofeedback', icon: '❤️' },
  game: { name: 'Gry', icon: '🧠' },
};

export default function Progress() {
  const [, forceRerender] = useState(0);
  const streak = getStreak();
  const totalMinutes = getTotalMinutes();
  const sessions = getSessions();
  const byDay = getSessionsByDay(14);
  const totals = getCategoryTotals();
  const maxMinutes = Math.max(1, ...byDay.map((d) => d.minutes));

  function handleClear() {
    if (window.confirm('Czy na pewno chcesz usunąć całą historię sesji? Tej operacji nie można cofnąć.')) {
      clearSessions();
      forceRerender((v) => v + 1);
    }
  }

  const recent = [...sessions].reverse().slice(0, 15);

  return (
    <div>
      <SectionTitle eyebrow="Twój rozwój" title="Postępy" description="Historia praktyki i statystyki wszystkich modułów." />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Passa dni</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{streak} 🔥</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Łączny czas</p>
          <p className="mt-1 text-3xl font-bold">{totalMinutes} min</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Sesje łącznie</p>
          <p className="mt-1 text-3xl font-bold">{sessions.length}</p>
        </Card>
      </div>

      <Card className="mb-8">
        <h3 className="mb-4 text-lg font-semibold">Aktywność — ostatnie 14 dni</h3>
        <div className="flex items-end gap-1.5" style={{ height: 140 }}>
          {byDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[var(--color-primary)]/70"
                style={{ height: `${Math.max((d.minutes / maxMinutes) * 100, d.minutes > 0 ? 6 : 2)}%` }}
                title={`${d.date}: ${d.minutes} min`}
              />
              <span className="text-[10px] text-[var(--color-muted)]">{d.date.slice(8, 10)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(totals).map(([key, count]) => (
          <Card key={key} className="text-center">
            <p className="text-2xl">{CATEGORY_LABELS[key]?.icon}</p>
            <p className="mt-1 text-xl font-bold">{count}</p>
            <p className="text-xs text-[var(--color-muted)]">{CATEGORY_LABELS[key]?.name}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ostatnie sesje</h3>
          {sessions.length > 0 && (
            <Button variant="danger" onClick={handleClear} className="!px-3 !py-1.5 text-xs">
              Wyczyść historię
            </Button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Brak jeszcze zapisanych sesji. Zacznij od dowolnego modułu!</p>
        ) : (
          <div className="scrollbar-thin max-h-96 space-y-2 overflow-y-auto">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_LABELS[s.category]?.icon}</span>
                  <span>{s.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--color-muted)]">
                  <span>{Math.round(s.durationSec / 60)} min</span>
                  <span>{new Date(s.completedAt).toLocaleDateString('pl-PL')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
