import { useEffect, useRef, useState } from 'react';
import { Ban, HeartPulse, Brain, Cpu } from 'lucide-react';
import { Button, Card, Pill, SectionTitle } from '../components/ui';
import { isWebBluetoothSupported } from '../lib/devices/webBluetooth';
import { connectHeartRateSensor, type HeartRateSensorHandle } from '../lib/devices/heartRate';
import { connectMuse, channelNames, type MuseHandle, type EEGSample } from '../lib/devices/museEeg';
import { connectGanglion, type GanglionHandle, type GanglionSample } from '../lib/devices/ganglionEeg';

export default function Devices() {
  const supported = isWebBluetoothSupported();

  return (
    <div>
      <SectionTitle
        eyebrow="Sprzęt"
        title="Urządzenia biofeedback i neurofeedback"
        description="Sparuj czujnik tętna (HRV) lub headset EEG bezpośrednio z przeglądarki przez Bluetooth — bez dodatkowego oprogramowania."
      />

      {!supported && (
        <Card className="mb-6 border-rose-400/25 bg-rose-400/5">
          <p className="flex items-start gap-2 text-sm text-rose-200">
            <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Ta przeglądarka nie obsługuje Web Bluetooth. Działa w Chrome/Edge na komputerze i Androidzie.{' '}
            <strong>Nie działa w Safari na iPhonie</strong> ani w Firefoksie — to ograniczenie tych przeglądarek, nie
            tej aplikacji.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HeartRateCard disabled={!supported} />
        <MuseCard disabled={!supported} />
        <GanglionCard disabled={!supported} />
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return <p className="mt-2 text-xs text-rose-300">{message}</p>;
}

function HeartRateCard({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [deviceName, setDeviceName] = useState('');
  const [bpm, setBpm] = useState<number | null>(null);
  const [rrHistory, setRrHistory] = useState<number[]>([]);
  const [battery, setBattery] = useState<number | null>(null);
  const [error, setError] = useState('');
  const handleRef = useRef<HeartRateSensorHandle | null>(null);

  useEffect(() => () => handleRef.current?.disconnect(), []);

  async function connect() {
    setError('');
    setStatus('connecting');
    try {
      const handle = await connectHeartRateSensor(
        (reading) => {
          setBpm(reading.bpm);
          if (reading.rrIntervalsMs.length) setRrHistory((h) => [...h.slice(-7), ...reading.rrIntervalsMs].slice(-8));
        },
        setBattery,
        () => {
          setStatus('idle');
          handleRef.current = null;
        },
      );
      handleRef.current = handle;
      setDeviceName(handle.deviceName);
      setStatus('connected');
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : 'Nie udało się połączyć.');
    }
  }

  function disconnect() {
    handleRef.current?.disconnect();
    handleRef.current = null;
    setStatus('idle');
    setBpm(null);
    setRrHistory([]);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><HeartPulse className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /> Czujnik tętna (HRV)</h3>
        {status === 'connected' && <Pill tone="accent">Połączono</Pill>}
      </div>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Dowolne urządzenie ze standardową usługą Bluetooth „Heart Rate" — np. Polar H10, H9, OH1 i wiele zegarków.
      </p>

      {status === 'connected' ? (
        <div>
          <p className="text-xs text-[var(--color-muted)]">{deviceName}</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{bpm ?? '--'}</p>
          <p className="text-sm text-[var(--color-muted)]">uderzeń / min{battery !== null && ` · bateria ${battery}%`}</p>
          {rrHistory.length > 0 && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">Ostatnie odstępy RR (ms): {rrHistory.join(', ')}</p>
          )}
          <Button variant="secondary" className="mt-4 w-full" onClick={disconnect}>
            Rozłącz
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={connect} disabled={disabled || status === 'connecting'}>
          {status === 'connecting' ? 'Łączenie...' : 'Połącz'}
        </Button>
      )}
      {error && <ErrorNote message={error} />}
    </Card>
  );
}

function MuseCard({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [deviceName, setDeviceName] = useState('');
  const [values, setValues] = useState<number[]>([0, 0, 0, 0]);
  const [error, setError] = useState('');
  const handleRef = useRef<MuseHandle | null>(null);

  useEffect(() => () => handleRef.current?.disconnect(), []);

  async function connect() {
    setError('');
    setStatus('connecting');
    try {
      const handle = await connectMuse(
        (sample: EEGSample) => setValues(sample.data),
        (connected) => {
          if (!connected) {
            setStatus('idle');
            handleRef.current = null;
          }
        },
      );
      handleRef.current = handle;
      setDeviceName(handle.deviceName);
      setStatus('connected');
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : 'Nie udało się połączyć.');
    }
  }

  function disconnect() {
    handleRef.current?.disconnect();
    handleRef.current = null;
    setStatus('idle');
    setValues([0, 0, 0, 0]);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Brain className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /> Muse (EEG)</h3>
        {status === 'connected' && <Pill tone="accent">Połączono</Pill>}
      </div>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Muse 2 / Muse S. Sygnał orientacyjny — 4 suche elektrody, dobre do ogólnego wskaźnika spokoju/uwagi, nie do
        precyzyjnego treningu pasm.
      </p>

      {status === 'connected' ? (
        <div>
          <p className="mb-2 text-xs text-[var(--color-muted)]">{deviceName}</p>
          <div className="grid grid-cols-2 gap-2 text-sm tabular-nums">
            {channelNames.slice(0, 4).map((name, i) => (
              <div key={name} className="rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
                <span className="text-[var(--color-muted)]">{name}: </span>
                {values[i]?.toFixed(1) ?? '--'}
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={disconnect}>
            Rozłącz
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={connect} disabled={disabled || status === 'connecting'}>
          {status === 'connecting' ? 'Łączenie...' : 'Połącz'}
        </Button>
      )}
      {error && <ErrorNote message={error} />}
    </Card>
  );
}

function GanglionCard({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [deviceName, setDeviceName] = useState('');
  const [lastChannels, setLastChannels] = useState<number[] | null>(null);
  const [counts, setCounts] = useState({ uncompressed: 0, undecoded: 0, accel: 0 });
  const [error, setError] = useState('');
  const handleRef = useRef<GanglionHandle | null>(null);

  useEffect(() => () => handleRef.current?.disconnect(), []);

  async function connect() {
    setError('');
    setStatus('connecting');
    try {
      const handle = await connectGanglion(
        (sample: GanglionSample) => {
          if (sample.type === 'uncompressed' && sample.channels) {
            setLastChannels(sample.channels);
            setCounts((c) => ({ ...c, uncompressed: c.uncompressed + 1 }));
          } else if (sample.type === 'compressed-undecoded') {
            setCounts((c) => ({ ...c, undecoded: c.undecoded + 1 }));
          } else if (sample.type === 'accelerometer') {
            setCounts((c) => ({ ...c, accel: c.accel + 1 }));
          }
        },
        () => {
          setStatus('idle');
          handleRef.current = null;
        },
      );
      handleRef.current = handle;
      setDeviceName(handle.deviceName);
      setStatus('connected');
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : 'Nie udało się połączyć.');
    }
  }

  function disconnect() {
    handleRef.current?.disconnect();
    handleRef.current = null;
    setStatus('idle');
    setLastChannels(null);
    setCounts({ uncompressed: 0, undecoded: 0, accel: 0 });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Cpu className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /> OpenBCI Ganglion (EEG)</h3>
        {status === 'connected' && <Pill tone="accent">Połączono</Pill>}
      </div>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Otwarty sprzęt, 4 kanały. <strong>Eksperymentalne:</strong> obsługujemy pakiety nieskompresowane i
        akcelerometr; dekodowanie skompresowanego strumienia EEG wymaga jeszcze dopracowania na prawdziwym
        urządzeniu.
      </p>

      {status === 'connected' ? (
        <div>
          <p className="mb-2 text-xs text-[var(--color-muted)]">{deviceName}</p>
          {lastChannels ? (
            <div className="grid grid-cols-2 gap-2 text-sm tabular-nums">
              {lastChannels.map((v, i) => (
                <div key={i} className="rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
                  <span className="text-[var(--color-muted)]">Ch{i + 1}: </span>
                  {v}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Oczekiwanie na pierwszy nieskompresowany pakiet...</p>
          )}
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Pakiety: {counts.uncompressed} nieskompresowane · {counts.undecoded} skompresowane (niezdekodowane) ·{' '}
            {counts.accel} akcelerometr
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={disconnect}>
            Rozłącz
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={connect} disabled={disabled || status === 'connecting'}>
          {status === 'connecting' ? 'Łączenie...' : 'Połącz'}
        </Button>
      )}
      {error && <ErrorNote message={error} />}
    </Card>
  );
}
