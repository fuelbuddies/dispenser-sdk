import { DispenserOptions, IDispenser, TotalizerResponse } from '../interface/IDispenser';
// import { QueueObject, queue } from 'async';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { execFile } from 'child_process';
import * as path from 'path';
import { Seneca } from '../workflows/GateX';
import { promises as fs } from 'fs';
import debug from 'debug';

import ModbusRTU from 'modbus-serial';

/**
 * TODO: [TECH DEBT][IDEV-1272]
 * There are few methods, like str2hex that are being re-declared in BaseDispenser and ModBusDispenser. This is not a good practice. We should refactor this to avoid code duplication.
 */
const debugLog = debug('dispenser:modbus-dispenser');
export class ModBusDispenser implements IDispenser {
	connection: Promise<Seneca>;
	printer?: SerialPort<AutoDetectTypes>;
	pulseInterval?: NodeJS.Timeout;
	// config: WorkflowConfig;
	// host: IWorkflowHost;

	[key: string]: any;

	constructor(socket: Seneca, printer?: SerialPort, options?: DispenserOptions) {
		const _that = this;
		this.printer = printer;
		this.connection = new Promise<Seneca>((resolve) => {
			const client = new ModbusRTU();
			client.setID(socket.deviceId);
			client.setTimeout(socket.timeout);
			client.connectRTU(socket.address, { baudRate: socket.baudRate }).then(async () => {
				socket.client = client;
				const overflowCounterBuffer = await client.readHoldingRegisters(socket.overflowRegister, 1);
				const overCount = overflowCounterBuffer.buffer.readUInt16BE(0);
				socket.overflowCount = overCount;
				socket.overflowOffset = 4294967296 * overCount;

				_that.pulseInterval = setInterval(async function () {
					const pulseCounter = await client.readHoldingRegisters(socket.pulseRegister, 2);
					const currentPulse = pulseCounter.buffer.readUInt32BE(0);
					if (currentPulse < socket.pulseCount) {
						debugLog('ReadPulseCounter: %s', '<< ===== Overflow Detected ===== >>');
						const response = await client.writeRegister(socket.overflowRegister, ++socket.overflowCount);
						socket.overflowOffset = 4294967296 * socket.overflowCount;
					}
					socket.previousPulseCount = socket.pulseCount;
					socket.pulseCount = currentPulse;
				}, 500);

				resolve(socket);
			});
		});
	}

	hexToDecLittleEndian(hexString: string): number {
		const bytes = hexString.trim().split(' '); // Split on spaces, remove leading/trailing spaces
		let decimalValue = 0;

		for (let i = 0; i < bytes.length; i++) {
			const byte = bytes[i];
			const decimalByte = parseInt(byte, 16); // Parse hex byte to decimal
			decimalValue += decimalByte * Math.pow(256, bytes.length - 1 - i); // Add considering position
		}

		return decimalValue;
	}

	async processTaskMTU(task: any) {
		const { bindFunction, callee, calleeArgs } = task;
		const data = await callee.call(this, calleeArgs || undefined);
		if (bindFunction instanceof Function) {
			const result = bindFunction.call(this, data, calleeArgs || undefined, callee.name);
			debugLog('bindFunction: %s', JSON.stringify(result));
			return result;
		} else {
			return data;
		}
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
		const connection = await this.connection;
		if (this.pulseInterval) clearInterval(this.pulseInterval);

		connection.client.close(async () => {
			if (!this.printer) {
				debugLog('disconnect: %s', 'No printer connection found');
				return callback();
			}

			this.printer.close(() => {
				debugLog('disconnect: %s', 'Printer connection closed');
				callback();
			});
		});
	}

	toFixedNumber(num: number, digits: number, base?: number) {
		const pow = Math.pow(base || 10, digits);
		return Math.round(num * pow) / pow;
	}

	hexStringToByte(printText: string, needle: number): number {
		const hexPair: string = printText.substring(needle, needle + 2); // More concise way to extract substring
		return parseInt(hexPair, 16); // Use parseInt for hex conversion
	}

	async writeTotalizerToFile(datObj: TotalizerResponse): Promise<void> {
		const filename = (await this.connection).totalizerFile;
		if (!filename) {
			throw new Error('Filename is undefined or empty');
		}
		const data = JSON.stringify(datObj, function (key, value) {
			if (typeof value === 'bigint') {
				return value.toString();
			} else {
				return value;
			}
		});
		await fs.writeFile(filename, data);
		debugLog('Successfully wrote object to file: %o', data);
	}

	async readTotalizerFromFile(): Promise<TotalizerResponse> {
		const filename = (await this.connection).totalizerFile;
		if (!filename) {
			throw new Error('Filename is undefined or empty');
		}
		const data = await fs.readFile(filename, { encoding: 'utf8' });
		const obj = JSON.parse(data);
		obj.totalizer = Number(obj.totalizer);
		debugLog('Successfully read object from file: %o', obj);
		return obj as TotalizerResponse;
	}

	// Function to execute a shell script and check if the result is "true"
	async executeShellScriptAndCheck(scriptPath: string): Promise<boolean> {
		const absoluteScriptPath = path.join(__dirname, scriptPath);
		debugLog('Executing script: %s', absoluteScriptPath);

		return new Promise((resolve, reject) => {
			execFile(absoluteScriptPath, (error, stdout, stderr) => {
				if (error) {
					// If there's an error, consider the script execution unsuccessful
					debugLog('Console: %s', stderr);
					debugLog('Error: %s', error);
					resolve(false);
				} else {
					// If the script output is "true", consider the script execution successful
					resolve(stdout.trim() === 'true');
				}
			});
		});
	}
}
