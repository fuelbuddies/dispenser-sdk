import debug from 'debug';
import { BaseDispenser } from './base/BaseDispenser';
import { TotalizerResponse } from './interface/IDispenser';

const debugLog = debug('dispenser:Neogi');

export class Neogi extends BaseDispenser {
	private readonly cmd_totalizer = Buffer.from('VT\r', 'ascii');
	private readonly cmd_readStatus = Buffer.from('ST\r', 'ascii');
	private readonly cmd_cancelPreset = Buffer.from('CT\r', 'ascii');
	private readonly cmd_readSale = Buffer.from('RV\r', 'ascii');
	private readonly cmd_pumpStop = Buffer.from('TP\r', 'ascii');
	private readonly cmd_suspendSale = Buffer.from('TP\r', 'ascii');
	private readonly cmd_resumeSale = Buffer.from('SL\r', 'ascii');
	private readonly cmd_clearSale = Buffer.from('CT\r', 'ascii');
	private readonly cmd_switchToRemote = Buffer.from('DM\r', 'ascii');
	private readonly cmd_switchToLocal = Buffer.from('AM\r', 'ascii');
	private readonly nozzleStatusScript = 'scripts/Neogi/check_status.sh';

	/**
	 * Calculate checksum for Neogi protocol
	 * Sum of ASCII character codes, take last 2 DECIMAL digits
	 * Example: sum=1240 → checksum="40"
	 */
	calculateChecksum(data: string): string {
		let sum = 0;
		debugLog('calculateChecksum - input: "%s" (length: %d)', data, data.length);

		for (let i = 0; i < data.length; i++) {
			const code = data.charCodeAt(i);
			sum += code;
		}

		debugLog('calculateChecksum - total sum: %d', sum);
		const checksum = (sum % 100).toString(10).padStart(2, '0');
		debugLog('calculateChecksum - checksum (last 2 digits): %s', checksum);

		return checksum;
	}

