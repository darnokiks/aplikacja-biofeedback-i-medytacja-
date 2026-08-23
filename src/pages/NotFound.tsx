import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="text-2xl font-bold">Nie znaleziono strony</h1>
      <p className="text-[var(--color-muted)]">Ta ścieżka nie istnieje. Wróć na stronę główną.</p>
      <Link to="/">
        <Button>Powrót do startu</Button>
      </Link>
    </div>
  );
}
