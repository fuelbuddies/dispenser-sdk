#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.resumeSale, dispenser.processCommand).then((totalizer) => {
        console.log("THE ANSWER FOR THIS RESUME SALE IS ", totalizer);
        dispenser.disconnect(() => {
            console.log('Disconnected');
        });
        
    });
});