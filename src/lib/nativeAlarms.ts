// Natywne powiadomienia (Capacitor LocalNotifications) — jedyny wiarygodny sposób, by budzik
// lub przypomnienie odpaliło się, gdy telefon jest zablokowany albo aplikacja zamknięta.
// W przeglądarce (poza natywną apką) te funkcje są no-opami — tam działa tylko silnik
// pierwszoplanowy z components/AlarmEngine.tsx, aktywny wyłącznie przy otwartej karcie.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type Weekday } from '@capacitor/local-notifications';
import type { Alarm, Reminder } from './alarms';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const res = await LocalNotifications.requestPermissions();
  return res.display === 'granted';
}

function hashToInt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 1_000_000;
}

function nextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

function alarmNotificationIds(alarm: Alarm): number[] {
  const base = hashToInt(alarm.id) * 10;
  return alarm.days.length > 0 ? alarm.days.map((d) => base + d + 1) : [base];
}

export async function cancelNativeAlarm(alarm: Alarm) {
  if (!isNativePlatform()) return;
  const ids = alarmNotificationIds(alarm);
  await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) }).catch(() => {});
}

export async function scheduleNativeAlarm(alarm: Alarm) {
  if (!isNativePlatform()) return;
  await cancelNativeAlarm(alarm);
  if (!alarm.enabled) return;

  const [hour, minute] = alarm.time.split(':').map(Number);
  const ids = alarmNotificationIds(alarm);
  const title = alarm.label || 'Budzik';
  const body = alarm.routineRoute ? 'Dotknij, aby rozpocząć poranną rutynę.' : 'Czas wstawać!';
  const extra = { kind: 'alarm', alarmId: alarm.id, routineRoute: alarm.routineRoute };

  if (alarm.days.length === 0) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ids[0],
          title,
          body,
          schedule: { at: nextOccurrence(hour, minute), allowWhileIdle: true },
          extra,
        },
      ],
    });
  } else {
    await LocalNotifications.schedule({
      notifications: alarm.days.map((day, i) => ({
        id: ids[i],
        title,
        body,
        schedule: { on: { weekday: (day + 1) as Weekday, hour, minute }, repeats: true, allowWhileIdle: true },
        extra,
      })),
    });
  }
}

export async function cancelNativeReminder(reminder: Reminder) {
  if (!isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: hashToInt(reminder.id) }] }).catch(() => {});
}

export async function scheduleNativeReminder(reminder: Reminder) {
  if (!isNativePlatform()) return;
  await cancelNativeReminder(reminder);
  if (!reminder.enabled) return;

  const at = new Date(reminder.at);
  const schedule =
    reminder.recurring === 'none'
      ? { at, allowWhileIdle: true }
      : { at, repeats: true, allowWhileIdle: true, every: reminder.recurring === 'daily' ? ('day' as const) : ('week' as const) };

  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashToInt(reminder.id),
        title: reminder.title,
        body: reminder.notes || 'Przypomnienie z Mental Wellness',
        schedule,
        extra: { kind: 'reminder', reminderId: reminder.id },
      },
    ],
  });
}

export function onNativeAlarmTapped(callback: (routineRoute: string | undefined) => void) {
  if (!isNativePlatform()) return () => {};
  const handlePromise = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const extra = action.notification.extra as { kind?: string; routineRoute?: string } | undefined;
    if (extra?.kind === 'alarm') callback(extra.routineRoute);
  });
  return () => {
    handlePromise.then((h) => h.remove()).catch(() => {});
  };
}
