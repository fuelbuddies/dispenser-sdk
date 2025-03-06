#!/usr/bin/env ts-node

import { createRfid } from '../../main';
import debug from 'debug';
import { getRFIDConfigFromEnv } from '../../utils/envParser';
import { RfidResponse } from '../../rfid/interface/IRfid';

const debugLog = debug('dispenser:main');
const configuration = getRFIDConfigFromEnv();
debugLog('Configuration: %O', configuration);
createRfid(configuration).then((rfid) => {
	// console.log(dispenser);
	const rfidCallback = (error: unknown, data: RfidResponse | 'idle') => {
		if (error) {
			console.error('Error reading RFID:', error);
			return;
		}

		if (data === 'idle') {
			console.log('RFID Reader is idle.');
			return;
		}

		console.log('RFID Data Received:', data);

		// Example: Handling tag status
		if (data.tagStatus === 'TagInRange') {
			console.log('Tag detected:', data.tagId);
		} else if (data.tagStatus === 'TagNotInRange') {
			console.log('Tag removed.');
		}
	};

	// Start listening for RFID responses
	rfid.bind!(rfidCallback);
});
