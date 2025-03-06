#!/usr/bin/env ts-node

import { createRfid } from '../../main';
import debug from 'debug';
import { getRFIDConfigFromEnv } from '../../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getRFIDConfigFromEnv();
debugLog('Configuration: %O', configuration);
createRfid(configuration).then((rfid) => {
	// console.log(dispenser);
	const type = rfid.checkType!();
	return rfid.disconnect(() => {
		console.log(type);
		console.log('Disconnected');
	});
});
