import { DispenserOptions, IDispenser } from '../interface/IDispenser';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { InterByteTimeoutParser } from '@serialport/parser-inter-byte-timeout';
import debug from 'debug';
import { execFile } from 'child_process';
import * as path from 'path';
import { getPubSubLogger, PubSubLogger, MessagePayload } from '../../utils/PubSubLogger';

const debugLog = debug('dispenser:base-dispenser');

export class BaseDispenser implements IDispenser {
	connection: SerialPort<AutoDetectTypes>;
	innerByteTimeoutParser: InterByteTimeoutParser;
	options: DispenserOptions;
	private pubsubLogger?: PubSubLogger;
	[key: string]: any;

	constructor(socket: SerialPort, options: DispenserOptions) {
		this.connection = socket;
		this.options = options;
		// Adjust concurrency as needed
		this.innerByteTimeoutParser = this.connection.pipe(
			new InterByteTimeoutParser({ interval: options?.interByteTimeoutInterval || 300 })
		);

		try {
			const pubsubConfig = this.options.pubsubConfig;
			if (pubsubConfig && pubsubConfig.enabled !== false) {
				this.pubsubLogger = getPubSubLogger(pubsubConfig);
				debugLog('PubSub logger initialized');
			}
		} catch (error) {
			debugLog('Failed to initialize PubSub logger: %O', error);
		}
	}

	private async logDispenserMessage(
		messageType: 'sent' | 'received',
		data: Buffer,
		command?: string
	): Promise<void> {
		if (!this.pubsubLogger) return;

		try {
			const message: MessagePayload = {
				dispenserId: this.options.dispenserId || 'unknown',
				dispenserType: this.options.dispenserType,
				messageType,
				command,
				data,
				timestamp: new Date(),
				metadata: {
					pumpAddress: this.options.pumpAddress || 'unknown',
					interByteTimeoutInterval: this.options.interByteTimeoutInterval
				}
			};

			await this.pubsubLogger.logMessage(message);
		} catch (error) {
			debugLog('Failed to log message to PubSub: %O', error);
		}
	}

