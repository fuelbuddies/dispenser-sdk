#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';

const debugLog = debug('dispenser:main');

const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
	try {
		dispenser.execute(dispenser.suspendSale, dispenser.processCommand, 1000).then((presetStatus) => {
			debugLog('suspendSale: %o', presetStatus);
			dispenser.execute(dispenser.pumpStop, dispenser.processCommand).then((pumpStatus) => {
				debugLog('pumpStop: %o', pumpStatus);
				dispenser.execute(dispenser.clearSale, dispenser.processCommand).then((clearStatus) => {
					debugLog('clearSale: %o', clearStatus);
					dispenser.disconnect(() => {
						debugLog('Disconnected');
					});
				});
			});
		});
	} catch (error) {
		debugLog(error);
	}
});
