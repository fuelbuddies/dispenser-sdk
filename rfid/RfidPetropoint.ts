//npm run esbuild-browser:watch

import debug from 'debug';
import { BaseRfid } from './BaseRfid';
import { RfidResponse } from './interface/IRfid';

const debugLog = debug('dispenser:rfid-petropoint');

export class RfidPetropoint extends BaseRfid {
	checkType() {
		debugLog('rfidType: %s', 'RFID');
		return 'PETROPOINTHECTRONICS';
	}

	/** callback when there is data and process that data through processRFIDResonse before calling back */
	bind(callback: (status: unknown, data: RfidResponse | 'idle') => void): void {
		this.listen((data: any) => {
			try {
				callback(null, this.processRFIDresponse(data.toString('hex')));
			} catch (e) {
				callback(e, 'idle');
			}
		});
	}

	processRawRfidStatus(res: string) {
		debugLog('processRawRfidStatus: %s', res);
		const response = this.hex2a(res).split(',');
		debugLog('processRawRfidStatus: %o', response);
		return response;
	}

	processTagstatus(res: string) {
		debugLog('processTagstatus: %s', res);

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
		debugLog('processTagId: %s', res);
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
		debugLog('processRFIDresponse: %s', res);
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
				'processRFIDresponse: %s',
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
