//npm run esbuild-browser:watch

import debug from 'debug';
import { BaseDispenser } from './base/BaseDispenser';
import { printFormat } from '../utils/printFormat';
const debugLog = debug('dispenser:isoil-vega-t-v10');
export class IsoilVegaTVersion10 extends BaseDispenser {
	private totalizerBuffer = Buffer.from([
		0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0d,
	]);
	private read_sale = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0d]);
	private transaction_enable = Buffer.from([
		0x02, 0x30, 0x30, 0x31, 0x30, 0x34, 0x31, 0x31, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39,
		0x39, 0x39, 0x39, 0x39, 0x20, 0x20, 0x20, 0x20, 0x39, 0x35, 0x0d,
	]);
	private read_preset = Buffer.from([
		0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0d,
	]);
	private start = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x34, 0x20, 0x20, 0x20, 0x20, 0x43, 0x41, 0x0d]);
	private preset_dummy = Buffer.from([
		0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x32, 0x31, 0x30, 0x30, 0x31, 0x32, 0x33, 0x34, 0x31, 0x31, 0x20, 0x20, 0x20, 0x20, 0x37, 0x36,
		0x0d,
	]);
	private stop = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x35, 0x31, 0x20, 0x20, 0x20, 0x20, 0x45, 0x44, 0x0d]);
	private terminate = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x35, 0x30, 0x20, 0x20, 0x20, 0x20, 0x44, 0x44, 0x0d]);
	private inbetween_close = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x36, 0x20, 0x20, 0x20, 0x20, 0x45, 0x41, 0x0d]);
	private transaction_close = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x34, 0x37, 0x20, 0x20, 0x20, 0x20, 0x45, 0x41, 0x0d]);
	private check_nozzle_totalizer = Buffer.from([
		0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0d,
	]);

	// elockStatus() {
	//     debugLog("elockStatus", "Lock_Status");
	//     this.connection.send('Lock_Status');
	// }

	checkType() {
		return 'ISOILVEGATV10';
	}

	getExternalPump() {
		return 'false';
	}

	// elockUnlock() {
	//     debugLog("elockUnlock", "Lock_UnLock");
	//     this.connection.send('Lock_UnLock');
	// }

	// elockReset() {
	//     debugLog("elockReset", "Lock_Reset");
	//     this.connection.send('Lock_Reset');
	// }

	// elockLock() {
	//     debugLog("elockLock", "Lock_Lock");
	//     this.connection.send('Lock_Lock');
	// }

	async totalizer() {
		debugLog('totalizer: %s', 'Read_Totalizer');
		await this.connection.write(this.totalizerBuffer);
	}

	async readPreset() {
		debugLog('readPreset: %s', 'Read_Status');
		await this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
	}

	async readSale() {
		debugLog('readSale: %s', 'Read_Status');
		await this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
	}

	async readStatus() {
		debugLog('readStatus: %s', 'Read_Status');
		if (!this.connection.isOpen) return '';
		await this.connection.write(this.check_nozzle_totalizer); // response needs some statuses to be hardcoded .. will see
	}

	switchToRemote() {
		debugLog('switchToRemote: %s', 'Go_Remote');
		//TBD        this.connection.send('Go_Remote');
	}

	switchToLocal() {
		debugLog('switchToLocal: %s', 'Go_Local');
		//TBD        this.connection.send('Go_Local');
	}

	async pumpStart() {
		debugLog('startPump: %s', 'Pump_Start');
		await this.connection.write(this.transaction_enable);
	}

	async pumpStop() {
		debugLog('stopPump: %s', 'Pump_Stop');
		await this.connection.write(this.terminate);
		await this.delay(300);
		await this.connection.write(this.inbetween_close);
		await this.delay(300);
	}

	async authorizeSale() {
		debugLog('authorizeSale: %s', 'Start');
		await this.connection.write(this.start);
	}

	async setPreset(quantity: number) {
		debugLog('setPreset: %s', `Preset_QTY=${quantity}`);
		await this.sendPreset(quantity);
	}

	async sendPreset(quantity: number) {
		let J = 0,
			K = 0,
			L = 0,
			P = 0;
		const set: number = Math.floor(quantity);
		if (set < 10) {
			J = 0;
			K = 0;
			L = 0;
			P = set;
		}
		if (set > 9 && set < 100) {
			J = 0;
			K = 0;
			L = Math.floor(set / 10);
			P = set % 10;
		}
		if (set > 99 && set < 1000) {
			J = 0;
			K = Math.floor(set / 100);
			L = Math.floor((set / 10) % 10);
			P = set % 10;
		}
		if (set > 999 && set < 10000) {
			J = Math.floor(set / 1000);
			K = Math.floor((set / 100) % 10);
			L = Math.floor((set / 10) % 10);
			P = set % 10;
		}

		const one: number = 0x30 + J;
		const two: number = 0x30 + K;
		const three: number = 0x30 + L;
		const four: number = 0x30 + P;
		const BCC: number[] = [
			0x02,
			0x30,
			0x30,
			0x31,
			0x31,
			0x34,
			0x32,
			0x31,
			0x30,
			0x30,
			one,
			two,
			three,
			four,
			0x31,
			0x31,
			0x20,
			0x20,
			0x20,
			0x20,
		];
		const BCC_SIZE: number = 20;

		let checksum: number = 0;
		for (let i = 0; i < BCC_SIZE; i++) {
			checksum += BCC[i];
		}
		checksum %= 256;

		const checksumHex: string = checksum.toString(16).toUpperCase().padStart(2, '0');
		const checksum1: number = checksumHex.charCodeAt(0);
		const checksum2: number = checksumHex.charCodeAt(1);

		const volume: number[] = [
			0x02,
			0x30,
			0x30,
			0x31,
			0x31,
			0x34,
			0x32,
			0x31,
			0x30,
			0x30,
			one,
			two,
			three,
			four,
			0x31,
			0x31,
			0x20,
			0x20,
			0x20,
			0x20,
			checksum2,
			checksum1,
			0x0d,
		];

		// Uncomment to print volume array
		// for (let i = 0; i < 23; i++) {
		//     console.log(volume[i].toString(16).padStart(2, '0'));
		// }

		// Call write_command with volume array
		// write_command(volume);
		// Assuming dispencerSerial is accessible
		await this.connection.write(Buffer.from(volume));
	}

	async cancelPreset() {
		debugLog('cancelPreset: %s', 'Cancel_Preset');
		await this.sendPreset(0.0);
	}

	async suspendSale() {
		debugLog('suspendSale: %s', 'Stop');
		await this.connection.write(this.stop);
	}

	async resumeSale() {
		debugLog('resumeSale: %s', 'Resume_Sale');
		await this.connection.write(this.terminate);
		await this.delay(300);
		await this.connection.write(this.start);
		await this.delay(300);
	}

	async clearSale() {
		debugLog('clearSale: %s', 'Clear_Sale');
		await this.connection.write(this.transaction_close);
	}

	hasExternalPump() {
		debugLog('hasExternalPump: %s', 'External_Pump');
		return 'false';
	}

	readAuthorization() {
		debugLog('readAuthorization: %s', 'Read_Authorization');
		this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
	}

	processLegacyCommand(res: string) {
		debugLog('processLegacyCommand: %s', res);

		if (!res.includes('59')) {
			debugLog('processLegacyCommand: %s', 'Command failed! check for status');
			throw Error('Command failed! check for status');
		}

		debugLog('processLegacyCommand: %s', 'Command success');
		return true;
	}

	processResponseRaw(response: string[], exponentCut: number, mantessaCut: number) {
		debugLog('processResponseRaw: %s', response.join('\n'));

		if (response.length < 2) {
			debugLog('processResponseRaw: %s', 'Incompatible response');
			throw new Error('Incompatible response');
		}

		const exponent = this.hex2a(this.cutStringFromLast(response[0], exponentCut, true));
		const mantessa = this.hex2a(this.cutStringFromLast(response[1], mantessaCut, false));

		const returnString = `${exponent}.${mantessa}`;
		debugLog('processResponseRaw: %s', returnString);
		return returnString;
	}

	/**
	 * totalizer encoded to actual string helper.
	 * @param response string[]
	 * @param exponentCut number
	 * @param mantessaCut number
	 * @returns
	 */
	processResponse(response: string[], exponentCut: number, mantessaCut: number) {
		debugLog('processResponse: %s', response.join('\n'));
		const responseRaw = this.processResponseRaw(response, exponentCut, mantessaCut);
		debugLog('processResponse: %o', responseRaw);
		return parseFloat(responseRaw);
	}

	processCommand(res: string) {
		debugLog('processCommand: %s', res);
		if (!res.slice(0, -8).endsWith('3030')) {
			debugLog('processCommand: %s', 'Command failed! check for status');
			throw Error('Command failed! check for status');
		}

		debugLog('processCommand: %s', 'Command success');
		return true;
	}

	processRequestOfStartDelivery(res: string) {
		debugLog('processRequestOfStartDelivery: %s', res);

		if (res.slice(0, 38).endsWith('30')) {
			debugLog('processRequestOfStartDelivery: %s', 'Not present');
			return 'Not present';
		} else if (res.slice(0, 38).endsWith('31')) {
			debugLog('processRequestOfStartDelivery: %s', 'Request present');
			return 'Request present';
		} else {
			debugLog('processRequestOfStartDelivery: %s', 'Command failed! check for status');
			return Error('Command failed! check for status');
		}
	}

	processStatusOfRemoteStop(res: string) {
		debugLog('processStatusOfRemoteStop: %s', res);
		if (res.slice(0, -34).endsWith('30')) {
			debugLog('processStatusOfRemoteStop: %s', 'Not active');
			return 'Not active';
		} else if (res.slice(0, -34).endsWith('31')) {
			debugLog('processStatusOfRemoteStop: %s', 'Active');
			return 'Active';
		} else {
			debugLog('processStatusOfRemoteStop: %s', 'Command failed! check for status');
			return Error('Command failed! check for status');
		}
	}

	processStatusOfLocalPrinting(res: string) {
		debugLog('processStatusOfRemoteStop: %s', res);
		if (res.slice(0, -526).endsWith('30')) {
			debugLog('processStatusOfRemoteStop: %s', 'Printer not enabled');
			return 'Printer not enabled';
		} else if (res.slice(0, -526).endsWith('31')) {
			debugLog('processStatusOfRemoteStop: %s', 'Printer ON LINE');
			return 'Printer ON LINE';
		} else if (res.slice(0, -526).endsWith('32')) {
			debugLog('processStatusOfRemoteStop: %s', 'No paper');
			return 'No paper';
		} else if (res.slice(0, -526).endsWith('33')) {
			debugLog('processStatusOfRemoteStop: %s', 'Printer OFF LINE');
			return 'Printer OFF LINE';
		} else if (res.slice(0, -526).endsWith('34')) {
			debugLog('processStatusOfRemoteStop: %s', 'Printer BUSY');
			return 'Printer BUSY';
		} else if (res.slice(0, -526).endsWith('35')) {
			debugLog('processStatusOfRemoteStop: %s', 'Printing in progress');
			return 'Printing in progress';
		} else if (res.slice(0, -526).endsWith('36')) {
			debugLog('processStatusOfRemoteStop: %s', 'Print aborted');
			return 'Print aborted';
		} else if (res.slice(0, -526).endsWith('37')) {
			debugLog('processStatusOfRemoteStop: %s', 'Data not available');
			return 'Data not available';
		} else {
			debugLog('processStatusOfRemoteStop: %s', 'Command failed! check for status');
			return Error('Command failed! check for status');
		}
	}

	processStatusOfBatch(res: string) {
		debugLog('processStatusOfBatch: %s', res);
		if (res.slice(0, -32).endsWith('30')) {
			debugLog('processStatusOfBatch: %s', 'Batch not active');
			return 'Batch not active';
		} else if (res.slice(0, -32).endsWith('31')) {
			debugLog('processStatusOfBatch: %s', 'Delivery in progress');
			return 'Delivery in progress';
		} else if (res.slice(0, -32).endsWith('32')) {
			debugLog('processStatusOfBatch: %s', 'Delivery stopped');
			return 'Delivery stopped';
		} else if (res.slice(0, -32).endsWith('33')) {
			debugLog('processStatusOfBatch: %s', 'Delivery completed');
			return 'Request of store data of batch';
		} else {
			debugLog('processStatusOfBatch: %s', 'Command failed! check for status');
			throw Error('Command failed! check for status');
		}
	}

	processFlowOfProduct(res: string) {
		debugLog('processFlowOfProduct: %s', res);
		if (res.slice(0, -30).endsWith('30')) {
			debugLog('processFlowOfProduct: %s', 'No flow');
			return 'No flow';
		} else if (res.slice(0, -30).endsWith('31')) {
			debugLog('processFlowOfProduct: %s', 'Flow in progress');
			return 'flow in pogress';
		} else {
			debugLog('processFlowOfProduct: %s', 'Command failed! check for status');
			return Error('Command failed! check for status');
		}
	}
	processStatusOfStopBatch(res: string) {
		debugLog('processStatusOfStopBatch: %s', res);
		if (res.slice(0, -28).endsWith('30')) {
			debugLog('processStatusOfStopBatch: %s', 'No stop');
			return 'No stop';
		} else if (res.slice(0, -28).endsWith('31')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by operator');
			return 'Stop by operator';
		} else if (res.slice(0, -28).endsWith('32')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by remote');
			return 'Stop for faulting of power supply';
		} else if (res.slice(0, -28).endsWith('34')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by permissive absence');
			return 'Stop by permissive absence';
		} else if (res.slice(0, -28).endsWith('35')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by system alarm');
			return 'Stop by system alarm';
		} else if (res.slice(0, -28).endsWith('36')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by meter alarm');
			return 'Stop by meter alarm';
		} else if (res.slice(0, -28).endsWith('37')) {
			debugLog('processStatusOfStopBatch: %s', 'Stop by weight & measure switch absence');
			return 'Stop by weight & measure switch absence';
		} else if (res.slice(0, -28).endsWith('38')) {
			debugLog('processStatusOfStopBatch: %s', 'Remote to local commutation');
			return 'Remote to local commutation';
		} else {
			debugLog('processStatusOfStopBatch: %s', 'Command failed! check for status');
			return Error('Command failed! check for status');
		}
	}

	processStatus(res: string) {
		debugLog('processStatus: %s', res);

		const response = {
			requestOfStartDelivery: this.processRequestOfStartDelivery(res),
			remoteStop: this.processStatusOfRemoteStop(res),
			statusOfBatch: this.processStatusOfBatch(res),
			flowOfProduct: this.processFlowOfProduct(res),
			localPrinting: this.processStatusOfLocalPrinting(res),
			stopOfBatch: this.processStatusOfStopBatch(res),
		};

		debugLog('processStatus: %o', response);
		return response;
	}

	processRawReadStatus(res: string) {
		debugLog('processRawReadStatus: %s', res);

		const response = this.hex2a(res)
			.split(' ')
			.filter((e) => {
				return e ? true : false;
			});
		debugLog('processRawReadStatus: %o', response);
		return response;
	}

	processTotalizer(res: string) {
		debugLog('processTotalizer: %s', res);
		const response = parseFloat(this.processRawReadStatus(res)[7].replace(',', '.'));
		debugLog('processTotalizer: %o', response);
		return response;
	}

	processTotalizerWithBatch(res: string) {
		debugLog('processTotalizerWithBatch: %s', res);
		const response = {
			totalizer: parseFloat(this.processRawReadStatus(res)[7].replace(',', '.')),
			batchNumber: this.processBatchNumber(res) + 1, // called before pump start.. so +1
			timestamp: Date.now(),
		};
		debugLog('processTotalizerWithBatch: %o', response);
		return response;
	}

	processReadSale(res: string) {
		debugLog('processReadSale: %s', res);
		const response = parseFloat(this.processRawReadStatus(res)[12].replace(',', '.'));
		debugLog('processReadSale: %o', response);
		return response;
	}

	processReadPreset(res: string) {
		debugLog('processReadPreset: %s', res);
		const response = parseFloat(this.processRawReadStatus(res)[11].slice(0, -2));
		debugLog('processReadPreset: %o', response);
		return response;
	}

	processFlowRate(res: string) {
		debugLog('processFlowRate: %s', res);
		const response = parseInt(this.hex2a(res.slice(-82, -70)));
		debugLog('processFlowRate: %o', response);
		return response;
	}

	processAverageFlowRate(res: string) {
		debugLog('processAverageFlowRate: %s', res);
		const response = parseInt(this.hex2a(res.slice(-70, -58)));
		debugLog('processAverageFlowRate: %o', response);
		return response;
	}

	processBatchNumber(res: string) {
		debugLog('processBatchNumber: %s', res);
		const response = parseInt(this.hex2a(res.slice(242, 254)));
		debugLog('processBatchNumber: %o', response);
		return response;
	}

	hasChecksBeforePumpStart() {
		debugLog('hasChecksBeforePumpStart: %s', 'false');
		return false;
	}
	isPumpStopped(res: string) {
		debugLog('isPumpStopped: %s', res);
		const status = this.processStatus(res);
		debugLog('isPumpStopped: %o', status);
		if (status.requestOfStartDelivery == 'Request present') {
			debugLog('isPumpStopped: %s', 'false');
			return false;
		}

		debugLog('isPumpStopped: %s', 'true');
		return true;
	}

	isReadyForPreset() {
		debugLog('isReadyForPreset: %s', 'true');
		return true;
	}

	isNozzleOnHook() {
		debugLog('isNozzleOnHook: %s', 'true');
		return true;
	}

	isNozzleOffHook() {
		debugLog('isNozzleOffHook: %s', 'true');
		return true;
	}

	isOnline(res: string): boolean {
		debugLog('isOnline: %s', res);
		const readStatuses = this.processRawReadStatus(res);
		if (readStatuses.length > 0) {
			debugLog('isOnline: %s', 'true');
			return true;
		}
		debugLog('isOnline: %s', 'false');
		return false;
	}

	isPresetAvailable(): boolean {
		return true;
	}

	isNozzleCheckRequired() {
		return false;
	}

	isPrinterAvailable(res: string): boolean {
		debugLog('isPrinterAvailable: %s', res);
		const status = this.processStatus(res);
		debugLog('isPrinterAvailable: %o', status);
		if (status.localPrinting == 'Printer ON LINE') {
			debugLog('isPrinterAvailable: %s', 'true');
			return true;
		}
		debugLog('isPrinterAvailable: %s', 'false');
		return false;
	}

	isPresetVerified(res: string, quantity: number) {
		debugLog('isPresetVerified: %s', res);
		const presetValue = this.processReadPreset(res);
		if (quantity == presetValue) {
			debugLog('isPresetVerified: %s', 'true');
			return true;
		}
		debugLog('isPresetVerified: %s', 'false');
		return false;
	}

	isDispensing(res: string) {
		debugLog('isDispensing: %s', res);
		const status = this.processStatus(res);
		debugLog('isDispensing: %o', status);
		if (status.flowOfProduct == 'No flow' || status.remoteStop == 'Active') {
			debugLog('isDispensing: %s', 'false');
			return false;
		}
		debugLog('isDispensing: %s', 'true');
		return true;
	}

	isIdle(res: string) {
		debugLog('isIdle: %s', res);
		const status = this.processStatus(res);
		debugLog('isDispensing: %o', status);
		if (
			status.flowOfProduct == 'No flow' &&
			status.statusOfBatch == 'Batch not active' &&
			status.requestOfStartDelivery == 'Not present'
		) {
			debugLog('isDispensing: %s', 'false');
			return true;
		}
		debugLog('isDispensing: %s', 'true');
		return false;
	}

	isSaleCloseable() {
		debugLog('isSaleCloseable: %s', 'true');
		return true;
	}

	isSaleSuspended(res: string) {
		debugLog('isSaleSuspended: %s', res);
		const status = this.processStatus(res);
		debugLog('isDispensing: %o', status);
		if (status.flowOfProduct == 'No flow' && status.requestOfStartDelivery == 'Request present') {
			debugLog('isSaleSuspended: %s', 'true');
			return true;
		}
		debugLog('isSaleSuspended: %s', 'false');
		return false;
	}

	/**
	 * isOrderComplete
	 *
	 * @param res
	 * @param quantity
	 * @returns
	 */
	isOrderComplete(res: string, quantity: number) {
		debugLog('isOrderComplete: %s', res);
		const readsale = this.processReadSale(res);
		const totalizer = this.processTotalizer(res);
		const status = this.processStatus(res);

		if (readsale > quantity - 1) {
			const response = {
				status: true,
				state: status,
				percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
				currentFlowRate: this.processFlowRate(res),
				averageFlowRate: this.processAverageFlowRate(res),
				batchNumber: this.processBatchNumber(res),
				totalizer,
				dispensedQty: this.toFixedNumber(readsale, 2),
			};

			debugLog('isOrderComplete: %o', response);
			return response;
		}

		const response = {
			status: false,
			state: status,
			percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
			currentFlowRate: this.processFlowRate(res),
			averageFlowRate: this.processAverageFlowRate(res),
			batchNumber: this.processBatchNumber(res),
			totalizer,
			dispensedQty: this.toFixedNumber(readsale, 2),
		};

		debugLog('isOrderComplete: %o', response);
		return response;
	}

	printReceipt(printObj: any) {
		const printWidth = 33;
		const printArr = [];

		debugLog('printReceipt: %o', printObj);

		if (printObj?.isReceiptRequired) {
			printArr.push(...printFormat(printObj, 'DISPENSING SLIP'));
			printArr.push('0A1D564100');
		}

		printArr.push(...printFormat(printObj, 'PRINT COPY'));

		const recieptString = `02303031313438313030303930${printArr.join('0A')}0A2020202020`;

		debugLog('printReceipt: %s', `${recieptString}`);
		return this.printOrder(recieptString);
	}

	printOrder(printText: string): boolean {
		let i: number;
		let checksum: number = 0;

		for (i = 0; i < printText.length; i += 2) {
			checksum += this.hexStringToByte(printText, i);
		}

		checksum %= 256;

		const checksumHex: string = checksum.toString(16).padStart(2, '0'); // More concise way to get hex string

		const checksum1: number = checksumHex.charCodeAt(0);
		const checksum2: number = checksumHex.charCodeAt(1);

		// Send each character of the hex string over serial
		for (i = 0; i < printText.length; i += 2) {
			this.connection.write(this.hexStringToByte(printText, i));
		}

		this.connection.write(checksum2);
		this.connection.write(checksum1);
		return this.connection.write(0x0d);
	}
}
