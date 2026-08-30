// Trwałość danych dla budzika i przypomnień (localStorage — patrz też lib/storage.ts).

export interface Alarm {
  id: string;
  time: string; // "HH:MM", 24h
  days: number[]; // 0=niedziela ... 6=sobota; pusta tablica = jednorazowo (dziś/jutro)
  label: string;
  enabled: boolean;
  /** Ścieżka modułu, który ma się automatycznie uruchomić po wyłączeniu alarmu, np. "/oddech". */
  routineRoute?: string;
  snoozeMinutes: number;
}

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  at: string; // ISO datetime
  recurring: 'none' | 'daily' | 'weekly';
  enabled: boolean;
}

const ALARMS_KEY = 'spokoj.alarms.v1';
const REMINDERS_KEY = 'spokoj.reminders.v1';
const FIRED_LOG_KEY = 'spokoj.alarms.fired.v1';

function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARMS_KEY);
    return raw ? (JSON.parse(raw) as Alarm[]) : [];
  } catch {
    return [];
  }
}

export function getAlarms(): Alarm[] {
  return loadAlarms();
}

export function saveAlarm(alarm: Omit<Alarm, 'id'> & { id?: string }): Alarm {
  const alarms = loadAlarms();
  const full: Alarm = { ...alarm, id: alarm.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  const idx = alarms.findIndex((a) => a.id === full.id);
  if (idx >= 0) alarms[idx] = full;
  else alarms.push(full);
  localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  return full;
}

export function deleteAlarm(id: string) {
  localStorage.setItem(ALARMS_KEY, JSON.stringify(loadAlarms().filter((a) => a.id !== id)));
}

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

export function getReminders(): Reminder[] {
  return loadReminders();
}

export function saveReminder(reminder: Omit<Reminder, 'id'> & { id?: string }): Reminder {
  const reminders = loadReminders();
  const full: Reminder = { ...reminder, id: reminder.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  const idx = reminders.findIndex((r) => r.id === full.id);
  if (idx >= 0) reminders[idx] = full;
  else reminders.push(full);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return full;
}

export function deleteReminder(id: string) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(loadReminders().filter((r) => r.id !== id)));
}

// Zapobiega wielokrotnemu odpaleniu tego samego alarmu/przypomnienia w tej samej minucie
// (silnik sprawdza co kilka-kilkanaście sekund).
function getFiredLog(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FIRED_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function wasFiredThisMinute(key: string, minuteKey: string): boolean {
  const log = getFiredLog();
  return log[key] === minuteKey;
}

export function markFired(key: string, minuteKey: string) {
  const log = getFiredLog();
  log[key] = minuteKey;
  // trzymaj log krótki
  const entries = Object.entries(log);
  if (entries.length > 200) {
    localStorage.setItem(FIRED_LOG_KEY, JSON.stringify(Object.fromEntries(entries.slice(-100))));
  } else {
    localStorage.setItem(FIRED_LOG_KEY, JSON.stringify(log));
  }
}

export const DAY_LABELS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

// Drzemka: mapuje id alarmu na czas (ISO), kiedy ma ponownie zadzwonić.
const SNOOZE_KEY = 'spokoj.alarms.snooze.v1';

function loadSnoozeMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function setSnooze(alarmId: string, at: Date) {
  const map = loadSnoozeMap();
  map[alarmId] = at.toISOString();
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

export function clearSnooze(alarmId: string) {
  const map = loadSnoozeMap();
  delete map[alarmId];
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

export function getDueSnoozeAlarmIds(now: Date): string[] {
  const map = loadSnoozeMap();
  return Object.entries(map)
    .filter(([, at]) => new Date(at).getTime() <= now.getTime())
    .map(([id]) => id);
}
