import { SerialPort } from 'serialport';
import { delay } from './delay';

/** Bytes per write: well under the ~5 KB a TCS3000 printer took before it started dropping bytes. */
const CHUNK_BYTES = 800;
/**
 * Pause after each chunk while the printer prints it. 800 B per 3.8 s is ~210 B/s, under the
 * ~300 B/s a TCS3000 truck's printer managed: a 1 s pause still lost the end of a 31-asset slip.
 */
const PAUSE_MS = 3000;

// Paced chunks: the printer silently drops whatever overflows its buffer. XON/XOFF (main.ts)
// holds drain() when the printer sends it; PAUSE_MS covers printers that don't.
export async function writeToPrinter(printer: SerialPort, data: Buffer): Promise<void> {
	for (let offset = 0; offset < data.length; offset += CHUNK_BYTES) {
		printer.write(data.subarray(offset, offset + CHUNK_BYTES));
		await new Promise<void>((resolve, reject) => printer.drain((err) => (err ? reject(err) : resolve())));
		if (offset + CHUNK_BYTES < data.length) await delay(PAUSE_MS);
	}
}
