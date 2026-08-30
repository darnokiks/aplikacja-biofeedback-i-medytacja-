// Jedno źródło prawdy dla ikon modułów — używane w nawigacji, na stronie głównej i w
// statystykach, żeby ten sam moduł zawsze miał tę samą ikonę w całej aplikacji.
import {
  Home,
  AlarmClock,
  Wind,
  Flower2,
  Headphones,
  Brain,
  TrendingUp,
  Activity,
  Flame,
  Sparkles,
  Music2,
  HeartPulse,
  Bluetooth,
  type LucideIcon,
} from 'lucide-react';

export const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/': Home,
  '/budzik': AlarmClock,
  '/oddech': Wind,
  '/medytacja': Flower2,
  '/focus': Headphones,
  '/gry': Brain,
  '/postepy': TrendingUp,
  '/jacobson': Activity,
  '/schultz': Flame,
  '/swiatlo': Sparkles,
  '/muzyka': Music2,
  '/biofeedback': HeartPulse,
  '/urzadzenia': Bluetooth,
};
