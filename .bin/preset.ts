#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';
import { delay } from '../utils/delay';

const debugLog = debug('dispenser:main');

const qty = process.argv[2] || 69;

const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
	// console.log(dispenser);
	dispenser.execute(dispenser.setPreset, dispenser.processCommand, qty).then((totalizer) => {
		dispenser.disconnect(() => {
			console.log('Disconnected');
		});
		console.log(totalizer);
	});
});