	/**
	 * Parse response - handles TWO formats:
	 * 1. Simple acks (NO checksum): #OK%, #STIDLE%, #STCALL%, #STDISP%, #INVALID%
	 * 2. Data replies (WITH checksum): #VT0000004142.02#40%
	 */
	parseResponse(res: string): { command: string; data: string; checksum?: string; isSimpleAck: boolean } {
		// Convert hex to ASCII if needed
		const ascii = res.startsWith('#') ? res : this.hex2a(res);
		debugLog('parseResponse - ASCII: %s', ascii);

		// Check for simple ack format (no second '#')
		if (!ascii.includes('#', 1)) {
			const match = ascii.match(/#([A-Z0-9]+)%/);
			if (match) {
				debugLog('parseResponse - Simple ack detected: %s', match[1]);
				return {
					command: match[1].length >= 2 ? match[1].substring(0, 2) : match[1],
					data: match[1].length > 2 ? match[1].substring(2) : '',
					isSimpleAck: true,
				};
			}
		}

		// Data reply format with checksum: #<CMD><DATA>#<CHECKSUM>%
		const match = ascii.match(/#(.+?)#(\d{2})%/); // \d{2} for decimal digits
		if (!match) {
			throw new Error(`Invalid response format: ${ascii}`);
		}

		const content = match[1];
		const checksum = match[2];

		// Validate checksum for data replies
		// IMPORTANT: Include the closing '#' in checksum calculation
		// Protocol: checksum from first char after opening '#' up to and including closing '#'
		const contentWithHash = content + '#';
		const calculatedChecksum = this.calculateChecksum(contentWithHash);

		if (calculatedChecksum !== checksum) {
			debugLog(
				'CHECKSUM MISMATCH! Content: "%s", With hash: "%s", Calculated: %s, Expected: %s',
				content,
				contentWithHash,
				calculatedChecksum,
				checksum
			);
			throw new Error(`Checksum validation failed. Expected: ${calculatedChecksum}, Got: ${checksum}, Content: ${content}`);
		}

		debugLog('parseResponse - Data reply with valid checksum');
		return {
			command: content.substring(0, 2),
			data: content.substring(2),
			checksum,
			isSimpleAck: false,
		};
	}

	/**
	 * Build simple command with carriage return terminator (Category 1)
	 * Used for: VT, ST, LT, RV, HS, DM, AM, TP, CT, etc.
	 */
	buildCommand(cmd: string): string {
		return cmd + '\r';
	}

	/**
	 * Build command with checksum wrapper (Category 2)
	 * Format: #<data>#<checksum>%
	 * Used for: SL, SR, SE, SK, SP, SM1, SM2, SV, SA
	 */
	buildCommandWithChecksum(data: string): string {
		const checksum = this.calculateChecksum(data);
		return `#${data}#${checksum}%`;
	}

	/**
	 * Build preset command: #SL<volume>$<mode><vehicle_no>#<checksum>%
	 * @param value Volume in liters (e.g., 10.50)
	 * @param vehicleNo Optional 10-character vehicle number (e.g., "WB99AB0012")
	 * @param mode Receipt mode: '*' (no receipt), '$' (receipt), '@' (receipt+keypad vehicle), '#' (no receipt+keypad vehicle)
	 */
	buildPresetCommand(value: number, vehicleNo?: string, mode: string = '*'): string {
		// Format volume as 7 chars with decimal: XXXX.XX (e.g., "0010.50")
		const volumeStr = value.toFixed(2).padStart(7, '0');

		// Vehicle number: 10 chars (pad with spaces if shorter)
		const vehicle = vehicleNo ? vehicleNo.padEnd(10, ' ').substring(0, 10) : '          ';

		// Build: SL + volume + $ + mode + vehicle
		// Example: SL0010.50$*WB99AB0012
		const data = `SL${volumeStr}$${mode}${vehicle}`;

		debugLog('buildPresetCommand - volume: %s, data: "%s"', volumeStr, data);

		// Category 2 command - wrap with checksum
		return this.buildCommandWithChecksum(data);
	}

	/**
	 * Override dispenserResponse to add timeout and cleanup orphaned listeners
	 * Prevents listener accumulation when dispenser becomes unresponsive
	 */
	override dispenserResponse(timeoutMs: number = 20000): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				debugLog('override-dispenserResponse-Neogi: AWAITING RESPONSE');
				const handler = (data: any): void => {
					clearTimeout(timer);
					const res = data.toString('hex');
					debugLog('awaitDispenserResponse: %s', res);
					this.logDispenserMessage('received', data);
					resolve(res);
				};

				// setup timeout to clean up orphaned listner
				const timer = setTimeout(() => {
					this.innerByteTimeoutParser.removeListener('data', handler);
					debugLog('dispenserResponse: TIMEOUT - listener removed');
					reject(new Error(`Dispenser response timed out after ${timeoutMs}ms`));
				}, timeoutMs);

				//register the new listener
				this.innerByteTimeoutParser.once('data', handler);
			} catch (error) {
				reject(error);
			}
		});
	}

	// ==================== COMMAND METHODS ====================

	async totalizer() {
		debugLog('totalizer');
		await this.write(this.cmd_totalizer, 'totalizer');
		return await this.dispenserResponse();
	}

	async readStatus() {
		debugLog('readStatus');
		await this.write(this.cmd_readStatus, 'readStatus');
		return await this.dispenserResponse();
	}

	async readNozzleStatus() {
		debugLog('readNozzleStatus');
		return (await this.executeShellScriptAndCheck(this.nozzleStatusScript)) ? 'true' : 'false';
	}

	// this command takes care of authorization as well
	async setPreset(quantity: number, _productId?: number) {
		debugLog('setPreset - quantity: %s', quantity);
		await this.write(Buffer.from(this.buildPresetCommand(quantity), 'ascii'), 'setPreset');
		return await this.dispenserResponse();
	}

	async cancelPreset() {
		debugLog('cancelPreset');
		await this.write(this.cmd_cancelPreset, 'cancelPreset');
		return await this.dispenserResponse();
	}

	async readSale() {
		debugLog('readSale');
		await this.write(this.cmd_readSale, 'readSale');
		return await this.dispenserResponse();
	}

	async pumpStop() {
		debugLog('pumpStop');
		await this.write(this.cmd_pumpStop, 'pumpStop');
		return await this.dispenserResponse();
	}

	async suspendSale() {
		debugLog('suspendSale');
		await this.write(this.cmd_suspendSale, 'suspendSale');
		return await this.dispenserResponse();
	}

	async resumeSale() {
		debugLog('resumeSale');
		await this.write(this.cmd_resumeSale, 'resumeSale');
		return await this.dispenserResponse();
	}

	async clearSale() {
		debugLog('clearSale');
		await this.write(this.cmd_clearSale, 'clearSale');
		await this.dispenserResponse();
	}

	async switchToRemote() {
		debugLog('switchToRemote');
		await this.write(this.cmd_switchToRemote, 'switchToRemote');
		return await this.dispenserResponse();
	}

	async switchToLocal() {
		debugLog('switchToLocal');
		await this.write(this.cmd_switchToLocal, 'switchToLocal');
		return await this.dispenserResponse();
	}

	// ==================== PROCESSING METHODS ====================

	processTotalizer(res: string): number {
		debugLog('processTotalizer - res: %s', res);
		const parsed = this.parseResponse(res);

		// VT response format: #VT0000004142.02#40%
		// Extract numeric value from data
		const value = parseFloat(parsed.data.trim());
		debugLog('processTotalizer: %s', value);
		return value;
	}

	processTotalizerWithBatch(res: string): TotalizerResponse {
		const totalizer = this.processTotalizer(res);
		const returnObj = {
			totalizer,
			batchNumber: 0, // Neogi protocol doesn't support batch numbers
			timestamp: new Date().getTime(),
		};
		debugLog('processTotalizerWithBatch: %o', returnObj);
		return returnObj;
	}

	processStatus(res: string) {
		debugLog('processStatus - res: %s', res);
		const parsed = this.parseResponse(res);

		// ST response: IDLE, CALL, or DISP
		const state = parsed.data.trim();
		const returnObj = { state };
		debugLog('processStatus: %o', returnObj);
		return returnObj;
	}

	processCommand(res: string): boolean {
		debugLog('processCommand - res: %s', res);

		// Convert to ASCII if hex
		const ascii = res.startsWith('#') ? res : this.hex2a(res);

		// Check for #OK% response
		if (ascii.includes('#OK#') || ascii.includes('OK')) {
			debugLog('processCommand: success');
			return true;
		}

		throw new Error(`Command failed: ${ascii}`);
	}

	processRunningVolume(res: string): { volume: number } {
		debugLog('processRunningVolume - res: %s', res);
		const parsed = this.parseResponse(res);

		// RV response format: #RV0012.08#67%
		// Data: 7 chars with decimal XXXX.XX
		const volume = parseFloat(parsed.data.trim());

		debugLog('processRunningVolume: %s liters', volume);
		return {
			volume: volume,
		};
	}

	processReadSale(res: string) {
		debugLog('processReadSale - res: %s', res);
		const parsed = this.parseResponse(res);

		// LT response is 190 characters with & delimited fields
		// Format: #LT<serial>&<txn>&<fuel>&<density>&<nozzle>&<emp>&<date>&<time>&<price>&<rate>&<volume>&<vol_tot>&<amt_tot>&<rfid_emp>&<rfid_noz>&<vehicle>&<lat>&<long>&<reserved>#<checksum>%
		const data = parsed.data;
		const fields = data.split('&');

		// Parse all fields according to protocol spec
		const returnObj = {
			serialNumber: fields[0] || '',
			transactionNumber: fields[1] || '',
			fuelType: fields[2] || '',
			density: fields[3] || '',
			nozzle: fields[4] || '',
			employeeId: fields[5] || '',
			date: fields[6] || '',
			time: fields[7] || '',
			price: parseFloat(fields[8]) || 0,
			rate: parseFloat(fields[9]) || 0,
			volume: parseFloat(fields[10]) || 0,
			volumeTotalizer: parseFloat(fields[11]) || 0,
			amountTotalizer: parseFloat(fields[12]) || 0,
			rfidEmployee: fields[13] || '',
			rfidNozzle: fields[14] || '',
			vehicleNumber: fields[15] || '',
			latitude: fields[16] || '',
			longitude: fields[17] || '',
			reserved: fields[18] || '',
		};

		debugLog('processReadSale: %o', returnObj);
		return returnObj;
	}

	// ==================== STATUS CHECK METHODS ====================

	isIdle(res: string): boolean {
		const status = this.processStatus(res);
		const result = status.state === 'IDLE';
		debugLog('isIdle: %s', result);
		return result;
	}

	isDispensing(res: string): boolean {
		const status = this.processStatus(res);
		const result = status.state === 'DISP';
		debugLog('isDispensing: %s', result);
		return result;
	}

	isReadyForPreset(res: string): boolean {
		const status = this.processStatus(res);
		const result = status.state === 'IDLE';
		debugLog('isReadyForPreset: %s', result);
		return result;
	}

	isOnline(res: string): boolean {
		// If we can read status, dispenser is online
		try {
			this.processStatus(res);
			debugLog('isOnline: true');
			return true;
		} catch (e) {
			debugLog('isOnline: false');
			return false;
		}
	}

	isPresetAvailable(): boolean {
		debugLog('isPresetAvailable: true');
		return true;
	}

	isNozzleCheckRequired(): boolean {
		debugLog('isNozzleCheckRequired: true');
		return true;
	}

	isPrinterAvailable(): boolean {
		debugLog('isPrinterAvailable: false');
		return false;
	}

	isSaleCloseable(res: string): boolean {
		const status = this.processStatus(res);
		const result = status.state === 'IDLE';
		debugLog('isSaleCloseable: %s', result);
		return result;
	}

	isOrderComplete(res: string, quantity: number): any {
		// Detect if dispenser auto-sent LT response (fires when preset is reached)
		// instead of the expected RV response. LT serial number would otherwise be
		// parsed as volume by processRunningVolume, producing a corrupted dispensedQty.
		const ascii = res.startsWith('#') ? res : this.hex2a(res);
		if (ascii.startsWith('#LT')) {
			const ltData = this.processReadSale(res);
			debugLog('isOrderComplete: LT response detected (preset reached), volume: %s', ltData.volume);
			return {
				status: true,
				percentage: 100,
				dispensedQty: this.toFixedNumber(ltData.volume, 2),
			};
		}

		// Use running volume data from RV response
		const volumeData = this.processRunningVolume(res);
		const dispensed = volumeData.volume;

		const percentage = (dispensed / quantity) * 100;

		const result = {
			status: dispensed >= quantity,
			percentage: this.toFixedNumber(percentage, 2),
			dispensedQty: this.toFixedNumber(dispensed, 2),
		};

		debugLog('isOrderComplete: %o', result);
		return result;
	}

	checkType(): string {
		debugLog('checkType: NEOGI');
		return 'NEOGI';
	}
}
