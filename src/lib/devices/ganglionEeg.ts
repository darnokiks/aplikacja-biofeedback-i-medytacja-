// OpenBCI Ganglion przez Web Bluetooth.
//
// UWAGA UCZCIWOŚCIOWA: w przeciwieństwie do Muse (dojrzała biblioteka muse-js) i standardu
// Heart Rate (specyfikacja Bluetooth SIG), oficjalne SDK OpenBCI dla Ganglion (@openbci/ganglion)
// to biblioteka Node.js oparta o natywny Bluetooth (noble) — nie działa w przeglądarce.
// Poniższa implementacja łączy się z Ganglion i steruje strumieniem przez udokumentowane,
// stabilne fakty (UUID usługi/charakterystyk, komendy start/stop) — to jest pewne.
// Format SKOMPRESOWANYCH próbek EEG (18-bitowa kompresja delta) jest znacznie bardziej
// złożony bitowo i NIE został tu zweryfikowany na prawdziwym sprzęcie, więc celowo nie
// zgadujemy tego algorytmu na ślepo. Zamiast tego:
//  - w pełni obsługujemy połączenie, start/stop, akcelerometr i pakiety NIESKOMPRESOWANE,
//  - pakiety skompresowane są zliczane i przekazywane jako surowe bajty, oznaczone wprost
//    jako niezdekodowane — do dopracowania z prawdziwym urządzeniem w ręku.

const GANGLION_SERVICE = '0000fe84-0000-1000-8000-00805f9b34fb';
const GANGLION_RECEIVE_CHAR = '2d30c082-f39f-4ce6-923f-3484ea480596';
const GANGLION_SEND_CHAR = '2d30c083-f39f-4ce6-923f-3484ea480596';

export interface GanglionSample {
  type: 'uncompressed' | 'compressed-undecoded' | 'accelerometer' | 'impedance';
  channels?: number[]; // µV, tylko dla pakietów niekompresowanych
  accelerometer?: { x: number; y: number; z: number };
  raw: Uint8Array;
}

export interface GanglionHandle {
  deviceName: string;
  disconnect: () => void;
}

function parsePacket(data: DataView): GanglionSample {
  const raw = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const typeByte = data.getUint8(0);

  if (typeByte === 0x00 && data.byteLength >= 13) {
    // Pakiet nieskompresowany: 4 kanały x 3 bajty (24-bit, sign-extended), big-endian.
    const channels: number[] = [];
    for (let ch = 0; ch < 4; ch++) {
      const offset = 1 + ch * 3;
      const b0 = data.getUint8(offset);
      const b1 = data.getUint8(offset + 1);
      const b2 = data.getUint8(offset + 2);
      let value = (b0 << 16) | (b1 << 8) | b2;
      if (value & 0x800000) value -= 0x1000000; // rozszerzenie znaku 24-bit
      channels.push(value);
    }
    return { type: 'uncompressed', channels, raw };
  }

  if (typeByte >= 200 && data.byteLength >= 7) {
    // Warianty pakietów akcelerometru w firmware Ganglion.
    const x = data.getInt16(1, false);
    const y = data.getInt16(3, false);
    const z = data.getInt16(5, false);
    return { type: 'accelerometer', accelerometer: { x, y, z }, raw };
  }

  return { type: 'compressed-undecoded', raw };
}

export async function connectGanglion(
  onSample: (sample: GanglionSample) => void,
  onDisconnected?: () => void,
): Promise<GanglionHandle> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [GANGLION_SERVICE] }],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('Nie udało się połączyć z urządzeniem GATT.');

  const service = await server.getPrimaryService(GANGLION_SERVICE);
  const receiveChar = await service.getCharacteristic(GANGLION_RECEIVE_CHAR);
  const sendChar = await service.getCharacteristic(GANGLION_SEND_CHAR);

  const handleNotify = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) onSample(parsePacket(target.value));
  };
  receiveChar.addEventListener('characteristicvaluechanged', handleNotify);
  await receiveChar.startNotifications();

  // 'b' = rozpocznij strumieniowanie (komenda udokumentowana przez OpenBCI)
  await sendChar.writeValue(new TextEncoder().encode('b'));

  if (onDisconnected) {
    device.addEventListener('gattserverdisconnected', () => onDisconnected(), { once: true });
  }

  return {
    deviceName: device.name ?? 'OpenBCI Ganglion',
    disconnect: () => {
      sendChar.writeValue(new TextEncoder().encode('s')).catch(() => {}); // 's' = zatrzymaj strumień
      receiveChar.removeEventListener('characteristicvaluechanged', handleNotify);
      receiveChar.stopNotifications().catch(() => {});
      device.gatt?.disconnect();
    },
  };
}
