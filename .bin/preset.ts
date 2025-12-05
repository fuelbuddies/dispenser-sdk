#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';
import { delay } from '../utils/delay';

const debugLog = debug('dispenser:main');

const qty = process.argv[2] || 69;
const productId = process.argv[3] ? parseInt(process.argv[3]) : undefined;

const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
	// console.log(dispenser);
	// Pass arguments as array to support multiple parameters
	const args = productId !== undefined ? [qty, productId] : [qty];
	dispenser.execute(dispenser.setPreset, dispenser.processCommand, args).then((totalizer) => {
		dispenser.disconnect(() => {
			console.log('Disconnected');
		});
		console.log(totalizer);
	});
});
