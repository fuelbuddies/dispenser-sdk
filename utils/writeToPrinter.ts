import { SerialPort } from 'serialport';
import { delay } from './delay';

/** Bytes per write: well under the ~5 KB a TCS3000 printer took before it started dropping bytes. */
const CHUNK_BYTES = 1024;
/** Pause after each chunk while the printer prints it. */
const PAUSE_MS = 1000;

/**
 * Send a slip to a printer on a port with no flow control. One large write overruns the
 * printer's receive buffer and it silently drops the overflow, so a 25-asset detailed slip
 * lost everything after asset 16. Send it in chunks instead: wait for each chunk to leave
 * the port, then pause while the printer prints it. Resolves once the last byte is out.
 */
export async function writeToPrinter(printer: SerialPort, data: Buffer): Promise<void> {
	for (let offset = 0; offset < data.length; offset += CHUNK_BYTES) {
		printer.write(data.subarray(offset, offset + CHUNK_BYTES));
		await new Promise<void>((resolve, reject) => printer.drain((err) => (err ? reject(err) : resolve())));
		if (offset + CHUNK_BYTES < data.length) await delay(PAUSE_MS);
	}
}
