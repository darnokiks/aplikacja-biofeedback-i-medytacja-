import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import {
  getAlarms,
  saveAlarm,
  deleteAlarm,
  getReminders,
  saveReminder,
  deleteReminder,
  DAY_LABELS,
  type Alarm,
  type Reminder,
} from '../lib/alarms';
import {
  isNativePlatform,
  requestNotificationPermission,
  scheduleNativeAlarm,
  cancelNativeAlarm,
  scheduleNativeReminder,
  cancelNativeReminder,
} from '../lib/nativeAlarms';

const ROUTINE_OPTIONS = [
  { value: '', label: 'Brak — tylko dzwoni' },
  { value: '/oddech', label: 'Oddech Wima Hofa (auto-start)' },
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Alarms() {
  const [tab, setTab] = useState<'alarms' | 'reminders'>('alarms');
  const [alarms, setAlarms] = useState<Alarm[]>(() => getAlarms());
  const [reminders, setReminders] = useState<Reminder[]>(() => getReminders());
  const [addingAlarm, setAddingAlarm] = useState(false);
  const [newReminderDraft, setNewReminderDraft] = useState<Reminder | null>(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    if (isNativePlatform()) requestNotificationPermission().catch(() => {});
  }, []);

  function refresh() {
    setAlarms(getAlarms());
    setReminders(getReminders());
  }

  function upsertAlarm(alarm: Alarm) {
    saveAlarm(alarm);
    scheduleNativeAlarm(alarm).catch(() => {});
    refresh();
  }

  function removeAlarm(id: string) {
    const alarm = alarms.find((a) => a.id === id);
    deleteAlarm(id);
    if (alarm) cancelNativeAlarm(alarm).catch(() => {});
    refresh();
  }

  function upsertReminder(reminder: Reminder) {
    saveReminder(reminder);
    scheduleNativeReminder(reminder).catch(() => {});
    refresh();
  }

  function removeReminder(id: string) {
    const reminder = reminders.find((r) => r.id === id);
    deleteReminder(id);
    if (reminder) cancelNativeReminder(reminder).catch(() => {});
    refresh();
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Rutyna dnia"
        title="Budzik i przypomnienia"
        description="Zaplanuj poranne wstawanie z automatycznym startem ćwiczenia oddechowego, albo ustaw przypomnienie o zadaniu."
      />

      <Card className="mb-6 border-amber-400/20 bg-amber-400/5">
        <p className="flex items-start gap-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {isNativePlatform() ? (
            <>W tej natywnej apce budzik korzysta z prawdziwych powiadomień systemowych — zadzwoni nawet przy zablokowanym ekranie.</>
          ) : (
            <>
              <strong>To wersja przeglądarkowa.</strong> Budzik działa niezawodnie tylko, gdy ta karta jest otwarta i
              urządzenie nie śpi. To nie jest zamiennik prawdziwego budzika w telefonie — po zbudowaniu natywnej
              apki (patrz README) budzik przełącza się na prawdziwe powiadomienia systemowe, które działają nawet
              przy zablokowanym ekranie.
            </>
          )}
        </p>
      </Card>

      <div className="mb-6 inline-flex rounded-xl bg-[var(--color-surface-2)] p-1">
        <button
          onClick={() => setTab('alarms')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'alarms' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Budzik
        </button>
        <button
          onClick={() => setTab('reminders')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'reminders' ? 'bg-[var(--color-primary)] text-[#04140f]' : 'text-[var(--color-muted)]'}`}
        >
          Przypomnienia
        </button>
      </div>

      {tab === 'alarms' ? (
        <div className="space-y-4">
          {alarms.map((alarm) => (
            <AlarmCard key={alarm.id} alarm={alarm} onSave={upsertAlarm} onDelete={() => removeAlarm(alarm.id)} />
          ))}
          {addingAlarm ? (
            <AlarmCard
              alarm={{ id: '', time: '07:00', days: [1, 2, 3, 4, 5], label: '', enabled: true, routineRoute: '', snoozeMinutes: 9 }}
              onSave={(a) => {
                upsertAlarm(a);
                setAddingAlarm(false);
              }}
              onDelete={() => setAddingAlarm(false)}
              isNew
            />
          ) : (
            <Button onClick={() => setAddingAlarm(true)}>+ Dodaj budzik</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} onSave={upsertReminder} onDelete={() => removeReminder(reminder.id)} />
          ))}
          {newReminderDraft ? (
            <ReminderCard
              reminder={newReminderDraft}
              onSave={(r) => {
                upsertReminder(r);
                setNewReminderDraft(null);
              }}
              onDelete={() => setNewReminderDraft(null)}
              isNew
            />
          ) : (
            <Button
              onClick={() =>
                setNewReminderDraft({
                  id: '',
                  title: '',
                  notes: '',
                  at: new Date(Date.now() + 60 * 60000).toISOString(),
                  recurring: 'none',
                  enabled: true,
                })
              }
            >
              + Dodaj przypomnienie
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function AlarmCard({
  alarm,
  onSave,
  onDelete,
  isNew,
}: {
  alarm: Alarm;
  onSave: (a: Alarm) => void;
  onDelete: () => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState(alarm);

  function toggleDay(d: number) {
    setDraft((prev) => ({
      ...prev,
      days: prev.days.includes(d) ? prev.days.filter((x) => x !== d) : [...prev.days, d].sort(),
    }));
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="time"
          value={draft.time}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-2xl font-bold tabular-nums text-[var(--color-text)]"
        />
        <input
          type="text"
          placeholder="Nazwa (opcjonalnie)"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          className="min-w-[10rem] flex-1 rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
        />
        {!isNew && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => {
                const next = { ...draft, enabled: e.target.checked };
                setDraft(next);
                onSave(next);
              }}
              className="accent-[var(--color-primary)]"
            />
            Aktywny
          </label>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
              draft.days.includes(i) ? 'bg-[var(--color-primary)] text-[#04140f]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
        {draft.days.length === 0 && <Pill tone="muted">Jednorazowo (najbliższe wystąpienie)</Pill>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-[var(--color-muted)]">Rutyna poranna po wyłączeniu</p>
          <select
            value={draft.routineRoute ?? ''}
            onChange={(e) => setDraft({ ...draft, routineRoute: e.target.value || undefined })}
            className="w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            {ROUTINE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs text-[var(--color-muted)]">Drzemka (minuty)</p>
          <input
            type="number"
            min={1}
            max={30}
            value={draft.snoozeMinutes}
            onChange={(e) => setDraft({ ...draft, snoozeMinutes: Number(e.target.value) })}
            className="w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="danger" onClick={onDelete} className="!px-3 !py-1.5 text-xs">
          {isNew ? 'Anuluj' : 'Usuń'}
        </Button>
        <Button onClick={() => onSave(draft)} className="!px-3 !py-1.5 text-xs">
          Zapisz
        </Button>
      </div>
    </Card>
  );
}

function ReminderCard({
  reminder,
  onSave,
  onDelete,
  isNew,
}: {
  reminder: Reminder;
  onSave: (r: Reminder) => void;
  onDelete: () => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState(reminder);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Co masz zrobić?"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="min-w-[12rem] flex-1 rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm font-medium text-[var(--color-text)]"
        />
        {!isNew && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => {
                const next = { ...draft, enabled: e.target.checked };
                setDraft(next);
                onSave(next);
              }}
              className="accent-[var(--color-primary)]"
            />
            Aktywne
          </label>
        )}
      </div>

      <textarea
        placeholder="Notatka (opcjonalnie)"
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        rows={2}
        className="mt-3 w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-[var(--color-muted)]">Data i godzina</p>
          <input
            type="datetime-local"
            value={toDatetimeLocalValue(draft.at)}
            onChange={(e) => setDraft({ ...draft, at: new Date(e.target.value).toISOString() })}
            className="w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-[var(--color-muted)]">Powtarzanie</p>
          <select
            value={draft.recurring}
            onChange={(e) => setDraft({ ...draft, recurring: e.target.value as Reminder['recurring'] })}
            className="w-full rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            <option value="none">Jednorazowo</option>
            <option value="daily">Codziennie</option>
            <option value="weekly">Co tydzień</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="danger" onClick={onDelete} className="!px-3 !py-1.5 text-xs">
          {isNew ? 'Anuluj' : 'Usuń'}
        </Button>
        <Button onClick={() => onSave(draft)} className="!px-3 !py-1.5 text-xs" disabled={!draft.title.trim()}>
          Zapisz
        </Button>
      </div>
    </Card>
  );
}
