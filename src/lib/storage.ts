// Trwałość danych po stronie klienta (localStorage) — historia sesji, streak, wyniki gier.

export type SessionCategory =
  | 'wimhof'
  | 'jacobson'
  | 'schultz'
  | 'meditation'
  | 'focus'
  | 'light'
  | 'biofeedback'
  | 'game';

export interface SessionRecord {
  id: string;
  category: SessionCategory;
  label: string;
  durationSec: number;
  completedAt: string; // ISO date
  meta?: Record<string, number | string>;
}

const SESSIONS_KEY = 'spokoj.sessions.v1';
const MAX_SESSIONS = 500;

export function getSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export function logSession(record: Omit<SessionRecord, 'id' | 'completedAt'>): SessionRecord {
  const full: SessionRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
  };
  const sessions = getSessions();
  sessions.push(full);
  if (sessions.length > MAX_SESSIONS) sessions.splice(0, sessions.length - MAX_SESSIONS);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return full;
}

export function clearSessions() {
  localStorage.removeItem(SESSIONS_KEY);
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Liczba kolejnych dni (wliczając dziś lub wczoraj) z co najmniej jedną sesją. */
export function getStreak(): number {
  const sessions = getSessions();
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => dateKey(s.completedAt)));
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);

  // Jeśli dziś brak sesji, streak liczymy od wczoraj (żeby nie zerować się w trakcie dnia).
  if (!days.has(dateKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (days.has(dateKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTotalMinutes(): number {
  return Math.round(getSessions().reduce((sum, s) => sum + s.durationSec, 0) / 60);
}

export function getSessionsByDay(days = 14): { date: string; count: number; minutes: number }[] {
  const sessions = getSessions();
  const result: { date: string; count: number; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d.toISOString());
    const matching = sessions.filter((s) => dateKey(s.completedAt) === key);
    result.push({
      date: key,
      count: matching.length,
      minutes: Math.round(matching.reduce((sum, s) => sum + s.durationSec, 0) / 60),
    });
  }
  return result;
}

export function getCategoryTotals(): Record<SessionCategory, number> {
  const totals: Record<SessionCategory, number> = {
    wimhof: 0,
    jacobson: 0,
    schultz: 0,
    meditation: 0,
    focus: 0,
    light: 0,
    biofeedback: 0,
    game: 0,
  };
  for (const s of getSessions()) totals[s.category] += 1;
  return totals;
}

// --- Wyniki gier ---

export interface GameScore {
  game: string;
  score: number;
  createdAt: string;
}

const SCORES_KEY = 'spokoj.scores.v1';

export function getGameScores(game?: string): GameScore[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    const all = raw ? (JSON.parse(raw) as GameScore[]) : [];
    return game ? all.filter((s) => s.game === game) : all;
  } catch {
    return [];
  }
}

export function logGameScore(game: string, score: number) {
  const all = getGameScores();
  all.push({ game, score, createdAt: new Date().toISOString() });
  localStorage.setItem(SCORES_KEY, JSON.stringify(all));
}

export function getBestScore(game: string, mode: 'max' | 'min' = 'max'): number | null {
  const scores = getGameScores(game);
  if (scores.length === 0) return null;
  const values = scores.map((s) => s.score);
  return mode === 'max' ? Math.max(...values) : Math.min(...values);
}
