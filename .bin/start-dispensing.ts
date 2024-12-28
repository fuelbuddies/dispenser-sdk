#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';
import { delay } from '../utils/delay';

const debugLog = debug('dispenser:main');

const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
	try {
		dispenser.execute(dispenser.setPreset, dispenser.processCommand, 1000).then((presetStatus) => {
			debugLog('presetStatus: %o', presetStatus);
			delay(500).then(() => {
				dispenser.execute(dispenser.pumpStart, dispenser.processCommand).then((pumpStatus) => {
					debugLog('pumpStatus: %o', pumpStatus);
					delay(500).then(() => {
						dispenser.execute(dispenser.authorizeSale, dispenser.processCommand).then((totalizer) => {
							dispenser.disconnect(() => {
								debugLog('Disconnected');
							});
							debugLog(totalizer);
						});
					});
				});
			});
		});
	} catch (error) {
		debugLog(error);
	}
	// console.log(dispenser);
});
