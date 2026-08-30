import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Bell } from 'lucide-react';
import { Button } from './ui';
import { startAlarmTone, playBeep, unlockAudio, type AlarmToneHandle } from '../lib/audio';
import {
  getAlarms,
  getReminders,
  saveAlarm,
  saveReminder,
  setSnooze,
  clearSnooze,
  getDueSnoozeAlarmIds,
  wasFiredThisMinute,
  markFired,
  type Alarm,
  type Reminder,
} from '../lib/alarms';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function hhmmNow(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Okno tolerancji: sprawdzamy co ~15s, ale przeładowanie strony / uśpiona karta mogą sprawić,
// że dokładna minuta zostanie przegapiona. Zamiast wymagać równości co do minuty, uznajemy
// wyzwalacz za należny, jeśli zaplanowany czas już minął, ale nie dawniej niż to okno temu —
// i nie odpalił się jeszcze dzisiaj/w tym cyklu (patrz markFired/wasFiredThisMinute poniżej,
// gdzie "minuteKey" pełni funkcję klucza okresu, nie dosłownie minuty).
const GRACE_MS = 10 * 60 * 1000;

function todayAt(now: Date, hour: number, minute: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

function isDueWithinGrace(target: Date, now: Date): boolean {
  const diff = now.getTime() - target.getTime();
  return diff >= 0 && diff < GRACE_MS;
}

function reminderDueNow(reminder: Reminder, now: Date): boolean {
  const at = new Date(reminder.at);
  if (reminder.recurring === 'none') {
    return isDueWithinGrace(at, now);
  }
  if (reminder.recurring === 'daily') {
    return isDueWithinGrace(todayAt(now, at.getHours(), at.getMinutes()), now);
  }
  // weekly
  return now.getDay() === at.getDay() && isDueWithinGrace(todayAt(now, at.getHours(), at.getMinutes()), now);
}

/**
 * Silnik pierwszoplanowy budzika/przypomnień — działa wyłącznie, gdy ta karta przeglądarki
 * jest otwarta. To NIE jest zamiennik prawdziwego budzika telefonu: jeśli karta zostanie
 * zamknięta albo telefon zablokowany na dłużej, nic się nie odpali. Dla niezawodnych alarmów
 * w natywnej apce patrz lib/nativeAlarms.ts (Capacitor Local Notifications).
 */
export function AlarmEngine() {
  const navigate = useNavigate();
  const [firingAlarm, setFiringAlarm] = useState<Alarm | null>(null);
  const [firingReminder, setFiringReminder] = useState<Reminder | null>(null);
  const toneRef = useRef<AlarmToneHandle | null>(null);

  useEffect(() => {
    checkDue();
    const interval = window.setInterval(checkDue, 15000);
    return () => {
      window.clearInterval(interval);
      toneRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function checkDue() {
    const now = new Date();
    const periodKey = dateKey(now);
    const day = now.getDay();

    for (const snoozedId of getDueSnoozeAlarmIds(now)) {
      const alarm = getAlarms().find((a) => a.id === snoozedId);
      clearSnooze(snoozedId);
      if (alarm) {
        fireAlarm(alarm);
        return;
      }
    }

    for (const alarm of getAlarms()) {
      if (!alarm.enabled) continue;
      const [hour, minute] = alarm.time.split(':').map(Number);
      const daysMatch = alarm.days.length === 0 || alarm.days.includes(day);
      if (!daysMatch || !isDueWithinGrace(todayAt(now, hour, minute), now)) continue;
      const key = `alarm:${alarm.id}`;
      if (wasFiredThisMinute(key, periodKey)) continue;
      markFired(key, periodKey);
      if (alarm.days.length === 0) saveAlarm({ ...alarm, enabled: false });
      fireAlarm(alarm);
      return;
    }

    for (const reminder of getReminders()) {
      if (!reminder.enabled || !reminderDueNow(reminder, now)) continue;
      const key = `reminder:${reminder.id}`;
      if (wasFiredThisMinute(key, periodKey)) continue;
      markFired(key, periodKey);
      if (reminder.recurring === 'none') saveReminder({ ...reminder, enabled: false });
      fireReminder(reminder);
      return;
    }
  }

  function fireAlarm(alarm: Alarm) {
    unlockAudio();
    toneRef.current?.stop();
    toneRef.current = startAlarmTone(0.55);
    setFiringAlarm(alarm);
    notifyIfHidden(alarm.label || 'Budzik', 'Czas wstawać!');
  }

  function fireReminder(reminder: Reminder) {
    unlockAudio();
    playBeep(660, 0.15, 0.25);
    setFiringReminder(reminder);
    notifyIfHidden(reminder.title, reminder.notes || 'Przypomnienie');
  }

  function notifyIfHidden(title: string, body: string) {
    if (typeof document === 'undefined' || !document.hidden) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body });
    } catch {
      // niektóre przeglądarki mobilne nie pozwalają na Notification() z karty w tle — pomijamy
    }
  }

  function dismissAlarm(startRoutine: boolean) {
    toneRef.current?.stop();
    toneRef.current = null;
    const alarm = firingAlarm;
    setFiringAlarm(null);
    if (startRoutine && alarm?.routineRoute) {
      navigate(alarm.routineRoute, { state: { autoStart: true } });
    }
  }

  function snoozeAlarm() {
    toneRef.current?.stop();
    toneRef.current = null;
    if (firingAlarm) setSnooze(firingAlarm.id, new Date(Date.now() + firingAlarm.snoozeMinutes * 60000));
    setFiringAlarm(null);
  }

  return (
    <>
      {firingAlarm && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#0b1120]/98 px-6 text-center backdrop-blur">
          <AlarmClock className="h-16 w-16 text-[var(--color-primary)]" aria-hidden />
          <div>
            <p className="text-4xl font-bold tabular-nums">{hhmmNow(new Date())}</p>
            <p className="mt-2 text-lg text-[var(--color-muted)]">{firingAlarm.label || 'Budzik'}</p>
            {firingAlarm.routineRoute && (
              <p className="mt-1 text-sm text-[var(--color-primary)]">Po wyłączeniu rozpocznie się poranna rutyna</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={snoozeAlarm}>
              Drzemka ({firingAlarm.snoozeMinutes} min)
            </Button>
            <Button onClick={() => dismissAlarm(true)}>Wyłącz{firingAlarm.routineRoute ? ' i zacznij' : ''}</Button>
          </div>
        </div>
      )}

      {firingReminder && (
        <div className="fixed bottom-6 left-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-2xl shadow-black/50">
          <p className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-[var(--color-primary)]" aria-hidden /> {firingReminder.title}</p>
          {firingReminder.notes && <p className="mt-1 text-sm text-[var(--color-muted)]">{firingReminder.notes}</p>}
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setFiringReminder(null)}>
            OK
          </Button>
        </div>
      )}
    </>
  );
}
