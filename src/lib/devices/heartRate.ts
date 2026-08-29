// Standardowa usługa Bluetooth GATT "Heart Rate" (0x180D/0x2A37, specyfikacja Bluetooth SIG).
// Działa z każdym urządzeniem zgodnym ze standardem — Polar H10/H9/OH1, wiele zegarków itd.

const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;
const BATTERY_SERVICE = 0x180f;
const BATTERY_LEVEL = 0x2a19;

export interface HeartRateReading {
  bpm: number;
  rrIntervalsMs: number[];
}

export interface HeartRateSensorHandle {
  deviceName: string;
  disconnect: () => void;
}

function parseHeartRateMeasurement(value: DataView): HeartRateReading {
  const flags = value.getUint8(0);
  const is16Bit = (flags & 0x1) !== 0;
  let index = 1;

  let bpm: number;
  if (is16Bit) {
    bpm = value.getUint16(index, true);
    index += 2;
  } else {
    bpm = value.getUint8(index);
    index += 1;
  }

  const hasEnergyExpended = (flags & 0x8) !== 0;
  if (hasEnergyExpended) index += 2;

  const hasRR = (flags & 0x10) !== 0;
  const rrIntervalsMs: number[] = [];
  if (hasRR) {
    while (index + 1 < value.byteLength) {
      const rr = value.getUint16(index, true);
      // jednostka natywna to 1/1024 sekundy
      rrIntervalsMs.push(Math.round((rr / 1024) * 1000));
      index += 2;
    }
  }

  return { bpm, rrIntervalsMs };
}

export async function connectHeartRateSensor(
  onReading: (reading: HeartRateReading) => void,
  onBatteryLevel?: (percent: number) => void,
  onDisconnected?: () => void,
): Promise<HeartRateSensorHandle> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
    optionalServices: [BATTERY_SERVICE],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('Nie udało się połączyć z urządzeniem GATT.');

  const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
  const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);

  const handleNotify = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) onReading(parseHeartRateMeasurement(target.value));
  };
  hrChar.addEventListener('characteristicvaluechanged', handleNotify);
  await hrChar.startNotifications();

  if (onBatteryLevel) {
    try {
      const battService = await server.getPrimaryService(BATTERY_SERVICE);
      const battChar = await battService.getCharacteristic(BATTERY_LEVEL);
      const val = await battChar.readValue();
      onBatteryLevel(val.getUint8(0));
    } catch {
      // brak usługi baterii w tym urządzeniu — pomijamy, to nieobowiązkowe
    }
  }

  if (onDisconnected) {
    device.addEventListener('gattserverdisconnected', () => onDisconnected(), { once: true });
  }

  return {
    deviceName: device.name ?? 'Czujnik tętna',
    disconnect: () => {
      hrChar.removeEventListener('characteristicvaluechanged', handleNotify);
      hrChar.stopNotifications().catch(() => {});
      device.gatt?.disconnect();
    },
  };
}
