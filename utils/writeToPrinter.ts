import { SerialPort } from 'serialport';
import { delay } from './delay';

/** Bytes per write: well under the ~5 KB a TCS3000 printer took before it started dropping bytes. */
const CHUNK_BYTES = 800;
/**
 * Pause after each chunk while the printer prints it. 800 B per 3.8 s is ~210 B/s, under the
 * ~300 B/s a TCS3000 truck's printer managed: a 1 s pause still lost the end of a 31-asset slip.
 */
const PAUSE_MS = 3000;

/**
 * Send a slip to a printer that may not pace us itself. One large write overruns the
 * printer's receive buffer and it silently drops the overflow, so a 25-asset detailed slip
 * lost everything after asset 16. Send it in chunks instead: wait for each chunk to leave
 * the port, then pause while the printer prints it. Resolves once the last byte is out.
 *
 * The port also honours XON/XOFF (see main.ts), so a printer that sends XOFF holds the drain
 * until its XON; the pause is the fallback for printers that never send it.
 */
export async function writeToPrinter(printer: SerialPort, data: Buffer): Promise<void> {
	for (let offset = 0; offset < data.length; offset += CHUNK_BYTES) {
		printer.write(data.subarray(offset, offset + CHUNK_BYTES));
		await new Promise<void>((resolve, reject) => printer.drain((err) => (err ? reject(err) : resolve())));
		if (offset + CHUNK_BYTES < data.length) await delay(PAUSE_MS);
	}
}
