//npm run esbuild-browser:watch

import debug from 'debug';
import { BaseRfid } from './BaseRfid';
import { RfidResponse } from './interface/IRfid';

const debugLog = debug('rfid:petropoint');

export class RfidPetropoint extends BaseRfid {
	checkType() {
		debugLog('rfidType: %s', 'RFID');
		return 'PETROPOINTHECTRONICS';
	}

	/** callback when there is data and process that data through processRFIDResonse before calling back */
	bind(callback: (status: unknown, data: RfidResponse | 'idle') => void): void {
		this.listen((data: any) => {
			const time = performance.now();
			const convertedData = data.toString('hex');
			debugLog(`RFID Data packet recieved at %s: %s`, time, convertedData);
			try {
				debugLog('Initiating callback for RFID data: %s', convertedData);
				return callback(null, this.processRFIDresponse(convertedData));
			} catch (e) {
				debugLog('Error in RFID callback: %o', e);
				console.error(e);
				return callback(e, 'idle');
			}
		});
	}

	processRawRfidStatus(res: string) {
		debugLog('processRawRfidStatusRequest: %s', res);
		const response = this.hex2a(res).split(',');
		debugLog('processRawRfidStatusResponse: %o', response);
		return response;
	}

	processTagstatus(res: string) {
		debugLog('processTagstatusReq: %s', res);

		if (res.endsWith('002')) {
			debugLog('processTagstatus: %s', 'TagInRange');
			return 'TagInRange';
		}
		if (res.endsWith('005')) {
			debugLog('processTagstatus: %s', 'TagNotInRange');
			return 'TagNotInRange';
		}

		debugLog('processTagstatus: %s', 'Idle');
		return 'Idle';
	}

	processTagId(res: string) {
		debugLog('processTagIdReq: %s', res);
		if (res.length > 10) {
			const tagId = BigInt(res);
			debugLog(
				'processTagId: %s',
				JSON.stringify(tagId, function (key, value) {
					if (typeof value === 'bigint') {
						return value.toString();
					} else {
						return value;
					}
				})
			);
			return tagId;
		}

		debugLog('processTagId: %s', 'Invalid TagId');
		return -1;
	}

	processRFIDresponse(res: string): RfidResponse | 'idle' {
		debugLog('processRFIDRequest: %s', res);
		const regex = /^02.*?0a/;
		const match = res.match(regex);
		if (match) {
			const rfidresponse = this.processRawRfidStatus(match[0]);
			debugLog('processRFIDresponse: %o', rfidresponse);

			const response = {
				tagStatus: this.processTagstatus(rfidresponse[0]),
				nozzleId: parseFloat(rfidresponse[1]),
				tagId: this.processTagId(rfidresponse[2]),
			};

			debugLog(
				'processRFIDresponseObject: %s',
				JSON.stringify(response, function (key, value) {
					if (typeof value === 'bigint') {
						return value.toString();
					} else {
						return value;
					}
				})
			);
			return response;
		}

		debugLog('processRFIDresponse: %s', 'idle');
		return 'idle';
	}
}
