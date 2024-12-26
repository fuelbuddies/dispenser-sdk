import { IRfid } from './interface/IRfid';
import { SerialPort } from 'serialport';
import { InterByteTimeoutParser } from '@serialport/parser-inter-byte-timeout';

export class BaseRfid implements IRfid {
	connection: SerialPort;
	innerByteTimeoutParser: InterByteTimeoutParser;

	constructor(socket: SerialPort) {
		this.connection = socket;
		this.innerByteTimeoutParser = this.connection.pipe(new InterByteTimeoutParser({ interval: 200 }));
	}

	disconnect(callback: any): void {
		this.connection.close(callback);
	}

	/**
	 * listen to innerByteTimeoutParser data with a callback
	 * @param callback
	 * @returns void
	 */
	listen(callback: (data: string) => void): void {
		this.innerByteTimeoutParser.on('data', (data: any) => {
			callback(data.toString('hex'));
		});
	}

	/**
	 * Splitter for string from last
	 * @param str
	 * @param cutLength
	 * @returns
	 */
	cutStringFromLast(str: string, cutLength: number, cutFromLast: boolean) {
		if (cutFromLast) return str.substring(str.length - cutLength);
		else return str.substring(0, cutLength);
	}

	/**
	 * hex to ascii
	 *
	 * @param hex string
	 * @returns
	 */
	hex2a(hex: string) {
		let str = '';
		for (let i = 0; i < hex.length; i += 2) {
			const v = parseInt(hex.substr(i, 2), 16);
			if (v) str += String.fromCharCode(v);
		}
		return str;
	}

	/**
	 * hex to binary string
	 * @param data
	 * @returns
	 */
	hex2bin(data: string) {
		return data
			.split('')
			.map((i) => parseInt(i, 16).toString(2).padStart(4, '0'))
			.join('');
	}

	toFixedNumber(num: number, digits: number, base?: number) {
		const pow = Math.pow(base || 10, digits);
		return Math.round(num * pow) / pow;
	}

	debugLog(message: string, data: any) {
		console.log(`[${new Date().toISOString()}] ${message}: ${JSON.stringify(data)}`);
	}
}