	dispenserResponse(): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				debugLog('dispenserResponse: AWAITING RESPONSE');
				this.innerByteTimeoutParser.once('data', (data: any): void => {
					var res = data.toString('hex');
					debugLog('awaitDispenserResponse: %s', res);
					this.logDispenserMessage('received', data);
					resolve(res);
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	execute(callee: any, bindFunction?: (...args: any[]) => unknown, calleeArgs: any = undefined): Promise<any> {
		return new Promise((resolve, reject) => {
			Promise.resolve(callee.call(this, calleeArgs || undefined))
				.then(async (data: any) => {
					if (bindFunction instanceof Function) {
						const result = await bindFunction.call(this, data, calleeArgs || undefined, callee.name);
						debugLog('bindFunction: %s', JSON.stringify(result));
						resolve(result);
					} else {
						resolve(data);
					}
				})
				.catch((err: any) => {
					reject(err);
				});
		});
	}

	executeWork(strCallee: string, strBindFunction?: string, calleeArgs: any = undefined): Promise<any> {
		const callee = this[strCallee] as (...args: [any]) => any;
		const bindFunction = strBindFunction ? this[strBindFunction] : undefined;
		if (!callee) throw new Error('Invalid callee function');
		if (bindFunction && !(bindFunction instanceof Function)) throw new Error('Invalid Bind function');
		return this.execute(callee, bindFunction, calleeArgs);
	}

	executeInPriority(callee: any, bindFunction: any = undefined, calleeArgs: any = undefined): Promise<any> {
		return this.execute(callee, bindFunction, calleeArgs);
	}

	async disconnect(callback: any) {
		debugLog('disconnect: %s', 'Requesting disconnection from Seneca');

		if (this.pubsubLogger) {
			await this.pubsubLogger.flush();
		}

		const connection = await this.connection;

		connection.close(async () => {
			// if (!this.printer) {
			// debugLog("disconnect: %s", "No printer connection found");
			return callback();
			// }

			// this.printer.close(() => {
			//     debugLog("disconnect: %s", "Printer connection closed");
			//     callback();
			// });
		});
	}

	protected async write(data: Buffer | string, command?: string): Promise<boolean> {
		const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex');
		await this.logDispenserMessage('sent', buffer, command);
		return await this.connection.write(buffer);
	}

	/**
	 * Splitter for string from last
	 * @param str
	 * @param cutLength
	 * @returns
	 */
	cutStringFromLast(str: string, cutLength: number, cutFromLast: boolean) {
		if (cutFromLast) {
			return str.substring(str.length - cutLength);
		}
		return str.substring(0, cutLength);
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

	hexToFloat(hexString: string) {
		//bigindian hex to float
		const hex = parseInt(hexString, 16);
		const sign = hex >> 31 ? -1 : 1;
		const exponent = (hex >> 23) & 0xff;
		return ((sign * ((hex & 0x7fffff) | 0x800000) * 1.0) / Math.pow(2, 23)) * Math.pow(2, exponent - 127);
	}

	hexStringToByte(printText: string, needle: number): number {
		const hexPair: string = printText.substring(needle, needle + 2); // More concise way to extract substring
		return parseInt(hexPair, 16); // Use parseInt for hex conversion
	}

	hexToNumber(str: string) {
		// Pad the string with zeroes to 16 characters.
		// You can omit this if you control your inputs.
		// str = (str + "0000000000000000").slice(0,16);
		if (str.length < 16) {
			throw new Error('Invalid Hex for number conversion');
		}

		// Split into bits: sign (1), exponent (11), significand (52).
		const sign_and_exponent_bits = parseInt(str.slice(0, 3), 16);
		const sign = sign_and_exponent_bits >= 0x800 ? -1 : +1;
		const exponent_bits = sign_and_exponent_bits & ((1 << 11) - 1);
		const significand_bits = parseInt(str.slice(3, 16), 16);

		// Classify the floating-point value.
		if (exponent_bits == 0x7ff)
			// infinity | not a number
			return significand_bits == 0 ? sign * Number.POSITIVE_INFINITY : Number.NaN;
		else if (exponent_bits == 0)
			// zero | subnormal number
			return sign * Math.pow(2, 1 - 1023 - 52) * significand_bits; // normal number
		else return sign * Math.pow(2, exponent_bits - 1023 - 52) * (Math.pow(2, 52) + significand_bits);
	}

	toFixedNumber(num: number, digits: number, base?: number) {
		const pow = Math.pow(base || 10, digits);
		return Math.round(num * pow) / pow;
	}

	decimalToBinaryTwosComplement(decimal: number, bitWidth: number) {
		const absValue = Math.abs(decimal);
		const binary = absValue.toString(2).padStart(bitWidth - 1, '0');
		return decimal >= 0
			? binary.padStart(bitWidth, '0')
			: ('1' + binary).replace(/[01]/g, (bit: string) => (parseInt(bit, 10) ^ 1).toString(2));
	}

	delay(milliseconds: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, milliseconds);
		});
	}

	doubleToHex(value: number): string {
		const buffer = new ArrayBuffer(8); // 8 bytes for double precision
		const view = new DataView(buffer);
		view.setFloat64(0, value, false); // Write the double in big-endian format
		return Array.from(new Uint8Array(buffer))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}

	// Function to execute a shell script and check if the result is "true"
	executeShellScriptAndCheck(scriptPath: string): Promise<boolean> {
		const absoluteScriptPath = path.join(__dirname, scriptPath);
		debugLog('Executing script: %s', absoluteScriptPath);

		return new Promise((resolve, reject) => {
			execFile(absoluteScriptPath, (error, stdout, stderr) => {
				debugLog('stdout: %s', stdout);
				debugLog('stderr: %s', stderr);
				debugLog('error: %s', error);
				if (error) {
					// If there's an error, consider the script execution unsuccessful
					debugLog('Console: %s', stderr);
					debugLog('Error: %s', error);
					reject(false);
				} else {
					// If the script output is "true", consider the script execution successful
					resolve(stdout.trim() == 'true');
				}
			});
		});
	}
}
