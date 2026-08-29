// Muse 2 / Muse S przez Web Bluetooth, z użyciem biblioteki muse-js (dojrzała, otwarta,
// szeroko używana w projektach EEG w przeglądarce).
import { MuseClient, zipSamples, channelNames, type EEGSample } from 'muse-js';

export { channelNames };
export type { EEGSample };

export interface MuseHandle {
  deviceName: string;
  disconnect: () => void;
}

export async function connectMuse(
  onSample: (sample: EEGSample) => void,
  onStatusChange?: (connected: boolean) => void,
): Promise<MuseHandle> {
  const client = new MuseClient();
  client.connectionStatus.subscribe((connected) => onStatusChange?.(connected));

  await client.connect();
  await client.start();

  const subscription = zipSamples(client.eegReadings).subscribe(onSample);

  return {
    deviceName: client.deviceName ?? 'Muse',
    disconnect: () => {
      subscription.unsubscribe();
      client.disconnect();
    },
  };
}
