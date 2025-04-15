import { ModBusDispenser } from './base/ModBusDispenser';
import { DispenserOptions, TotalizerResponse, VolumeResponse } from './interface/IDispenser';
import { SerialPort } from 'serialport';
import { Seneca } from './workflows/GateX';
import debug from 'debug';
import { printFormat } from '../utils/printFormat';
const debugLog = debug('dispenser:GateX');
export class GateX extends ModBusDispenser {
	private AuthorizeValveGPIO: number = 26;
	private kFactor: number;
	private startTotalizer: TotalizerResponse | undefined;

	private preset: number;

	constructor(socket: Seneca, printer: SerialPort, options: DispenserOptions) {
		super(socket, printer, options);
		let { kFactor } = options;
		if (!kFactor || kFactor < 0) {
			debugLog('K-Factor not set for this dispenser, you might get wrong totalizer value: %o', kFactor);
		}
		this.kFactor = kFactor || 1;
		this.preset = 0;
	}

	async totalizer() {
		debugLog('totalizer: %s', 'awaiting connection');
		const seneca = await this.connection;
		debugLog('totalizer: %s', 'awaiting readPulse');
		return seneca.readPulse();
	}

	async readSale() {
		if (!this.startTotalizer) {
			this.startTotalizer = await this.readTotalizerFromFile();
		}
		return await this.totalizer();
	}

	async readStatus() {
		return (await this.executeShellScriptAndCheck('scripts/GateX/status.sh')) ? 'true' : 'false';
	}

	processTotalizerRes(pulse: any): TotalizerResponse {
		debugLog('pulse: %o', pulse);

		var totalizer = {
			totalizer: this.toFixedNumber(pulse / this.kFactor, 2),
			batchNumber: pulse,
			timestamp: new Date().getTime(),
		} as TotalizerResponse;

		// if(!this.startTotalizer) {
		//     this.startTotalizer = totalizer;
		// }
		debugLog('totalizer: %o', totalizer);
		return totalizer;
	}

	processTotalizer(data: any) {
		debugLog('processTotalizer: %o', arguments);
		return this.processTotalizerRes(data).totalizer;
	}

	processTotalizerWithBatch(data: any): TotalizerResponse {
		debugLog('processTotalizerWithBatch: %o', arguments);
		return this.processTotalizerRes(data);
	}

	isIdle(res: string) {
		debugLog('isSaleCloseable: %s', 'true');
		return res.trim() === 'false';
	}

	isSaleCloseable() {
		debugLog('isSaleCloseable: %s', 'true');
		return true;
	}

	isDispensing(res: string) {
		debugLog('isDispensing: %s', res);
		return res.trim() === 'true';
	}

	isPumpStopped(res: string) {
		debugLog('isPumpStopped: %s', res);
		return res.trim() === 'false';
	}

	isOnline() {
		return true;
	}

	isOrderComplete(res: any, quantity: number) {
		const currentTotalizer = this.processTotalizerRes(res);
		const readsale = this.calculateVolume(this.startTotalizer, currentTotalizer);
		if (readsale.volume > quantity - 1) {
			const response = {
				status: true,
				percentage: this.toFixedNumber((readsale.volume / quantity) * 100, 2),
				currentFlowRate: readsale.litersPerMinute,
				averageFlowRate: readsale.litersPerMinute,
				batchNumber: this.startTotalizer?.batchNumber || 0,
				totalizer: currentTotalizer.totalizer,
				dispensedQty: this.toFixedNumber(readsale.volume, 2),
			};

			debugLog('isOrderComplete: %o', response);
			return response;
		}

		const response = {
			status: false,
			currentFlowRate: readsale.litersPerMinute,
			averageFlowRate: readsale.litersPerMinute,
			batchNumber: this.startTotalizer?.batchNumber || 0,
			totalizer: currentTotalizer.totalizer,
			dispensedQty: this.toFixedNumber(readsale.volume, 2),
		};

		debugLog('isOrderComplete: %o', response);
		return response;
	}

	checkType() {
		return 'GATEX';
	}

	getExternalPump() {
		return 'false';
	}

	async authorizeSale() {
		try {
			if (!this.startTotalizer) {
				const totalizer = await this.processTotalizerRes(await this.totalizer()); //This will initialize startTotalizer.
				this.startTotalizer = totalizer;
			}

			if (!this.startTotalizer) {
				throw new Error('Totalizer not initialized');
			}

			this.writeTotalizerToFile(this.startTotalizer);
			return (await this.executeShellScriptAndCheck('scripts/GateX/authorize.sh')) ? 'true' : 'false';
		} catch (error) {
			console.error(error);
			return 'false';
		}
	}

	async pumpStop() {
		try {
			return (await this.executeShellScriptAndCheck('scripts/GateX/unauthorize.sh')) ? 'true' : 'false';
		} catch (error) {
			console.error(error);
			return 'false';
		}
	}

	async suspendSale() {
		debugLog('suspendSale: %s', 'Stop');
		return await this.pumpStop();
	}

	isSaleSuspended(res: string) {
		return res === 'false'; // GPIO pin is low now if solinoid is closed.
	}

	processCommand(res: string) {
		if (res === 'true') {
			return true;
		}

		return false;
	}

	processReadPreset(res: string) {
		return parseInt(res);
	}

	pumpStart() {
		return 'true';
	}

	readAuth() {
		return 'true';
	}

	cancelPreset() {
		this.preset = 0;
		return 'true';
	}

	resumeDispencer() {
		return 'true';
	}

	setPreset(quantity: number) {
		this.preset = quantity;
		return 'true';
	}

	isReadyForPreset() {
		return false;
	}

	isPresetAvailable(): boolean {
		return false;
	}

	isNozzleCheckRequired(): boolean {
		return false;
	}

	isPrinterAvailable(res: string): boolean {
		return this.printer?.isOpen || false;
	}

	readPreset() {
		return this.preset;
	}

	clearSale() {
		this.preset = 0;
		this.startTotalizer = undefined;
		return 'true';
	}

	calculateVolume(previousTotalizer: TotalizerResponse | undefined, currentTotalizer: TotalizerResponse): VolumeResponse {
		// Check if timestamps are valid and current timestamp is greater than previous
		if (
			!previousTotalizer ||
			!currentTotalizer.timestamp ||
			!previousTotalizer.timestamp ||
			currentTotalizer.timestamp <= previousTotalizer.timestamp
		) {
			debugLog('calculateVolume: %o', { previousTotalizer, currentTotalizer });
			throw new Error('Invalid data or timestamps not in order'); // Invalid data or timestamps not in order
		}

		// Calculate the time difference in minutes
		const timeDifferenceInMinutes = (currentTotalizer.timestamp - previousTotalizer.timestamp) / 60000;

		// Calculate the volume difference (assuming totalizer represents volume)
		const volumeDifference = currentTotalizer.totalizer - previousTotalizer.totalizer;
		return {
			volume: volumeDifference,
			litersPerMinute: this.toFixedNumber(volumeDifference / timeDifferenceInMinutes, 2),
		};
	}

	printReceipt(printObj: any) {
		const printArr = [];

		debugLog('printReceipt: %o', printObj);

		if (printObj?.isReceiptRequired) {
			printArr.push(...printFormat(printObj, 'DISPENSING SLIP'));
			printArr.push('0A');
			printArr.push('0A0A0A1D564100');
		}

		printArr.push(...printFormat(printObj, 'PRINT COPY'));

		const recieptString = `${printArr.join('0A')}0A0A1D564200`;

		debugLog('printReceipt: %s', `${recieptString}`);
		return this.printOrder(recieptString);
	}

	printOrder(printText: string): boolean {
		if (!this.printer) {
			throw new Error('Printer is required for GateX dispenser');
		}

		const buffer = Buffer.from(printText, 'hex');
		this.printer.write(buffer);
		return true;
	}

	// ...
}
